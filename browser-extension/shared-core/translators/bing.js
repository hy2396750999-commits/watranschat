/* =====================================================================
 * WATransChat shared-core · translators/bing.js
 * 微软翻译（免 key 尽力流程）：
 *   1) GET https://www.bing.com/translator 从 HTML 提取 IG / IID / token / key
 *   2) POST https://www.bing.com/ttranslatev3?isVertical=1&IG=..&IID=..
 *      表单 fromLang/toLang/text/token/key，解析 [0].translations[0].text
 * 环境取不到 token 时 reject，交由 modules/translate.js 的降级逻辑接管。
 * 纯 JS，挂载到 window.WTC.engines.bing，网络一律走 WTC.net.http。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};
  WTC.engines = WTC.engines || {};

  var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

  /* Bing 语言码：简繁中文与 Google 不同 */
  function mapLang(l) {
    l = l || '';
    if (l === 'auto') return 'auto-detect';
    if (l === 'zh-CN' || l === 'zh-Hans') return 'zh-Hans';
    if (l === 'zh-TW' || l === 'zh-Hant') return 'zh-Hant';
    return l;
  }

  /* 从 translator 页面 HTML 提取 IG / IID / token / key（多套正则兜底） */
  function fetchSession() {
    return WTC.net.http('https://www.bing.com/translator', {
      method: 'GET',
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }
    }).then(function (r) {
      var html = (r && r.body) || '';
      if (!html) throw new Error('Bing 页面为空');

      var ig = (html.match(/IG\s*[:=]\s*["']([A-Za-z0-9_\-]+)["']/) || [])[1];
      var iid = (html.match(/IID\s*=\s*([A-Za-z0-9_.\-]+)/) || [])[1]
        || (html.match(/data-iid=["']([^"']+)["']/) || [])[1];

      var key = null, token = null;
      /* 新版页面：params_RichTranslateHelper = [key, "token", ...] */
      var m1 = html.match(/params_RichTranslateHelper\s*=\s*\[\s*(\d+)\s*,\s*"([^"]+)"/);
      if (m1) { key = m1[1]; token = m1[2]; }
      /* 兜底：AbusePreventionHelper = [key, "token", ...] */
      if (!token) {
        var m2 = html.match(/AbusePreventionHelper\s*=\s*\[\s*(\d+)\s*,\s*"([^"]+)"/);
        if (m2) { key = m2[1]; token = m2[2]; }
      }
      /* 再兜底：单独抓 token 字段 */
      if (!token) token = (html.match(/"token"\s*:\s*"([^"]+)"/) || [])[1];
      if (!key) key = (html.match(/"key"\s*:\s*(\d+)/) || [])[1];

      if (!ig || !token || !key) {
        throw new Error('页面未返回 IG/token/key（可能被限流或页面改版）');
      }
      return { ig: ig, iid: iid || 'translator.5024', key: key, token: token };
    });
  }

  WTC.engines.bing = {
    id: 'bing',
    name: '微软翻译',
    /* translate(text, from, to, state) -> Promise<string> */
    translate: function (text, from, to, state) {
      return fetchSession().then(function (sess) {
        var query = '?isVertical=1&IG=' + encodeURIComponent(sess.ig) +
          '&IID=' + encodeURIComponent(sess.iid);
        var body = 'fromLang=' + encodeURIComponent(mapLang(from)) +
          '&toLang=' + encodeURIComponent(mapLang(to)) +
          '&text=' + encodeURIComponent(text) +
          '&token=' + encodeURIComponent(sess.token) +
          '&key=' + encodeURIComponent(sess.key) +
          '&tryFetchGendered=false';

        return WTC.net.http('https://www.bing.com/ttranslatev3' + query, {
          method: 'POST',
          headers: {
            'User-Agent': UA,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': 'https://www.bing.com/translator',
            'Origin': 'https://www.bing.com',
            'Accept-Language': 'en-US,en;q=0.9'
          },
          body: body
        });
      }).then(function (r) {
        var data = JSON.parse(r.body);
        if (!Array.isArray(data) || !data[0] || !data[0].translations) {
          throw new Error('Bing 返回格式异常：' + r.status);
        }
        return data[0].translations[0].text;
      }).catch(function (e) {
        throw new Error('Bing 暂不可用，已尝试免 key 流程：' + (e && e.message ? e.message : e));
      });
    }
  };
})();

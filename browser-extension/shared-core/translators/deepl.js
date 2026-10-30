/* =====================================================================
 * WATransChat shared-core · translators/deepl.js
 * DeepL 翻译：state.engines.deepl.free 为真走 api-free.deepl.com，
 * 否则走 api.deepl.com；POST 表单 text/source_lang/target_lang，
 * 请求头 Authorization: DeepL-Auth-Key <apiKey>。
 * 无 key 直接 reject，交由降级逻辑接管。
 * 纯 JS，挂载到 window.WTC.engines.deepl，网络一律走 WTC.net.http。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};
  WTC.engines = WTC.engines || {};

  /* DeepL 目标语言码：zh -> ZH；en 默认 EN-US；其余取大写两位 */
  function mapTarget(l) {
    l = l || '';
    if (l === 'zh-CN' || l === 'zh-TW' || l === 'zh') return 'ZH';
    if (l === 'en' || l === 'en-US') return 'EN-US';
    if (l === 'en-GB') return 'EN-GB';
    return l.slice(0, 2).toUpperCase();
  }
  /* DeepL 源语言码：auto 省略；en -> EN；zh -> ZH；其余大写两位 */
  function mapSource(l) {
    if (!l || l === 'auto') return '';
    if (l === 'zh-CN' || l === 'zh-TW' || l === 'zh') return 'ZH';
    if (l === 'en') return 'EN';
    return l.slice(0, 2).toUpperCase();
  }

  WTC.engines.deepl = {
    id: 'deepl',
    name: 'DeepL 翻译',
    /* translate(text, from, to, state) -> Promise<string> */
    translate: function (text, from, to, state) {
      var cfg = (state && state.engines && state.engines.deepl) || {};
      if (!cfg.apiKey) {
        return Promise.reject(new Error('请在设置中填写 DeepL API Key'));
      }
      var host = cfg.free ? 'https://api-free.deepl.com' : 'https://api.deepl.com';

      var params = 'text=' + encodeURIComponent(text) +
        '&target_lang=' + encodeURIComponent(mapTarget(to));
      var src = mapSource(from);
      if (src) params += '&source_lang=' + encodeURIComponent(src);

      return WTC.net.http(host + '/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': 'DeepL-Auth-Key ' + cfg.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      }).then(function (r) {
        var data = JSON.parse(r.body);
        if (data.message) throw new Error('DeepL：' + data.message);
        if (!data.translations || !data.translations[0]) {
          throw new Error('DeepL 返回格式异常');
        }
        return data.translations[0].text;
      });
    }
  };
})();

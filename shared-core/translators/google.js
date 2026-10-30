/* =====================================================================
 * WATransChat shared-core · translators/google.js
 * 谷歌翻译（免 key，gtx 公共端点）。
 * 纯 JS，挂载到 window.WTC.engines.google，网络一律走 WTC.net.http。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};
  WTC.engines = WTC.engines || {};

  /* Google 语言码基本与传入一致；auto 直接透传给 sl */
  function normLang(l) {
    return l || 'auto';
  }

  WTC.engines.google = {
    id: 'google',
    name: '谷歌翻译',
    /* translate(text, from, to, state) -> Promise<string> */
    translate: function (text, from, to, state) {
      var sl = normLang(from);
      var tl = normLang(to);
      var url = 'https://translate.googleapis.com/translate_a/single' +
        '?client=gtx' +
        '&sl=' + encodeURIComponent(sl) +
        '&tl=' + encodeURIComponent(tl) +
        '&dt=t' +
        '&q=' + encodeURIComponent(text);

      return WTC.net.http(url, { method: 'GET', headers: {} }).then(function (r) {
        if (!r || !r.body) throw new Error('谷歌翻译无响应');
        var data = JSON.parse(r.body);
        /* data[0] 是分段数组，每段 [0] 为译文，拼接即完整译文 */
        var out = '';
        var segs = (data && data[0]) || [];
        for (var i = 0; i < segs.length; i++) {
          if (segs[i] && segs[i][0]) out += segs[i][0];
        }
        if (!out) throw new Error('谷歌翻译返回为空');
        return out;
      });
    }
  };
})();

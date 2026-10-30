/* =====================================================================
 * WATransChat shared-core · core/net.js
 * 跨域 HTTP 抽象：
 *  - 扩展 content script：走 background service worker（绕过页面 CORS）
 *  - iOS WKWebView：走 WTCNative.http 原生桥
 *  - 其它：直接 fetch
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  var isContent = !!(root.chrome && root.chrome.runtime && root.chrome.runtime.sendMessage &&
    !(root.location && /^chrome-extension:/.test(root.location.href)));
  var hasNativeHttp = !!(root.WTCNative && typeof root.WTCNative.http === 'function');

  function viaBackground(url, options) {
    return new Promise(function (resolve, reject) {
      try {
        root.chrome.runtime.sendMessage({ type: 'wtc:http', url: url, options: options || {} }, function (resp) {
          if (root.chrome.runtime.lastError) return reject(new Error(root.chrome.runtime.lastError.message));
          if (!resp) return reject(new Error('background 无响应'));
          if (resp.error) return reject(new Error(resp.error));
          resolve(resp);
        });
      } catch (e) { reject(e); }
    });
  }

  function viaNative(url, options) {
    return Promise.resolve(root.WTCNative.http(url, options || {})).then(function (resp) {
      if (resp && resp.error) throw new Error(resp.error);
      return resp;
    });
  }

  function viaFetch(url, options) {
    return fetch(url, options).then(function (r) {
      return r.text().then(function (txt) {
        return { ok: r.ok, status: r.status, body: txt, headers: {} };
      });
    });
  }

  WTC.net = {
    /* options: { method, headers:{}, body, credentials } */
    http: function (url, options) {
      options = options || {};
      if (isContent) return viaBackground(url, options);
      if (hasNativeHttp) return viaNative(url, options);
      return viaFetch(url, options);
    },
    getText: function (url, headers) {
      return WTC.net.http(url, { method: 'GET', headers: headers || {} }).then(function (r) { return r.body; });
    },
    isContent: function () { return isContent; }
  };
})();

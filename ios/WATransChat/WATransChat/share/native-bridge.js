/* =====================================================================
 * WATransChat iOS · share/native-bridge.js
 * iOS WKWebView 原生桥 shim（page world，必须最先执行）。
 *
 * 职责：
 *  - 定义 window.WTCNative：get(key) / set(key,value) / http(url, options)，
 *    全部返回 Promise；
 *  - 内部自增 callbackId，把 {id, action, args} post 给
 *    webkit.messageHandlers.wtcNative（原生在 .page contentWorld 注册）；
 *  - 暴露 window.__wtcNativeCallback(id, result, error) 供原生 evaluateJavaScript
 *    回传结果。
 *
 * 与 shared-core 的对接：
 *  - core/storage.js：WTCNative.get('wtc_config_v1') 直接返回配置对象；
 *  - core/net.js：WTCNative.http(url, {method, headers, body}) 返回
 *    {ok, status, body, headers}，失败返回 {error: 消息}。
 * ===================================================================== */
(function () {
  'use strict';

  if (window.WTCNative && typeof window.WTCNative.get === 'function') return;

  var seq = 0;
  var pending = {};

  function post(action, args) {
    return new Promise(function (resolve, reject) {
      if (!window.webkit || !window.webkit.messageHandlers ||
          !window.webkit.messageHandlers.wtcNative) {
        reject(new Error('WTCNative: webkit.messageHandlers.wtcNative 不可用'));
        return;
      }
      seq += 1;
      var id = 'wtc_' + seq + '_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
      pending[id] = { resolve: resolve, reject: reject };
      try {
        window.webkit.messageHandlers.wtcNative.postMessage({
          id: id,
          action: action,
          args: args || {}
        });
      } catch (e) {
        delete pending[id];
        reject(e);
      }
    });
  }

  /* 原生回调入口：window.__wtcNativeCallback(id, result, error) */
  window.__wtcNativeCallback = function (id, result, error) {
    var p = pending[id];
    if (!p) return;
    delete pending[id];
    if (error) {
      p.reject(error instanceof Error ? error : new Error(String(error)));
    } else {
      p.resolve(result);
    }
  };

  window.WTCNative = {
    /* 读取沙盒 KV 配置；key 一般为 'wtc_config_v1'，直接返回值对象 */
    get: function (key) {
      return post('get', { key: key });
    },

    /* 写入沙盒 KV 配置；value 为可 JSON 序列化对象 */
    set: function (key, value) {
      return post('set', { key: key, value: value });
    },

    /* 原生发起跨域 HTTP；options = { method, headers:{}, body, credentials } */
    http: function (url, options) {
      options = options || {};
      return post('http', {
        url: url,
        method: String(options.method || 'GET').toUpperCase(),
        headers: options.headers || {},
        body: (options.body == null) ? null : options.body,
        credentials: options.credentials || null
      });
    }
  };
})();

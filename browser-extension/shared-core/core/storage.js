/* =====================================================================
 * WATransChat shared-core · core/storage.js
 * 设置存储抽象：扩展用 chrome.storage.local；iOS 用 WTCNative bridge；
 * 都没有时回落 localStorage。对外暴露 WTC.state（内存配置）+ ready + save。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};
  var STORE_KEY = 'wtc_config_v1';

  var hasChrome = !!(root.chrome && root.chrome.storage && root.chrome.storage.local);
  var hasNative = !!(root.WTCNative && typeof root.WTCNative.get === 'function');

  /* --- 底层 KV 读取（返回 Promise） --- */
  function rawGet(key) {
    return new Promise(function (resolve) {
      if (hasChrome) {
        root.chrome.storage.local.get(key, function (res) {
          resolve(res ? res[key] : undefined);
        });
      } else if (hasNative) {
        Promise.resolve(root.WTCNative.get(key)).then(resolve, function () {
          resolve(lsGet(key));
        });
      } else {
        resolve(lsGet(key));
      }
    });
  }

  function rawSet(key, value) {
    return new Promise(function (resolve) {
      if (hasChrome) {
        var o = {}; o[key] = value;
        root.chrome.storage.local.set(o, resolve);
      } else if (hasNative && typeof root.WTCNative.set === 'function') {
        Promise.resolve(root.WTCNative.set(key, value)).then(resolve, function () {
          lsSet(key, value); resolve();
        });
      } else {
        lsSet(key, value); resolve();
      }
    });
  }

  function lsGet(key) {
    try {
      var v = root.localStorage.getItem(key);
      return v == null ? undefined : JSON.parse(v);
    } catch (e) { return undefined; }
  }
  function lsSet(key, value) {
    try { root.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /* 内存中的生效配置 */
  WTC.state = null;

  /* 初始化：读取并和默认值合并 */
  WTC.ready = rawGet(STORE_KEY).then(function (stored) {
    WTC.state = WTC.config.deepMerge(WTC.config.DEFAULTS, stored || {});
    return WTC.state;
  });

  /* 持久化整个 state */
  WTC.save = function () {
    return rawSet(STORE_KEY, WTC.state);
  };

  /* 局部更新（浅合并第一级），返回保存 Promise */
  WTC.update = function (patch) {
    Object.keys(patch || {}).forEach(function (k) {
      WTC.state[k] = patch[k];
    });
    return WTC.save();
  };

  /* 通用 KV（供 options/popup 等非注入页复用） */
  WTC.storage = {
    get: rawGet,
    set: rawSet,
    key: STORE_KEY,
    loadState: function () {
      return rawGet(STORE_KEY).then(function (stored) {
        return WTC.config.deepMerge(WTC.config.DEFAULTS, stored || {});
      });
    },
    saveState: function (state) {
      return rawSet(STORE_KEY, state);
    }
  };

  /* 监听外部（如 options）配置变化，刷新内存并广播 */
  if (hasChrome && root.chrome.storage.onChanged) {
    root.chrome.storage.onChanged.addListener(function (changes, area) {
      if (area === 'local' && changes[STORE_KEY]) {
        var nv = changes[STORE_KEY].newValue;
        WTC.state = WTC.config.deepMerge(WTC.config.DEFAULTS, nv || {});
        document.dispatchEvent(new CustomEvent('wtc:config-changed', { detail: WTC.state }));
      }
    });
  }
  window.addEventListener('storage', function (e) {
    if (e.key === STORE_KEY) {
      try {
        WTC.state = WTC.config.deepMerge(WTC.config.DEFAULTS, JSON.parse(e.newValue) || {});
        document.dispatchEvent(new CustomEvent('wtc:config-changed', { detail: WTC.state }));
      } catch (err) {}
    }
  });
})();

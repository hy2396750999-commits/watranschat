/* =====================================================================
 * WATransChat shared-core · inject.js（主入口）
 * 加载顺序（content script / WKUserScript 均按此顺序）：
 *   core/config.js, core/storage.js, core/utils.js, core/net.js,
 *   data/countries.js,
 *   translators/google.js, bing.js, volcano.js, deepl.js,
 *   modules/translate.js, modules/messages.js, modules/countryBar.js,
 *   modules/chatList.js, modules/quickPhrase.js, modules/quickChat.js,
 *   modules/todo.js, modules/aiStaff.js, modules/settingsPanel.js,
 *   inject.js
 * 本文件最后执行：注入样式、启动各模块、挂全局 MutationObserver。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};
  WTC.modules = WTC.modules || {};

  /* 模块注册机制 WTC.registerModule 已在 core/config.js 中提前定义，
     各模块文件加载时即注册；本文件只负责在就绪后按顺序调用 init。 */

  /* 当前聊天上下文（由 countryBar 写入，其它模块读取） */
  WTC.currentChat = { phone: '', chatId: '', country: null, targetLang: '' };

  /* ---- toast ---- */
  var toastTimer;
  WTC.toast = function (msg, ms) {
    var old = document.getElementById('wtc-toast');
    if (old) old.parentNode.removeChild(old);
    var t = document.createElement('div');
    t.className = 'wtc-toast wtc-root';
    t.id = 'wtc-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.parentNode && t.parentNode.removeChild(t); }, ms || 1800);
  };

  /* ---- 样式注入（iOS 合并构建时把 CSS 放到 __WTC_CSS__；扩展用 manifest css） ---- */
  function injectStyles() {
    if (document.getElementById('wtc-style')) return;
    var s = document.createElement('style');
    s.id = 'wtc-style';
    s.className = 'wtc-root';
    s.textContent = root.__WTC_CSS__ || '';
    (document.head || document.documentElement).appendChild(s);
  }

  /* 译文颜色 / 位置等视觉变量 */
  WTC.applyVisual = function () {
    var st = WTC.state;
    document.documentElement.style.setProperty('--wtc-color', st.translateColor || '#2563eb');
    document.documentElement.classList.toggle('wtc-position-only', st.translatePosition === 'only');
  };

  /* ---- 共享 DOM 变化 hub（合并 + 防抖，避免大量 observer） ---- */
  var domHandlers = [];
  WTC.onDomChanged = function (fn) { domHandlers.push(fn); };
  var fireDom = WTC.utils.debounce(function (muts) {
    for (var i = 0; i < domHandlers.length; i++) {
      try { domHandlers[i](muts); } catch (e) {}
    }
  }, 160);

  function startObserver() {
    var target = document.body;
    if (!target) return setTimeout(startObserver, 300);
    var obs = new MutationObserver(function (muts) { fireDom(muts); });
    obs.observe(target, { childList: true, subtree: true, attributes: false });
  }

  /* ---- 启动 ---- */
  function boot() {
    injectStyles();
    var host = document.createElement('div');
    host.className = 'wtc-root';
    host.id = 'wtc-root-host';
    document.documentElement.appendChild(host);
    WTC.host = host;
    WTC.applyVisual();

    // 按注册顺序初始化模块
    WTC._moduleOrder.forEach(function (name) {
      try { WTC.modules[name].init(WTC); }
      catch (e) { console.error('[WTC] 模块启动失败 ' + name, e); }
    });

    startObserver();
    document.addEventListener('wtc:config-changed', function () { WTC.applyVisual(); });
    console.log('[WTC] WATransChat 注入核心已启动，引擎=' + WTC.state.engine);
  }

  WTC.ready.then(boot).catch(function (e) {
    console.error('[WTC] 初始化失败', e);
  });
})();

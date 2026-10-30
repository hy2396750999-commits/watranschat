/* ============================================================
 * wtc.combined.js — 由 build-combined.js 自动生成，请勿手改。
 * 重新运行 `node build-combined.js` 即可用最新 shared-core 覆盖。
 * ============================================================ */


/* ---- native-bridge.js ---- */
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



/* ---- styles.css -> __WTC_CSS__ ---- */
window.__WTC_CSS__ = `/* =====================================================================
 * WATransChat shared-core · styles.css
 * 所有注入 UI 统一前缀 wtc-，独立作用域，避免污染/被 WhatsApp 覆盖。
 * 颜色沿用 WhatsApp Web：#00A884 / #25D366 / #075E54 / #ECEFF1。
 * 译文颜色由配置 --wtc-color 动态注入。
 * ===================================================================== */
.wtc-root, .wtc-root * { box-sizing: border-box; }

.wtc-root {
  --wtc-green: #00A884;
  --wtc-green-d: #075E54;
  --wtc-green-l: #25D366;
  --wtc-ink: #111b21;
  --wtc-sub: #667781;
  --wtc-line: #e9edef;
  --wtc-bg: #ffffff;
  --wtc-bg-soft: #f0f2f5;
  --wtc-radius: 12px;
  --wtc-shadow: 0 2px 14px rgba(11, 20, 26, .18);
  --wtc-color: #2563eb;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", Helvetica, Arial, sans-serif;
}

/* ---------- 气泡内译文 ---------- */
.wtc-translation {
  display: block;
  margin-top: 2px;
  padding-top: 2px;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--wtc-color) !important;
  white-space: pre-wrap;
  word-break: break-word;
  direction: ltr;
  text-align: left;
}
.wtc-translation.wtc-rtl { direction: rtl; text-align: right; }
.wtc-translation.wtc-only-hide-original { /* 仅译文时由模块隐藏原文 */ }
.wtc-translation-inline { display: inline; }

/* ---------- 顶部国家信息条 ---------- */
.wtc-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 10px;
  padding: 8px 12px;
  background: var(--wtc-bg-soft);
  border-radius: 10px;
  cursor: pointer;
  font-size: 12.5px;
  color: var(--wtc-ink);
  line-height: 1.4;
}
.wtc-topbar .wtc-topbar-ic {
  flex: 0 0 auto; width: 30px; height: 30px; border-radius: 50%;
  background: var(--wtc-green); color: #fff; display: flex;
  align-items: center; justify-content: center; font-size: 15px;
}
.wtc-topbar .wtc-topbar-lines { flex: 1 1 auto; min-width: 0; }
.wtc-topbar .wtc-topbar-line1 { font-weight: 600; font-size: 13px; }
.wtc-topbar .wtc-topbar-line1 .wtc-country { color: var(--wtc-green-d); margin-left: 4px; }
.wtc-topbar .wtc-topbar-line2 { color: var(--wtc-sub); font-size: 11.5px; }
.wtc-topbar .wtc-topbar-seen { color: var(--wtc-sub); font-size: 11px; }

/* ---------- 会话列表国家名 ---------- */
.wtc-chatlist-country { color: var(--wtc-green-d); font-weight: 600; font-size: inherit; }
.wtc-chatlist-filter { display: inline-flex; gap: 6px; margin: 4px 6px 8px; flex-wrap: wrap; }
.wtc-filter-chip {
  border: none; border-radius: 14px; padding: 5px 12px; font-size: 12.5px;
  background: var(--wtc-bg-soft); color: var(--wtc-sub); cursor: pointer;
}
.wtc-filter-chip.wtc-active { background: var(--wtc-green-d); color: #fff; }

/* ---------- 输入框旁操作区 ---------- */
.wtc-input-actions { display: inline-flex; align-items: center; gap: 6px; margin: 0 4px; }
.wtc-ia-btn {
  border: none; border-radius: 50%; width: 38px; height: 38px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; background: var(--wtc-green); color: #fff; font-size: 15px;
}
.wtc-ia-btn.wtc-ghost { background: var(--wtc-bg-soft); color: var(--wtc-green-d); }
.wtc-ia-btn.wtc-send { background: var(--wtc-green); }
.wtc-ia-btn:active { opacity: .85; }

/* ---------- 通用按钮 ---------- */
.wtc-btn {
  border: none; border-radius: 8px; padding: 9px 18px; font-size: 14px;
  cursor: pointer; font-weight: 600;
}
.wtc-btn-primary { background: var(--wtc-green); color: #fff; }
.wtc-btn-ghost { background: var(--wtc-bg-soft); color: var(--wtc-sub); }
.wtc-btn-block { width: 100%; }
.wtc-btn-sm { padding: 6px 12px; font-size: 12.5px; }

/* ---------- 开关 ---------- */
.wtc-switch { position: relative; display: inline-block; width: 42px; height: 24px; flex: 0 0 auto; }
.wtc-switch input { opacity: 0; width: 0; height: 0; }
.wtc-switch .wtc-slider {
  position: absolute; inset: 0; background: #cbd5e1; border-radius: 24px;
  transition: .2s; cursor: pointer;
}
.wtc-switch .wtc-slider::before {
  content: ""; position: absolute; height: 18px; width: 18px; left: 3px; top: 3px;
  background: #fff; border-radius: 50%; transition: .2s;
}
.wtc-switch input:checked + .wtc-slider { background: var(--wtc-green); }
.wtc-switch input:checked + .wtc-slider::before { transform: translateX(18px); }

/* ---------- 表单 ---------- */
.wtc-field { margin-bottom: 14px; }
.wtc-label { display: block; font-size: 13px; font-weight: 600; color: var(--wtc-ink); margin-bottom: 6px; }
.wtc-hint { font-size: 11.5px; color: var(--wtc-sub); margin-top: 3px; }
.wtc-select, .wtc-input {
  width: 100%; padding: 9px 11px; border: 1px solid var(--wtc-line);
  border-radius: 8px; font-size: 14px; background: #fff; color: var(--wtc-ink);
}
.wtc-select:focus, .wtc-input:focus { outline: none; border-color: var(--wtc-green); }

/* ---------- 弹层（居中卡片） ---------- */
.wtc-overlay {
  position: fixed; inset: 0; background: rgba(11, 20, 26, .45);
  display: flex; align-items: center; justify-content: center; z-index: 99990;
}
.wtc-card {
  background: var(--wtc-bg); border-radius: 14px; padding: 18px;
  width: calc(100% - 40px); max-width: 380px; box-shadow: var(--wtc-shadow);
  max-height: 86vh; overflow-y: auto;
}
.wtc-card-title { font-size: 16px; font-weight: 700; margin: 0 0 14px; text-align: center; }
.wtc-card-actions { display: flex; gap: 10px; margin-top: 8px; }
.wtc-card-actions .wtc-btn { flex: 1; }

/* ---------- 调色板 ---------- */
.wtc-palette { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
.wtc-swatch {
  width: 100%; aspect-ratio: 1; border-radius: 50%; border: 2px solid transparent;
  cursor: pointer; padding: 0;
}
.wtc-swatch.wtc-sel { border-color: var(--wtc-ink); box-shadow: 0 0 0 2px #fff inset; }
.wtc-color-preview { height: 40px; border-radius: 8px; margin: 8px 0 14px; }

/* ---------- 侧滑面板 ---------- */
.wtc-panel {
  position: fixed; top: 0; right: 0; height: 100%; width: 340px; max-width: 92vw;
  background: var(--wtc-bg); z-index: 99992; box-shadow: -4px 0 20px rgba(0,0,0,.2);
  display: flex; flex-direction: column; animation: wtc-slide .18s ease;
}
@keyframes wtc-slide { from { transform: translateX(20px); opacity: .4; } to { transform: none; opacity: 1; } }
.wtc-panel-head {
  display: flex; align-items: center; gap: 10px; padding: 14px 16px;
  background: var(--wtc-green-d); color: #fff; font-weight: 600;
}
.wtc-panel-head .wtc-close { margin-left: auto; cursor: pointer; font-size: 20px; background: none; border: none; color: #fff; }
.wtc-panel-body { flex: 1; overflow-y: auto; padding: 14px 16px; }

/* ---------- 列表项（短语/待办） ---------- */
.wtc-list-item {
  border: 1px solid var(--wtc-line); border-radius: 10px; padding: 10px 12px;
  margin-bottom: 8px; font-size: 13px;
}
.wtc-list-item .wtc-li-top { display: flex; align-items: center; gap: 8px; }
.wtc-list-item .wtc-li-group {
  font-size: 10.5px; background: var(--wtc-green); color: #fff;
  border-radius: 6px; padding: 1px 7px;
}
.wtc-list-item .wtc-li-text { flex: 1; color: var(--wtc-ink); }
.wtc-list-item .wtc-li-act { display: flex; gap: 6px; }
.wtc-icon-btn { border: none; background: var(--wtc-bg-soft); border-radius: 6px; cursor: pointer; font-size: 13px; padding: 3px 7px; }
.wtc-list-item.wtc-done .wtc-li-text { text-decoration: line-through; color: var(--wtc-sub); }

/* ---------- 悬浮按钮 ---------- */
.wtc-fab-stack { position: fixed; right: 14px; bottom: 84px; display: flex; flex-direction: column; gap: 10px; z-index: 99980; }
.wtc-fab {
  width: 46px; height: 46px; border-radius: 50%; border: none; cursor: pointer;
  background: var(--wtc-green-d); color: #fff; font-size: 20px; box-shadow: var(--wtc-shadow);
  display: flex; align-items: center; justify-content: center;
}
.wtc-fab.wtc-dom { background: #b45309; }

/* ---------- DOM 检查 ---------- */
.wtc-dom-highlight { outline: 2px solid #f59e0b !important; outline-offset: 1px; }
.wtc-dom-tip {
  position: fixed; z-index: 99995; max-width: 360px; background: #1f2937;
  color: #e5e7eb; font: 11px/1.5 ui-monospace, Consolas, monospace;
  padding: 8px 10px; border-radius: 8px; pointer-events: none; white-space: pre-wrap;
  box-shadow: var(--wtc-shadow);
}

/* ---------- 语音输入 ---------- */
.wtc-voice-overlay {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 99993;
  background: var(--wtc-bg); border-radius: 16px 16px 0 0; padding: 22px 20px;
  text-align: center; box-shadow: 0 -6px 24px rgba(0,0,0,.18);
}
.wtc-voice-title { font-size: 17px; font-weight: 600; margin-bottom: 16px; color: var(--wtc-ink); }
.wtc-voice-wave { letter-spacing: 3px; color: var(--wtc-green); font-size: 18px; margin-bottom: 14px; }
.wtc-voice-lang { display: inline-block; padding: 8px 16px; border: 1px solid var(--wtc-line); border-radius: 10px; font-size: 14px; color: var(--wtc-sub); }

/* ---------- 会员页 ---------- */
.wtc-member-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.wtc-avatar {
  width: 56px; height: 56px; border-radius: 50%; background: var(--wtc-green);
  color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px;
}
.wtc-member-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 4px; border-bottom: 1px solid var(--wtc-line); font-size: 14px; cursor: pointer;
}
.wtc-member-row .wtc-mr-label { color: var(--wtc-ink); }
.wtc-member-row .wtc-mr-val { color: var(--wtc-sub); font-size: 13px; }
.wtc-plan-badge { background: var(--wtc-green); color: #fff; border-radius: 6px; padding: 2px 10px; font-size: 12px; }

/* ---------- toast ---------- */
.wtc-toast {
  position: fixed; left: 50%; bottom: 120px; transform: translateX(-50%);
  background: rgba(17, 27, 33, .92); color: #fff; padding: 9px 16px;
  border-radius: 8px; font-size: 13px; z-index: 99996; animation: wtc-fade .2s;
}
@keyframes wtc-fade { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }

/* =====================================================================
 * 通话（语音通话）实时翻译面板（类名前缀 wtc-call-）
 * ===================================================================== */
.wtc-call-overlay {
  position: fixed; inset: 0; background: #000; z-index: 99997;
  display: flex; flex-direction: column; color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Microsoft YaHei", Helvetica, Arial, sans-serif;
}
/* 顶部语言栏 */
.wtc-call-top { flex: 0 0 auto; padding: 14px 16px 0; }
.wtc-call-langbar { display: flex; align-items: center; gap: 10px; margin-top: 22px; }
.wtc-call-lang {
  flex: 1; position: relative; background: #232a30; border-radius: 10px;
  padding: 7px 12px; cursor: pointer;
}
.wtc-call-lang .wtc-cl-cap { display: block; font-size: 11px; color: #9ba8af; }
.wtc-call-lang .wtc-cl-val { display: block; font-size: 16px; color: #fff; }
.wtc-call-lang select { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.wtc-call-swap {
  flex: 0 0 auto; width: 34px; height: 34px; border-radius: 50%; border: none;
  background: #232a30; color: #fff; font-size: 18px; cursor: pointer;
}
/* 开始/停止 */
.wtc-call-toggle {
  display: block; margin: 14px auto 4px; background: none; border: none;
  font-size: 16px; font-weight: 600; cursor: pointer;
}
.wtc-call-toggle.start { color: #25D366; }
.wtc-call-toggle.stop { color: #ef4444; }
/* 联系人 */
.wtc-call-contact { flex: 0 0 auto; text-align: center; padding: 4px 0 8px; }
.wtc-call-name { font-size: 26px; font-weight: 700; }
.wtc-call-enc { font-size: 12.5px; color: #9ba8af; margin-top: 4px; }
.wtc-call-status { font-size: 14px; color: #9ba8af; margin-top: 6px; }
.wtc-call-status.running { color: #fff; }
/* 字幕流 */
.wtc-call-sub { flex: 1 1 auto; overflow-y: auto; padding: 14px 14px 18px; display: flex; flex-direction: column; gap: 10px; }
.wtc-call-bubble { max-width: 80%; padding: 8px 12px; border-radius: 12px; }
.wtc-call-bubble.me { align-self: flex-end; background: #0a7d55; text-align: left; }
.wtc-call-bubble.peer { align-self: flex-start; background: #1f2c34; text-align: left; }
.wtc-cb-tag { display: block; font-size: 11px; color: #aeb9c0; margin-bottom: 2px; }
.wtc-cb-orig { display: block; font-size: 14.5px; color: #d7e3e0; }
.wtc-cb-trans { display: block; font-size: 19px; color: #fff; font-weight: 600; margin-top: 1px; }
.wtc-call-bubble.peer .wtc-cb-orig { font-size: 19px; color: #fff; font-weight: 600; }
.wtc-call-bubble.peer .wtc-cb-trans { font-size: 14.5px; color: #d7e3e0; font-weight: 400; }
.wtc-call-bubble.interim { opacity: .75; }
.wtc-cb-caret { display: inline-block; animation: wtc-pulse 1s infinite; }
@keyframes wtc-pulse { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
/* 底部控制栏 */
.wtc-call-controls {
  flex: 0 0 auto; display: flex; justify-content: center; align-items: center;
  gap: 14px; margin: 0 14px 26px; padding: 12px 16px;
  background: rgba(30, 38, 44, .72); border-radius: 34px; backdrop-filter: blur(6px);
}
.wtc-cc-btn {
  position: relative; width: 52px; height: 52px; border-radius: 50%; border: none;
  background: #3b4650; color: #fff; font-size: 20px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.wtc-cc-btn.active { background: #fff; color: #111; }
.wtc-cc-btn.hangup { background: #ef2c2c; color: #fff; }
.wtc-cc-btn.slash::before {
  content: ""; position: absolute; width: 56px; height: 2.6px; background: #ef2c2c;
  border-radius: 2px; transform: rotate(-45deg);
}
.wtc-cc-btn .wtc-cc-ic { font-size: 20px; }
/* 法律提示横幅 */
.wtc-call-legal {
  position: fixed; left: 50%; bottom: 108px; transform: translateX(-50%);
  background: rgba(20, 26, 30, .94); border-radius: 10px; padding: 10px 14px;
  max-width: 86%; font-size: 12.5px; color: #e7edf0; text-align: center; z-index: 99998;
}
.wtc-call-legal .wtc-cl-btns { margin-top: 8px; display: flex; gap: 10px; justify-content: center; }
.wtc-call-legal button { border: none; border-radius: 7px; padding: 6px 16px; font-size: 13px; cursor: pointer; }
.wtc-legal-ok { background: #25D366; color: #fff; }
.wtc-legal-no { background: #3b4650; color: #fff; }
/* 聊天顶部入口图标 */
.wtc-call-entry {
  border: none; background: transparent; cursor: pointer; color: #667781;
  width: 36px; height: 36px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
}
.wtc-call-entry:hover { background: #f0f2f5; }
/* 音色设置 */
.wtc-call-voice-row { display: flex; align-items: center; gap: 10px; margin: 10px 0; }
.wtc-call-voice-row .wtc-cvr-label { font-size: 14px; width: 92px; color: #e7edf0; }
.wtc-call-voice-seg { display: flex; background: #232a30; border-radius: 9px; overflow: hidden; }
.wtc-call-voice-seg button { border: none; background: transparent; color: #9ba8af; padding: 7px 16px; font-size: 13.5px; cursor: pointer; }
.wtc-call-voice-seg button.sel { background: #25D366; color: #fff; }
/* 麦克风权限引导 */
.wtc-call-micguide { background: #1f2c34; border-radius: 12px; padding: 16px; margin: 10px; font-size: 13.5px; color: #d7e3e0; }
.wtc-call-micguide h4 { margin: 0 0 8px; font-size: 15px; color: #fff; }
.wtc-call-micguide ol { margin: 0; padding-left: 18px; }
.wtc-call-micguide li { margin: 5px 0; }
`;


/* ---- core/config.js ---- */
/* =====================================================================
 * WATransChat shared-core · core/config.js
 * 全局配置的唯一事实来源（default + schema）。options/popup/各模块都读它。
 * 纯 JS，挂载到 window.WTC，无 import、无构建依赖。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  /* 默认配置（与视频「翻译设置」逐项对应） */
  var DEFAULTS = {
    enabled: true,                 // 总开关
    myLanguage: 'zh-CN',           // 您的语言
    engine: 'google',              // 全局翻译引擎：google|bing|volcano|deepl
    translateColor: '#2563eb',     // 译文颜色（默认蓝）
    autoSend: true,                // 自动发送译文
    domInspector: false,           // 网页 DOM 检查
    translatePosition: 'below',    // 译文位置：below(原文在上译文在下)|right(在右)|only(仅译文)
    splitScreen: false,            // 分屏翻译
    showOriginal: true,            // 是否保留原文（only 时为 false）
    translateIncoming: true,       // 翻译对方消息
    translateOutgoing: true,       // 翻译自己发送的消息（在下方显示中文原文）
    autoDetectContact: true,       // 根据区号自动推断客户语言
    voiceInput: true,              // 语音输入转文字
    // 引擎密钥
    engines: {
      volcano: { accessKeyId: '', secretAccessKey: '', region: 'cn-north-1', host: 'open.volcengineapi.com' },
      deepl: { apiKey: '', free: true },
      ai: { baseUrl: '', apiKey: '', model: 'gpt-4o-mini' }
    },
    // 联系人级语言偏好：{ [chatId]: { targetLang, engine, remember, name, phone } }
    contacts: {},
    // 快捷短语
    phrases: [
      { id: 'p1', group: '欢迎', zh: '您好，很高兴收到您的询盘，请问有什么可以帮您？' },
      { id: 'p2', group: '报价', zh: '这是我们的最新报价单，FOB 价格，量大可优惠，详情请见附件。' },
      { id: 'p3', group: '售后', zh: '非常抱歉给您带来不便，我们会尽快为您处理，请提供订单号和问题照片。' },
      { id: 'p4', group: '物流', zh: '货物已安排发货，预计 7-15 个工作日到达，我会把物流单号发给您。' },
      { id: 'p5', group: '成交', zh: '感谢您的信任与支持，期待长期合作，欢迎再次下单！' }
    ],
    // 待办：{ id, chatId, phone, text, time(ISO ms), done, notified }
    todos: [],
    // AI 员工 / 自动回复
    aiStaff: {
      enabled: false,
      scheduleEnabled: false,
      start: '09:00',
      end: '18:00',
      autoReply: false,
      template: '您好，我现在不在，已收到您的消息，稍后会尽快回复您。',
      contacts: {} // chatId -> bool
    },
    // 会员 / 账户（本地账户概念）
    member: {
      loggedIn: false,
      name: 'WATransChat 用户',
      plan: '基础版',
      expire: '',
      email: '',
      devices: 1
    },
    // 多账号标签
    tabs: [],
    // 通话（语音通话）实时翻译
    call: {
      myLang: 'zh-CN',            // 我的语言
      clientLang: 'en',           // 客户语言（默认英语，打开联系人时按记忆覆盖）
      autoSpeak: true,            // 自动朗读译文
      voiceClient: 'male',        // 对方听到的音色：male|female
      voiceMine: 'female',        // 我方听到的音色：male|female
      showLegal: true,            // 开始时是否显示法律提示
      asrEngine: 'webspeech',     // 识别引擎：webspeech|native|cloud
      speakerOn: true,            // 扬声器（false=听筒，按钮显示红叉）
      muted: false,               // 静音（按钮显示红叉，暂停采集）
      translateEnabled: true      // 「译」总开关
    }
  };

  /* 配置项描述（供 options 渲染 / 导入导出） */
  var SCHEMA = {
    engines: [
      { id: 'google', name: '谷歌翻译', free: true },
      { id: 'bing', name: '微软翻译', free: true },
      { id: 'volcano', name: '火山引擎翻译', free: false },
      { id: 'deepl', name: 'DeepL 翻译', free: false }
    ],
    positions: [
      { id: 'below', name: '原文在上，译文在下' },
      { id: 'right', name: '原文在上，译文在右' },
      { id: 'only', name: '仅显示译文' }
    ],
    colors: [
      '#2563eb', '#1d4ed8', '#38bdf8', '#22c55e', '#14b8a6', '#0ea5e9',
      '#f97316', '#dc2626', '#e11d48', '#ef4444', '#f87171', '#f472b6',
      '#bfdbfe', '#93c5fd', '#c4b5fd', '#f9a8d4', '#a5b4fc', '#e5e7eb',
      '#e11d48', '#eab308', '#ef4444', '#22c55e', '#0ea5e9', '#a855f7',
      '#f3f4f6', '#d1d5db', '#9ca3af', '#6b7280', '#111827', '#000000',
      '#1f2937', '#111827', '#1e293b', '#374151', '#000000', '#0f172a'
    ]
  };

  /* 常用语言（目标语言下拉，带英文母语名） */
  var LANGUAGES = [
    { code: 'zh-CN', name: '中文（简体）', native: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: '中文（繁体）', native: 'Chinese (Traditional)' },
    { code: 'en', name: '英语', native: 'English' },
    { code: 'hu', name: '匈牙利语', native: 'Hungarian' },
    { code: 'pl', name: '波兰语', native: 'Polish' },
    { code: 'de', name: '德语', native: 'German' },
    { code: 'fr', name: '法语', native: 'French' },
    { code: 'es', name: '西班牙语', native: 'Spanish' },
    { code: 'pt', name: '葡萄牙语', native: 'Portuguese' },
    { code: 'it', name: '意大利语', native: 'Italian' },
    { code: 'ru', name: '俄语', native: 'Russian' },
    { code: 'ar', name: '阿拉伯语', native: 'Arabic' },
    { code: 'tr', name: '土耳其语', native: 'Turkish' },
    { code: 'he', name: '希伯来语', native: 'Hebrew' },
    { code: 'hi', name: '印地语', native: 'Hindi' },
    { code: 'id', name: '印尼语', native: 'Indonesian' },
    { code: 'ja', name: '日语', native: 'Japanese' },
    { code: 'ko', name: '韩语', native: 'Korean' },
    { code: 'th', name: '泰语', native: 'Thai' },
    { code: 'vi', name: '越南语', native: 'Vietnamese' },
    { code: 'nl', name: '荷兰语', native: 'Dutch' },
    { code: 'cs', name: '捷克语', native: 'Czech' },
    { code: 'sv', name: '瑞典语', native: 'Swedish' },
    { code: 'uk', name: '乌克兰语', native: 'Ukrainian' },
    { code: 'ro', name: '罗马尼亚语', native: 'Romanian' },
    { code: 'el', name: '希腊语', native: 'Greek' },
    { code: 'fa', name: '波斯语', native: 'Persian' },
    { code: 'ms', name: '马来语', native: 'Malay' },
    { code: 'th', name: '泰语', native: 'Thai' },
    { code: 'km', name: '高棉语', native: 'Khmer' },
    { code: 'ne', name: '尼泊尔语', native: 'Nepali' },
    { code: 'bn', name: '孟加拉语', native: 'Bengali' },
    { code: 'ur', name: '乌尔都语', native: 'Urdu' },
    { code: 'fil', name: '菲律宾语', native: 'Filipino' },
    { code: 'sw', name: '斯瓦希里语', native: 'Swahili' }
  ];

  /* 深合并（用于把存储值覆盖到默认值） */
  function deepMerge(base, over) {
    if (over == null) return base;
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(over || {}).forEach(function (k) {
      var bv = base ? base[k] : undefined;
      var ov = over[k];
      if (ov && typeof ov === 'object' && !Array.isArray(ov) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
        out[k] = deepMerge(bv, ov);
      } else {
        out[k] = ov;
      }
    });
    return out;
  }

  /* 模块注册机制（必须在各模块文件加载前就绪，故放在首个加载的 config.js） */
  WTC.modules = {};
  WTC._moduleOrder = [];
  WTC.registerModule = function (name, initFn) {
    WTC.modules[name] = { init: initFn };
    if (WTC._moduleOrder.indexOf(name) < 0) WTC._moduleOrder.push(name);
  };

  WTC.config = {
    DEFAULTS: DEFAULTS,
    SCHEMA: SCHEMA,
    LANGUAGES: LANGUAGES,
    deepMerge: deepMerge,
    /* 语言 code -> 显示名 */
    langName: function (code) {
      var l = LANGUAGES.filter(function (x) { return x.code === code; })[0];
      return l ? l.name : code;
    },
    engineName: function (id) {
      var e = SCHEMA.engines.filter(function (x) { return x.id === id; })[0];
      return e ? e.name : id;
    }
  };
})();



/* ---- core/storage.js ---- */
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



/* ---- core/utils.js ---- */
/* =====================================================================
 * WATransChat shared-core · core/utils.js
 * 集中式 DOM 选择器（多重兜底）+ 通用工具。WhatsApp Web 是 React 动态
 * 渲染，选择器都集中在这里，DOM 变化时只改这一处。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  /* 集中选择器：每个都给一组候选，按可用性取第一个 */
  var SELECTORS = {
    // 消息气泡行
    messageRows: [
      'div.message-in, div.message-out',
      'div[class*="message-in"], div[class*="message-out"]'
    ],
    bubbleIn: ['div.message-in', 'div[class*="message-in"]'],
    bubbleOut: ['div.message-out', 'div[class*="message-out"]'],
    // 气泡可复制文本
    copyable: ['div.copyable-text', 'span.selectable-text', 'div[class*="copyable-text"]'],
    bubbleText: ['span.selectable-text', 'div.copyable-text span', 'span[class*="selectable"]'],
    // 会话容器（聊天主面板）
    chatPanel: ['div#main', 'div[data-testid="conversation-panel-wrapper"]', 'header + div'],
    // 聊天头部
    chatHeader: ['div#main header', 'header[data-testid="conversation-header"]', 'div#main > header'],
    // 头部标题（联系人名/号码）
    headerTitle: ['div#main header span[title]', 'header span[dir="auto"][title]', 'div#main header .ggj6brxd'],
    // 输入框
    inputBox: ['div[contenteditable="true"][data-tab]', 'div[contenteditable="true"]', 'footer div[contenteditable="true"]'],
    footer: ['div#main footer', 'footer'],
    // 发送按钮
    sendButton: ['button[aria-label="Send"]', 'button[aria-label="发送"]', 'button[data-testid="send"]', 'span[data-icon="send"]', 'button[aria-label*="Send"]', 'button[aria-label*="发送"]'],
    // 会话列表项
    chatListItem: ['div#pane-side [role="listitem"]', 'div[role="listitem"]', 'div[class*="lhggkp7q"]'],
    chatListTitle: ['span[title][dir="auto"]', 'span[class*="ggj6brxd"] span', 'span[title]'],
    // 头像/副标题
    chatListSub: ['div[class*="navigator"] span[title]', 'span[class*="HyQn"]', 'div._33Lb6']
  };

  function qsa(list, ctx) {
    ctx = ctx || document;
    var out = [];
    for (var i = 0; i < list.length; i++) {
      try {
        var nodes = ctx.querySelectorAll(list[i]);
        if (nodes && nodes.length) { Array.prototype.forEach.call(nodes, function (n) { out.push(n); }); }
      } catch (e) {}
    }
    return out;
  }
  function firstMatch(list, ctx) {
    ctx = ctx || document;
    for (var i = 0; i < list.length; i++) {
      try {
        var n = ctx.querySelector(list[i]);
        if (n) return n;
      } catch (e) {}
    }
    return null;
  }

  /* 公共工具 */
  var utils = {
    $: function (sel, ctx) { return (ctx || document).querySelector(sel); },
    $$: function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); },
    findAll: function (key, ctx) { return qsa(SELECTORS[key] || [key], ctx); },
    find: function (key, ctx) { return firstMatch(SELECTORS[key] || [key], ctx); },
    SELECTORS: SELECTORS,

    on: function (el, ev, fn, opts) { el.addEventListener(ev, fn, opts || false); return fn; },
    off: function (el, ev, fn, opts) { el.removeEventListener(ev, fn, opts || false); },

    debounce: function (fn, wait) {
      var t;
      return function () {
        var self = this, args = arguments;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(self, args); }, wait);
      };
    },
    throttle: function (fn, wait) {
      var last = 0, timer = null;
      return function () {
        var self = this, args = arguments, now = Date.now();
        var remain = wait - (now - last);
        if (remain <= 0) { if (timer) { clearTimeout(timer); timer = null; } last = now; fn.apply(self, args); }
        else if (!timer) { timer = setTimeout(function () { last = Date.now(); timer = null; fn.apply(self, args); }, remain); }
      };
    },

    /* 等待元素出现（轮询，超时返回 null） */
    waitFor: function (keyOrSel, opts) {
      opts = opts || {};
      var timeout = opts.timeout || 20000, interval = opts.interval || 200, start = Date.now();
      return new Promise(function (resolve) {
        (function tick() {
          var el = keyOrSel.indexOf('.') === 0 || keyOrSel.indexOf('#') === 0 || keyOrSel.indexOf('[') === 0 || keyOrSel.indexOf('div') === 0 || keyOrSel.indexOf('button') === 0 || keyOrSel.indexOf('span') === 0 || keyOrSel.indexOf('footer') === 0 || keyOrSel.indexOf('header') === 0
            ? firstMatch([keyOrSel]) : firstMatch(SELECTORS[keyOrSel] || [keyOrSel]);
          if (el) return resolve(el);
          if (Date.now() - start > timeout) return resolve(null);
          setTimeout(tick, interval);
        })();
      });
    },

    escapeHtml: function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    /* 元素是否在视口内（只翻译可见消息） */
    inViewport: function (el) {
      var r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight);
    },

    /* 创建带 class/属性/HTML 的元素 */
    el: function (tag, attrs, html) {
      var n = document.createElement(tag);
      if (attrs) Object.keys(attrs).forEach(function (k) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'style') n.setAttribute('style', attrs[k]);
        else if (k.indexOf('data-') === 0) n.setAttribute(k, attrs[k]);
        else n[k] = attrs[k];
      });
      if (html != null) n.innerHTML = html;
      return n;
    },

    /* 从头部标题提取号码（去掉空格/括号/破折号），返回 E.164 形态 */
    normalizePhone: function (raw) {
      if (!raw) return '';
      var digits = String(raw).replace(/[^\d+]/g, '');
      return digits;
    },

    /* 取当前聊天头部显示的标题文本（可能是号码或联系人名） */
    headerText: function () {
      var t = firstMatch(SELECTORS.headerTitle);
      return t ? (t.getAttribute('title') || t.textContent || '').trim() : '';
    },

    /* 判断气泡方向：in / out */
    dirOf: function (row) {
      if (!row) return '';
      if (row.className.indexOf('message-out') >= 0) return 'out';
      if (row.className.indexOf('message-in') >= 0) return 'in';
      var p = row.closest('[class*="message-out"],[class*="message-in"]');
      if (p) return p.className.indexOf('message-out') >= 0 ? 'out' : 'in';
      return '';
    },

    /* 取气泡内文本（不含已插入的译文） */
    bubblePlain: function (row) {
      var copy = row.querySelector('div.copyable-text');
      var span = row.querySelector('span.selectable-text');
      var node = copy ? copy : span;
      if (!node) return '';
      // 排除译文节点
      var clone = node.cloneNode(true);
      var w = clone.querySelectorAll('.wtc-translation');
      Array.prototype.forEach.call(w, function (x) { x.parentNode && x.parentNode.removeChild(x); });
      return (clone.textContent || '').trim();
    },

    /* 气泡 data-id（用于唯一标识） */
    bubbleId: function (row) {
      var el = row.closest('[data-id]') || row.querySelector('[data-id]');
      return el ? el.getAttribute('data-id') : null;
    },

    /* 用 IANA 时区格式化当前时间 */
    nowIn: function (timezone, fmt) {
      try {
        return new Intl.DateTimeFormat('zh-CN', {
          timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false
        }).format(new Date());
      } catch (e) {
        var d = new Date();
        return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
      }
    },

    isRTL: function (lang) {
      return ['ar', 'he', 'fa', 'ur'].indexOf(String(lang).split('-')[0]) >= 0;
    }
  };

  WTC.utils = utils;
})();



/* ---- core/net.js ---- */
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



/* ---- data/countries.js ---- */
/* =====================================================================
 * WATransChat shared-core · data/countries.js
 * 国家/地区大表：供根据联系人区号自动推断客户语言/货币/时区。
 * 纯 JS，挂载到 window.WTC.countries，无 import、无构建依赖。
 *
 * 记录结构：{ code, calling, zh, en, lang, langZh, currency, tz }
 *   code     ISO 3166-1 alpha-2（如 PL）
 *   calling  国际区号，不带 +（如 48、1、7、971）
 *   zh/en    中/英文国家名
 *   lang     常用语言 code（与 config.js LANGUAGES 对齐，如 pl、ar、en、ru）
 *   langZh   该语言中文名
 *   currency ISO 货币代码（如 PLN、USD、EUR）
 *   tz       IANA 时区（如 Europe/Warsaw）
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  var LIST = [];
  function R(code, calling, zh, en, lang, langZh, currency, tz) {
    LIST.push({
      code: code, calling: calling, zh: zh, en: en,
      lang: lang, langZh: langZh, currency: currency, tz: tz
    });
  }

  /* ---------------- 欧洲 ---------------- */
  R('AL', '355', '阿尔巴尼亚', 'Albania', 'sq', '阿尔巴尼亚语', 'ALL', 'Europe/Tirane');
  R('AD', '376', '安道尔', 'Andorra', 'ca', '加泰罗尼亚语', 'EUR', 'Europe/Andorra');
  R('AT', '43', '奥地利', 'Austria', 'de', '德语', 'EUR', 'Europe/Vienna');
  R('BY', '375', '白俄罗斯', 'Belarus', 'be', '白俄罗斯语', 'BYN', 'Europe/Minsk');
  R('BE', '32', '比利时（荷兰语区）', 'Belgium (Dutch)', 'nl', '荷兰语', 'EUR', 'Europe/Brussels');
  R('BE', '32', '比利时（法语区）', 'Belgium (French)', 'fr', '法语', 'EUR', 'Europe/Brussels');
  R('BA', '387', '波斯尼亚和黑塞哥维那', 'Bosnia and Herzegovina', 'bs', '波斯尼亚语', 'BAM', 'Europe/Sarajevo');
  R('BG', '359', '保加利亚', 'Bulgaria', 'bg', '保加利亚语', 'BGN', 'Europe/Sofia');
  R('HR', '385', '克罗地亚', 'Croatia', 'hr', '克罗地亚语', 'EUR', 'Europe/Zagreb');
  R('CY', '357', '塞浦路斯', 'Cyprus', 'el', '希腊语', 'EUR', 'Asia/Nicosia');
  R('CZ', '420', '捷克', 'Czechia', 'cs', '捷克语', 'CZK', 'Europe/Prague');
  R('DK', '45', '丹麦', 'Denmark', 'da', '丹麦语', 'DKK', 'Europe/Copenhagen');
  R('EE', '372', '爱沙尼亚', 'Estonia', 'et', '爱沙尼亚语', 'EUR', 'Europe/Tallinn');
  R('FO', '298', '法罗群岛', 'Faroe Islands', 'fo', '法罗语', 'DKK', 'Atlantic/Faroe');
  R('FI', '358', '芬兰', 'Finland', 'fi', '芬兰语', 'EUR', 'Europe/Helsinki');
  R('FR', '33', '法国', 'France', 'fr', '法语', 'EUR', 'Europe/Paris');
  R('DE', '49', '德国', 'Germany', 'de', '德语', 'EUR', 'Europe/Berlin');
  R('GI', '350', '直布罗陀', 'Gibraltar', 'en', '英语', 'GBP', 'Europe/Gibraltar');
  R('GR', '30', '希腊', 'Greece', 'el', '希腊语', 'EUR', 'Europe/Athens');
  R('HU', '36', '匈牙利', 'Hungary', 'hu', '匈牙利语', 'HUF', 'Europe/Budapest');
  R('IS', '354', '冰岛', 'Iceland', 'is', '冰岛语', 'ISK', 'Atlantic/Reykjavik');
  R('IE', '353', '爱尔兰', 'Ireland', 'en', '英语', 'EUR', 'Europe/Dublin');
  R('IT', '39', '意大利', 'Italy', 'it', '意大利语', 'EUR', 'Europe/Rome');
  R('XK', '383', '科索沃', 'Kosovo', 'sq', '阿尔巴尼亚语', 'EUR', 'Europe/Pristina');
  R('LV', '371', '拉脱维亚', 'Latvia', 'lv', '拉脱维亚语', 'EUR', 'Europe/Riga');
  R('LI', '423', '列支敦士登', 'Liechtenstein', 'de', '德语', 'CHF', 'Europe/Vaduz');
  R('LT', '370', '立陶宛', 'Lithuania', 'lt', '立陶宛语', 'EUR', 'Europe/Vilnius');
  R('LU', '352', '卢森堡', 'Luxembourg', 'fr', '法语', 'EUR', 'Europe/Luxembourg');
  R('MT', '356', '马耳他', 'Malta', 'mt', '马耳他语', 'EUR', 'Europe/Malta');
  R('MD', '373', '摩尔多瓦', 'Moldova', 'ro', '罗马尼亚语', 'MDL', 'Europe/Chisinau');
  R('MC', '377', '摩纳哥', 'Monaco', 'fr', '法语', 'EUR', 'Europe/Monaco');
  R('ME', '382', '黑山', 'Montenegro', 'sr', '塞尔维亚语', 'EUR', 'Europe/Podgorica');
  R('NL', '31', '荷兰', 'Netherlands', 'nl', '荷兰语', 'EUR', 'Europe/Amsterdam');
  R('MK', '389', '北马其顿', 'North Macedonia', 'mk', '马其顿语', 'MKD', 'Europe/Skopje');
  R('NO', '47', '挪威', 'Norway', 'no', '挪威语', 'NOK', 'Europe/Oslo');
  R('PL', '48', '波兰', 'Poland', 'pl', '波兰语', 'PLN', 'Europe/Warsaw');
  R('PT', '351', '葡萄牙', 'Portugal', 'pt', '葡萄牙语', 'EUR', 'Europe/Lisbon');
  R('RO', '40', '罗马尼亚', 'Romania', 'ro', '罗马尼亚语', 'RON', 'Europe/Bucharest');
  R('RU', '7', '俄罗斯', 'Russia', 'ru', '俄语', 'RUB', 'Europe/Moscow');
  R('SM', '378', '圣马力诺', 'San Marino', 'it', '意大利语', 'EUR', 'Europe/San_Marino');
  R('RS', '381', '塞尔维亚', 'Serbia', 'sr', '塞尔维亚语', 'RSD', 'Europe/Belgrade');
  R('SK', '421', '斯洛伐克', 'Slovakia', 'sk', '斯洛伐克语', 'EUR', 'Europe/Bratislava');
  R('SI', '386', '斯洛文尼亚', 'Slovenia', 'sl', '斯洛文尼亚语', 'EUR', 'Europe/Ljubljana');
  R('ES', '34', '西班牙', 'Spain', 'es', '西班牙语', 'EUR', 'Europe/Madrid');
  R('SE', '46', '瑞典', 'Sweden', 'sv', '瑞典语', 'SEK', 'Europe/Stockholm');
  R('CH', '41', '瑞士（德语区）', 'Switzerland (German)', 'de', '德语', 'CHF', 'Europe/Zurich');
  R('CH', '41', '瑞士（法语区）', 'Switzerland (French)', 'fr', '法语', 'CHF', 'Europe/Zurich');
  R('UA', '380', '乌克兰', 'Ukraine', 'uk', '乌克兰语', 'UAH', 'Europe/Kyiv');
  R('GB', '44', '英国', 'United Kingdom', 'en', '英语', 'GBP', 'Europe/London');
  R('VA', '379', '梵蒂冈', 'Vatican City', 'it', '意大利语', 'EUR', 'Europe/Vatican');
  R('GE', '995', '格鲁吉亚', 'Georgia', 'ka', '格鲁吉亚语', 'GEL', 'Asia/Tbilisi');
  R('AM', '374', '亚美尼亚', 'Armenia', 'hy', '亚美尼亚语', 'AMD', 'Asia/Yerevan');
  R('AZ', '994', '阿塞拜疆', 'Azerbaijan', 'az', '阿塞拜疆语', 'AZN', 'Asia/Baku');
  R('TR', '90', '土耳其', 'Türkiye', 'tr', '土耳其语', 'TRY', 'Europe/Istanbul');
  R('GL', '299', '格陵兰', 'Greenland', 'kl', '格陵兰语', 'DKK', 'America/Nuuk');

  /* ---------------- 独联体 / 中亚 / 东亚 ---------------- */
  R('KZ', '7', '哈萨克斯坦', 'Kazakhstan', 'kk', '哈萨克语', 'KZT', 'Asia/Almaty');
  R('UZ', '998', '乌兹别克斯坦', 'Uzbekistan', 'uz', '乌兹别克语', 'UZS', 'Asia/Tashkent');
  R('TM', '993', '土库曼斯坦', 'Turkmenistan', 'tk', '土库曼语', 'TMT', 'Asia/Ashgabat');
  R('KG', '996', '吉尔吉斯斯坦', 'Kyrgyzstan', 'ky', '吉尔吉斯语', 'KGS', 'Asia/Bishkek');
  R('TJ', '992', '塔吉克斯坦', 'Tajikistan', 'tg', '塔吉克语', 'TJS', 'Asia/Dushanbe');
  R('MN', '976', '蒙古', 'Mongolia', 'mn', '蒙古语', 'MNT', 'Asia/Ulaanbaatar');
  R('CN', '86', '中国', 'China', 'zh-CN', '中文（简体）', 'CNY', 'Asia/Shanghai');
  R('HK', '852', '中国香港', 'Hong Kong', 'zh', '中文', 'HKD', 'Asia/Hong_Kong');
  R('MO', '853', '中国澳门', 'Macau', 'zh', '中文', 'MOP', 'Asia/Macau');
  R('TW', '886', '中国台湾', 'Taiwan', 'zh-TW', '中文（繁体）', 'TWD', 'Asia/Taipei');
  R('JP', '81', '日本', 'Japan', 'ja', '日语', 'JPY', 'Asia/Tokyo');
  R('KR', '82', '韩国', 'South Korea', 'ko', '韩语', 'KRW', 'Asia/Seoul');
  R('KP', '850', '朝鲜', 'North Korea', 'ko', '韩语', 'KPW', 'Asia/Pyongyang');

  /* ---------------- 南亚 / 东南亚 ---------------- */
  R('IN', '91', '印度', 'India', 'hi', '印地语', 'INR', 'Asia/Kolkata');
  R('PK', '92', '巴基斯坦', 'Pakistan', 'ur', '乌尔都语', 'PKR', 'Asia/Karachi');
  R('BD', '880', '孟加拉国', 'Bangladesh', 'bn', '孟加拉语', 'BDT', 'Asia/Dhaka');
  R('LK', '94', '斯里兰卡', 'Sri Lanka', 'si', '僧伽罗语', 'LKR', 'Asia/Colombo');
  R('NP', '977', '尼泊尔', 'Nepal', 'ne', '尼泊尔语', 'NPR', 'Asia/Kathmandu');
  R('BT', '975', '不丹', 'Bhutan', 'dz', '宗卡语', 'BTN', 'Asia/Thimphu');
  R('MV', '960', '马尔代夫', 'Maldives', 'dv', '迪维希语', 'MVR', 'Indian/Maldives');
  R('MM', '95', '缅甸', 'Myanmar', 'my', '缅甸语', 'MMK', 'Asia/Yangon');
  R('TH', '66', '泰国', 'Thailand', 'th', '泰语', 'THB', 'Asia/Bangkok');
  R('KH', '855', '柬埔寨', 'Cambodia', 'km', '高棉语', 'KHR', 'Asia/Phnom_Penh');
  R('LA', '856', '老挝', 'Laos', 'lo', '老挝语', 'LAK', 'Asia/Vientiane');
  R('VN', '84', '越南', 'Vietnam', 'vi', '越南语', 'VND', 'Asia/Ho_Chi_Minh');
  R('MY', '60', '马来西亚', 'Malaysia', 'ms', '马来语', 'MYR', 'Asia/Kuala_Lumpur');
  R('SG', '65', '新加坡', 'Singapore', 'en', '英语', 'SGD', 'Asia/Singapore');
  R('ID', '62', '印度尼西亚', 'Indonesia', 'id', '印尼语', 'IDR', 'Asia/Jakarta');
  R('PH', '63', '菲律宾', 'Philippines', 'fil', '菲律宾语', 'PHP', 'Asia/Manila');
  R('TL', '670', '东帝汶', 'Timor-Leste', 'pt', '葡萄牙语', 'USD', 'Asia/Dili');
  R('BN', '673', '文莱', 'Brunei', 'ms', '马来语', 'BND', 'Asia/Brunei');

  /* ---------------- 中东 / 阿拉伯 ---------------- */
  R('AF', '93', '阿富汗', 'Afghanistan', 'fa', '波斯语', 'AFN', 'Asia/Kabul');
  R('IR', '98', '伊朗', 'Iran', 'fa', '波斯语', 'IRR', 'Asia/Tehran');
  R('AE', '971', '阿联酋', 'United Arab Emirates', 'ar', '阿拉伯语', 'AED', 'Asia/Dubai');
  R('SA', '966', '沙特阿拉伯', 'Saudi Arabia', 'ar', '阿拉伯语', 'SAR', 'Asia/Riyadh');
  R('QA', '974', '卡塔尔', 'Qatar', 'ar', '阿拉伯语', 'QAR', 'Asia/Qatar');
  R('KW', '965', '科威特', 'Kuwait', 'ar', '阿拉伯语', 'KWD', 'Asia/Kuwait');
  R('BH', '973', '巴林', 'Bahrain', 'ar', '阿拉伯语', 'BHD', 'Asia/Bahrain');
  R('OM', '968', '阿曼', 'Oman', 'ar', '阿拉伯语', 'OMR', 'Asia/Muscat');
  R('IL', '972', '以色列', 'Israel', 'he', '希伯来语', 'ILS', 'Asia/Jerusalem');
  R('PS', '970', '巴勒斯坦', 'Palestine', 'ar', '阿拉伯语', 'ILS', 'Asia/Gaza');
  R('JO', '962', '约旦', 'Jordan', 'ar', '阿拉伯语', 'JOD', 'Asia/Amman');
  R('LB', '961', '黎巴嫩', 'Lebanon', 'ar', '阿拉伯语', 'LBP', 'Asia/Beirut');
  R('SY', '963', '叙利亚', 'Syria', 'ar', '阿拉伯语', 'SYP', 'Asia/Damascus');
  R('IQ', '964', '伊拉克', 'Iraq', 'ar', '阿拉伯语', 'IQD', 'Asia/Baghdad');
  R('YE', '967', '也门', 'Yemen', 'ar', '阿拉伯语', 'YER', 'Asia/Aden');

  /* ---------------- 非洲（北部） ---------------- */
  R('EG', '20', '埃及', 'Egypt', 'ar', '阿拉伯语', 'EGP', 'Africa/Cairo');
  R('MA', '212', '摩洛哥', 'Morocco', 'ar', '阿拉伯语', 'MAD', 'Africa/Casablanca');
  R('DZ', '213', '阿尔及利亚', 'Algeria', 'ar', '阿拉伯语', 'DZD', 'Africa/Algiers');
  R('TN', '216', '突尼斯', 'Tunisia', 'ar', '阿拉伯语', 'TND', 'Africa/Tunis');
  R('LY', '218', '利比亚', 'Libya', 'ar', '阿拉伯语', 'LYD', 'Africa/Tripoli');
  R('SD', '249', '苏丹', 'Sudan', 'ar', '阿拉伯语', 'SDG', 'Africa/Khartoum');
  R('SS', '211', '南苏丹', 'South Sudan', 'en', '英语', 'SSP', 'Africa/Juba');
  R('ET', '251', '埃塞俄比亚', 'Ethiopia', 'am', '阿姆哈拉语', 'ETB', 'Africa/Addis_Ababa');
  R('DJ', '253', '吉布提', 'Djibouti', 'fr', '法语', 'DJF', 'Africa/Djibouti');
  R('ER', '291', '厄立特里亚', 'Eritrea', 'ti', '提格里尼亚语', 'ERN', 'Africa/Asmara');
  R('SO', '252', '索马里', 'Somalia', 'so', '索马里语', 'SOS', 'Africa/Mogadishu');

  /* ---------------- 非洲（西非） ---------------- */
  R('NG', '234', '尼日利亚', 'Nigeria', 'en', '英语', 'NGN', 'Africa/Lagos');
  R('GH', '233', '加纳', 'Ghana', 'en', '英语', 'GHS', 'Africa/Accra');
  R('SN', '221', '塞内加尔', 'Senegal', 'fr', '法语', 'XOF', 'Africa/Dakar');
  R('CI', '225', '科特迪瓦', "Côte d'Ivoire", 'fr', '法语', 'XOF', 'Africa/Abidjan');
  R('ML', '223', '马里', 'Mali', 'fr', '法语', 'XOF', 'Africa/Bamako');
  R('BF', '226', '布基纳法索', 'Burkina Faso', 'fr', '法语', 'XOF', 'Africa/Ouagadougou');
  R('NE', '227', '尼日尔', 'Niger', 'fr', '法语', 'XOF', 'Africa/Niamey');
  R('TD', '235', '乍得', 'Chad', 'fr', '法语', 'XAF', 'Africa/Ndjamena');
  R('CF', '236', '中非', 'Central African Republic', 'fr', '法语', 'XAF', 'Africa/Bangui');
  R('TG', '228', '多哥', 'Togo', 'fr', '法语', 'XOF', 'Africa/Lome');
  R('BJ', '229', '贝宁', 'Benin', 'fr', '法语', 'XOF', 'Africa/Porto-Novo');
  R('GW', '245', '几内亚比绍', 'Guinea-Bissau', 'pt', '葡萄牙语', 'XOF', 'Africa/Bissau');
  R('GN', '224', '几内亚', 'Guinea', 'fr', '法语', 'GNF', 'Africa/Conakry');
  R('SL', '232', '塞拉利昂', 'Sierra Leone', 'en', '英语', 'SLE', 'Africa/Freetown');
  R('LR', '231', '利比里亚', 'Liberia', 'en', '英语', 'LRD', 'Africa/Monrovia');
  R('GM', '220', '冈比亚', 'Gambia', 'en', '英语', 'GMD', 'Africa/Banjul');
  R('GQ', '240', '赤道几内亚', 'Equatorial Guinea', 'es', '西班牙语', 'XAF', 'Africa/Malabo');
  R('ST', '239', '圣多美和普林西比', 'Sao Tome and Principe', 'pt', '葡萄牙语', 'STN', 'Africa/Sao_Tome');
  R('CV', '238', '佛得角', 'Cape Verde', 'pt', '葡萄牙语', 'CVE', 'Atlantic/Cape_Verde');

  /* ---------------- 非洲（中部 / 东部 / 南部） ---------------- */
  R('CM', '237', '喀麦隆', 'Cameroon', 'fr', '法语', 'XAF', 'Africa/Douala');
  R('CG', '242', '刚果（布）', 'Republic of the Congo', 'fr', '法语', 'XAF', 'Africa/Brazzaville');
  R('CD', '243', '刚果（金）', 'DR Congo', 'fr', '法语', 'CDF', 'Africa/Kinshasa');
  R('GA', '241', '加蓬', 'Gabon', 'fr', '法语', 'XAF', 'Africa/Libreville');
  R('RW', '250', '卢旺达', 'Rwanda', 'rw', '卢旺达语', 'RWF', 'Africa/Kigali');
  R('BI', '257', '布隆迪', 'Burundi', 'fr', '法语', 'BIF', 'Africa/Bujumbura');
  R('KE', '254', '肯尼亚', 'Kenya', 'sw', '斯瓦希里语', 'KES', 'Africa/Nairobi');
  R('TZ', '255', '坦桑尼亚', 'Tanzania', 'sw', '斯瓦希里语', 'TZS', 'Africa/Dar_es_Salaam');
  R('UG', '256', '乌干达', 'Uganda', 'en', '英语', 'UGX', 'Africa/Kampala');
  R('ZA', '27', '南非', 'South Africa', 'en', '英语', 'ZAR', 'Africa/Johannesburg');
  R('ZW', '263', '津巴布韦', 'Zimbabwe', 'en', '英语', 'ZWL', 'Africa/Harare');
  R('ZM', '260', '赞比亚', 'Zambia', 'en', '英语', 'ZMW', 'Africa/Lusaka');
  R('MW', '265', '马拉维', 'Malawi', 'en', '英语', 'MWK', 'Africa/Blantyre');
  R('MZ', '258', '莫桑比克', 'Mozambique', 'pt', '葡萄牙语', 'MZN', 'Africa/Maputo');
  R('AO', '244', '安哥拉', 'Angola', 'pt', '葡萄牙语', 'AOA', 'Africa/Luanda');
  R('NA', '264', '纳米比亚', 'Namibia', 'en', '英语', 'NAD', 'Africa/Windhoek');
  R('BW', '267', '博茨瓦纳', 'Botswana', 'en', '英语', 'BWP', 'Africa/Gaborone');
  R('LS', '266', '莱索托', 'Lesotho', 'en', '英语', 'LSL', 'Africa/Maseru');
  R('SZ', '268', '斯威士兰', 'Eswatini', 'en', '英语', 'SZL', 'Africa/Mbabane');
  R('MU', '230', '毛里求斯', 'Mauritius', 'en', '英语', 'MUR', 'Indian/Mauritius');
  R('SC', '248', '塞舌尔', 'Seychelles', 'en', '英语', 'SCR', 'Indian/Mahe');
  R('MG', '261', '马达加斯加', 'Madagascar', 'fr', '法语', 'MGA', 'Indian/Antananarivo');
  R('KM', '269', '科摩罗', 'Comoros', 'ar', '阿拉伯语', 'KMF', 'Indian/Comoro');
  R('RE', '262', '留尼汪', 'Réunion', 'fr', '法语', 'EUR', 'Indian/Reunion');
  R('SH', '290', '圣赫勒拿', 'Saint Helena', 'en', '英语', 'SHP', 'Atlantic/St_Helena');

  /* ---------------- 北美 ---------------- */
  R('US', '1', '美国', 'United States', 'en', '英语', 'USD', 'America/New_York');
  R('CA', '1', '加拿大（英语区）', 'Canada (English)', 'en', '英语', 'CAD', 'America/Toronto');
  R('CA', '1', '加拿大（魁北克法语区）', 'Canada (Québec)', 'fr', '法语', 'CAD', 'America/Montreal');
  R('MX', '52', '墨西哥', 'Mexico', 'es', '西班牙语', 'MXN', 'America/Mexico_City');

  /* ---------------- 中美洲 ---------------- */
  R('GT', '502', '危地马拉', 'Guatemala', 'es', '西班牙语', 'GTQ', 'America/Guatemala');
  R('BZ', '501', '伯利兹', 'Belize', 'en', '英语', 'BZD', 'America/Belize');
  R('SV', '503', '萨尔瓦多', 'El Salvador', 'es', '西班牙语', 'USD', 'America/El_Salvador');
  R('HN', '504', '洪都拉斯', 'Honduras', 'es', '西班牙语', 'HNL', 'America/Tegucigalpa');
  R('NI', '505', '尼加拉瓜', 'Nicaragua', 'es', '西班牙语', 'NIO', 'America/Managua');
  R('CR', '506', '哥斯达黎加', 'Costa Rica', 'es', '西班牙语', 'CRC', 'America/Costa_Rica');
  R('PA', '507', '巴拿马', 'Panama', 'es', '西班牙语', 'USD', 'America/Panama');
  R('CU', '53', '古巴', 'Cuba', 'es', '西班牙语', 'CUP', 'America/Havana');
  R('HT', '509', '海地', 'Haiti', 'fr', '法语', 'HTG', 'America/Port-au-Prince');

  /* ---------------- 加勒比（NANP 长前缀） ---------------- */
  R('JM', '1876', '牙买加', 'Jamaica', 'en', '英语', 'JMD', 'America/Jamaica');
  R('BS', '1242', '巴哈马', 'Bahamas', 'en', '英语', 'BSD', 'America/Nassau');
  R('BB', '1246', '巴巴多斯', 'Barbados', 'en', '英语', 'BBD', 'America/Barbados');
  R('TT', '1868', '特立尼达和多巴哥', 'Trinidad and Tobago', 'en', '英语', 'TTD', 'America/Port_of_Spain');
  R('DO', '1809', '多米尼加共和国', 'Dominican Republic', 'es', '西班牙语', 'DOP', 'America/Santo_Domingo');
  R('PR', '1787', '波多黎各', 'Puerto Rico', 'es', '西班牙语', 'USD', 'America/Puerto_Rico');
  R('AG', '1268', '安提瓜和巴布达', 'Antigua and Barbuda', 'en', '英语', 'XCD', 'America/Antigua');
  R('AI', '1264', '安圭拉', 'Anguilla', 'en', '英语', 'XCD', 'America/Anguilla');
  R('BM', '1441', '百慕大', 'Bermuda', 'en', '英语', 'BMD', 'Atlantic/Bermuda');
  R('KY', '1345', '开曼群岛', 'Cayman Islands', 'en', '英语', 'KYD', 'America/Cayman');
  R('DM', '1767', '多米尼克', 'Dominica', 'en', '英语', 'XCD', 'America/Dominica');
  R('GD', '1473', '格林纳达', 'Grenada', 'en', '英语', 'XCD', 'America/Grenada');
  R('MS', '1664', '蒙特塞拉特', 'Montserrat', 'en', '英语', 'XCD', 'America/Montserrat');
  R('SX', '1721', '荷属圣马丁', 'Sint Maarten', 'nl', '荷兰语', 'ANG', 'America/Lower_Princes');
  R('LC', '1758', '圣卢西亚', 'Saint Lucia', 'en', '英语', 'XCD', 'America/St_Lucia');
  R('VC', '1784', '圣文森特和格林纳丁斯', 'Saint Vincent and the Grenadines', 'en', '英语', 'XCD', 'America/St_Vincent');
  R('KN', '1869', '圣基茨和尼维斯', 'Saint Kitts and Nevis', 'en', '英语', 'XCD', 'America/St_Kitts');
  R('TC', '1649', '特克斯和凯科斯群岛', 'Turks and Caicos Islands', 'en', '英语', 'USD', 'America/Grand_Turk');
  R('VG', '1284', '英属维尔京群岛', 'British Virgin Islands', 'en', '英语', 'USD', 'America/Tortola');
  R('VI', '1340', '美属维尔京群岛', 'U.S. Virgin Islands', 'en', '英语', 'USD', 'America/St_Thomas');
  R('GU', '1671', '关岛', 'Guam', 'en', '英语', 'USD', 'Pacific/Guam');
  R('AS', '1684', '美属萨摩亚', 'American Samoa', 'en', '英语', 'USD', 'Pacific/Pago_Pago');
  R('AW', '297', '阿鲁巴', 'Aruba', 'nl', '荷兰语', 'AWG', 'America/Aruba');
  R('CW', '599', '库拉索', 'Curaçao', 'nl', '荷兰语', 'ANG', 'America/Curacao');
  R('GP', '590', '瓜德罗普', 'Guadeloupe', 'fr', '法语', 'EUR', 'America/Guadeloupe');
  R('MQ', '596', '马提尼克', 'Martinique', 'fr', '法语', 'EUR', 'America/Martinique');

  /* ---------------- 南美洲 ---------------- */
  R('VZ', '58', '委内瑞拉', 'Venezuela', 'es', '西班牙语', 'VES', 'America/Caracas');
  R('CO', '57', '哥伦比亚', 'Colombia', 'es', '西班牙语', 'COP', 'America/Bogota');
  R('EC', '593', '厄瓜多尔', 'Ecuador', 'es', '西班牙语', 'USD', 'America/Guayaquil');
  R('PE', '51', '秘鲁', 'Peru', 'es', '西班牙语', 'PEN', 'America/Lima');
  R('BO', '591', '玻利维亚', 'Bolivia', 'es', '西班牙语', 'BOB', 'America/La_Paz');
  R('CL', '56', '智利', 'Chile', 'es', '西班牙语', 'CLP', 'America/Santiago');
  R('AR', '54', '阿根廷', 'Argentina', 'es', '西班牙语', 'ARS', 'America/Argentina/Buenos_Aires');
  R('UY', '598', '乌拉圭', 'Uruguay', 'es', '西班牙语', 'UYU', 'America/Montevideo');
  R('PY', '595', '巴拉圭', 'Paraguay', 'es', '西班牙语', 'PYG', 'America/Asuncion');
  R('BR', '55', '巴西', 'Brazil', 'pt', '葡萄牙语', 'BRL', 'America/Sao_Paulo');
  R('GY', '592', '圭亚那', 'Guyana', 'en', '英语', 'GYD', 'America/Guyana');
  R('SR', '597', '苏里南', 'Suriname', 'nl', '荷兰语', 'SRD', 'America/Paramaribo');
  R('GF', '594', '法属圭亚那', 'French Guiana', 'fr', '法语', 'EUR', 'America/Cayenne');

  /* ---------------- 大洋洲 ---------------- */
  R('AU', '61', '澳大利亚', 'Australia', 'en', '英语', 'AUD', 'Australia/Sydney');
  R('NZ', '64', '新西兰', 'New Zealand', 'en', '英语', 'NZD', 'Pacific/Auckland');
  R('PG', '675', '巴布亚新几内亚', 'Papua New Guinea', 'en', '英语', 'PGK', 'Pacific/Port_Moresby');
  R('FJ', '679', '斐济', 'Fiji', 'en', '英语', 'FJD', 'Pacific/Fiji');
  R('SB', '677', '所罗门群岛', 'Solomon Islands', 'en', '英语', 'SBD', 'Pacific/Guadalcanal');
  R('VU', '678', '瓦努阿图', 'Vanuatu', 'en', '英语', 'VUV', 'Pacific/Efate');
  R('NC', '687', '新喀里多尼亚', 'New Caledonia', 'fr', '法语', 'XPF', 'Pacific/Noumea');
  R('WS', '685', '萨摩亚', 'Samoa', 'sm', '萨摩亚语', 'WST', 'Pacific/Apia');
  R('TO', '676', '汤加', 'Tonga', 'to', '汤加语', 'TOP', 'Pacific/Tongatapu');
  R('TV', '688', '图瓦卢', 'Tuvalu', 'en', '英语', 'TVD', 'Pacific/Funafuti');
  R('KI', '686', '基里巴斯', 'Kiribati', 'en', '英语', 'KIR', 'Pacific/Tarawa');
  R('NR', '674', '瑙鲁', 'Nauru', 'en', '英语', 'AUD', 'Pacific/Nauru');
  R('PW', '680', '帕劳', 'Palau', 'en', '英语', 'USD', 'Pacific/Palau');
  R('FM', '691', '密克罗尼西亚联邦', 'Micronesia', 'en', '英语', 'USD', 'Pacific/Chuuk');
  R('MH', '692', '马绍尔群岛', 'Marshall Islands', 'en', '英语', 'USD', 'Pacific/Majuro');
  R('CK', '682', '库克群岛', 'Cook Islands', 'en', '英语', 'NZD', 'Pacific/Rarotonga');
  R('NU', '683', '纽埃', 'Niue', 'en', '英语', 'NZD', 'Pacific/Niue');
  R('TK', '690', '托克劳', 'Tokelau', 'en', '英语', 'NZD', 'Pacific/Fakaofo');

  /* ================= 索引与查询 ================= */

  /* 加拿大主要区号（NANP 内与美国共享 +1，按区号区分） */
  var CA_AREAS = {};
  ('204 226 236 250 289 306 343 367 368 403 416 418 431 438 450 506 514 519 548 579 581 587 604 613 639 647 705 709 778 780 819 825 867 873 902 905')
    .split(' ').forEach(function (a) { CA_AREAS[a] = true; });

  /* 哈萨克斯坦在 +7 下的移动/主要区号（与俄罗斯共享 +7，按前缀区分） */
  var KZ_PREFIXES = ['700', '701', '702', '705', '707', '717', '727', '747', '771', '775', '776', '777', '778', '779'];

  function cleanDigits(s) {
    return String(s == null ? '' : s).replace(/[^\d]/g, '');
  }

  /* calling -> 首条记录；同时按区号长度降序，便于最长前缀匹配 */
  var byCalling = {};
  LIST.forEach(function (r) {
    if (!byCalling[r.calling]) byCalling[r.calling] = r;
  });
  var codeKeys = Object.keys(byCalling).sort(function (a, b) { return b.length - a.length; });

  function recordByCode(code) {
    for (var i = 0; i < LIST.length; i++) {
      if (LIST[i].code === code) return LIST[i];
    }
    return null;
  }

  /* 按「最长区号前缀」匹配；未命中返回 null。
   * 对共享前缀做二次消歧：1=美国/加拿大（按加拿大区号），7=俄罗斯/哈萨克斯坦（按哈国前缀）。 */
  function lookupByPhone(raw) {
    var d = cleanDigits(raw);
    if (!d) return null;
    if (d.indexOf('00') === 0) d = d.slice(2);

    var best = null, bestLen = 0;
    for (var i = 0; i < codeKeys.length; i++) {
      var c = codeKeys[i];
      if (d.indexOf(c) === 0 && c.length > bestLen) {
        best = byCalling[c];
        bestLen = c.length;
      }
    }
    if (!best) return null;

    /* 1：美国 / 加拿大 */
    if (best.code === 'US') {
      var area = d.slice(1, 4);
      if (CA_AREAS[area]) return recordByCode('CA') || best;
    }
    /* 7：俄罗斯 / 哈萨克斯坦 */
    if (best.code === 'RU') {
      var rest = d.slice(1);
      for (var j = 0; j < KZ_PREFIXES.length; j++) {
        if (rest.indexOf(KZ_PREFIXES[j]) === 0) return recordByCode('KZ') || best;
      }
    }
    return best;
  }

  /* 按区号取第一条记录（入参可带 +，内部清洗） */
  function findByCalling(code) {
    var c = cleanDigits(code);
    return byCalling[c] || null;
  }

  WTC.countries = {
    list: LIST,
    lookupByPhone: lookupByPhone,
    findByCalling: findByCalling
  };
})();



/* ---- translators/google.js ---- */
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



/* ---- translators/bing.js ---- */
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



/* ---- translators/volcano.js ---- */
/* =====================================================================
 * WATransChat shared-core · translators/volcano.js
 * 火山引擎机器翻译（机器翻译 2020-06-01，TranslateText）。
 * 使用 state.engines.volcano 的 accessKeyId/secretAccessKey/region/host，
 * 按火山签名 V4（HMAC-SHA256，WebCrypto crypto.subtle）签名。
 * 密钥为空直接 reject，交由降级逻辑接管。
 * 纯 JS，挂载到 window.WTC.engines.volcano，网络一律走 WTC.net.http。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};
  WTC.engines = WTC.engines || {};

  var SERVICE = 'translate';
  var VERSION = '2020-06-01';
  var ACTION = 'TranslateText';

  /* ---- WebCrypto 基础工具 ---- */
  function toBytes(str) {
    return new TextEncoder().encode(str);
  }
  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }
  function sha256Hex(str) {
    return crypto.subtle.digest('SHA-256', toBytes(str)).then(hex);
  }
  function hmac(keyBytes, msg) {
    return crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then(function (k) { return crypto.subtle.sign('HMAC', k, toBytes(msg)); });
  }

  /* 签名密钥派生：secret -> date -> region -> service -> request */
  function deriveSigningKey(secret, date, region, service) {
    return hmac(toBytes(secret), date)
      .then(function (k1) { return hmac(k1, region); })
      .then(function (k2) { return hmac(k2, service); })
      .then(function (k3) { return hmac(k3, 'request'); });
  }

  /* 火山语言码：简繁都归并为 zh；auto 时省略 SourceLanguage */
  function mapSrc(l) {
    if (!l || l === 'auto') return '';
    if (l === 'zh-CN' || l === 'zh-TW' || l === 'zh-Hans' || l === 'zh-Hant') return 'zh';
    return l;
  }
  function mapTgt(l) {
    if (!l) return '';
    if (l === 'zh-CN' || l === 'zh-TW' || l === 'zh-Hans' || l === 'zh-Hant') return 'zh';
    return l;
  }

  WTC.engines.volcano = {
    id: 'volcano',
    name: '火山引擎翻译',
    /* translate(text, from, to, state) -> Promise<string> */
    translate: function (text, from, to, state) {
      var cfg = (state && state.engines && state.engines.volcano) || {};
      if (!cfg.accessKeyId || !cfg.secretAccessKey) {
        return Promise.reject(new Error('请在设置中填写火山引擎 AccessKey/SecretKey'));
      }
      if (!crypto || !crypto.subtle) {
        return Promise.reject(new Error('当前环境不支持 WebCrypto 签名（需安全上下文），火山引擎不可用'));
      }

      var region = cfg.region || 'cn-north-1';
      var host = cfg.host || 'open.volcengineapi.com';

      var bodyObj = { TextList: [text] };
      var src = mapSrc(from);
      if (src) bodyObj.SourceLanguage = src;
      var tgt = mapTgt(to);
      if (tgt) bodyObj.TargetLanguage = tgt;
      var bodyStr = JSON.stringify(bodyObj);

      var now = new Date();
      var xDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); // YYYYMMDDTHHMMSSZ
      var shortDate = xDate.slice(0, 8);
      var scope = shortDate + '/' + region + '/' + SERVICE + '/request';
      var query = 'Action=' + ACTION + '&Version=' + VERSION; // 已按字母序

      return sha256Hex(bodyStr).then(function (payloadHash) {
        /* 规范请求 */
        var canonicalReq = [
          'POST',
          '/',
          query,
          'host:' + host,
          'x-date:' + xDate,
          '',
          'host;x-date',
          payloadHash
        ].join('\n');
        return sha256Hex(canonicalReq).then(function (reqHash) {
          var stringToSign = ['HMAC-SHA256', xDate, scope, reqHash].join('\n');
          return deriveSigningKey(cfg.secretAccessKey, shortDate, region, SERVICE)
            .then(function (kSigning) { return hmac(kSigning, stringToSign); })
            .then(function (sigBuf) {
              var authorization = 'HMAC-SHA256 Credential=' + cfg.accessKeyId + '/' + scope +
                ', SignedHeaders=host;x-date, Signature=' + hex(sigBuf);
              return WTC.net.http('https://' + host + '/?' + query, {
                method: 'POST',
                headers: {
                  'Host': host,
                  'Content-Type': 'application/json; charset=UTF-8',
                  'X-Date': xDate,
                  'Authorization': authorization
                },
                body: bodyStr
              });
            });
        });
      }).then(function (r) {
        var data = JSON.parse(r.body);
        if (data.ResponseMetadata && data.ResponseMetadata.Error) {
          throw new Error('火山引擎：' + data.ResponseMetadata.Error.Message);
        }
        var list = data.Result && data.Result.TranslationList;
        if (!list || !list[0] || !list[0].Translation) {
          throw new Error('火山引擎返回格式异常');
        }
        return list[0].Translation;
      });
    }
  };
})();



/* ---- translators/deepl.js ---- */
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



/* ---- modules/translate.js ---- */
/* =====================================================================
 * WATransChat shared-core · modules/translate.js
 * 翻译编排：统一入口 translate(text,from,to,engine)；带缓存、并发去重、
 * 失败重试、引擎降级、超长分段。引擎实现挂在 WTC.engines。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.engines = WTC.engines || {};

  var cache = new Map();           // key -> 译文
  var inflight = new Map();        // key -> Promise
  var MAX_CACHE = 3000;
  var SEG_LEN = 1200;              // 超长文本分段长度（字符）

  function cacheKey(engine, from, to, text) {
    return engine + '|' + (from || 'auto') + '|' + to + '|' + text;
  }
  function putCache(k, v) {
    if (cache.size >= MAX_CACHE) {
      var firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(k, v);
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* 调用单个引擎，带重试 */
  function callEngine(engine, text, from, to, tries) {
    var impl = WTC.engines[engine];
    if (!impl) return Promise.reject(new Error('引擎不存在: ' + engine));
    var attempt = 0;
    function go() {
      return Promise.resolve()
        .then(function () { return impl.translate(text, from || 'auto', to, WTC.state); })
        .catch(function (err) {
          attempt++;
          if (attempt < tries) return sleep(200 * attempt).then(go);
          throw err;
        });
    }
    return go();
  }

  /* 分段 + 合并（按句尽量在标点处切，避免破坏语义） */
  function splitSegments(text) {
    if (text.length <= SEG_LEN) return [text];
    var segs = [], rest = text;
    while (rest.length > SEG_LEN) {
      var cut = rest.lastIndexOf('\n', SEG_LEN);
      if (cut < SEG_LEN * 0.5) cut = rest.lastIndexOf('. ', SEG_LEN);
      if (cut < SEG_LEN * 0.5) cut = rest.lastIndexOf('。', SEG_LEN);
      if (cut < SEG_LEN * 0.5) cut = SEG_LEN;
      segs.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    if (rest) segs.push(rest);
    return segs;
  }

  /* 带降级的单次翻译（不做分段） */
  function oneWithFallback(engine, text, from, to) {
    var order = [engine];
    if (engine !== 'google') order.push('google');
    if (engine !== 'bing') order.push('bing');
    var lastErr;
    return order.reduce(function (p, eng) {
      return p.catch(function (e) {
        lastErr = e;
        return callEngine(eng, text, from, to, 2);
      });
    }, Promise.reject(new Error('init'))).catch(function () {
      throw lastErr || new Error('所有引擎均失败');
    });
  }

  /* 核心：translate */
  function translate(text, from, to, engine) {
    text = String(text == null ? '' : text).trim();
    if (!text) return Promise.resolve('');
    if (!to) return Promise.resolve(text);
    var eng = engine || (WTC.state && WTC.state.engine) || 'google';
    var k = cacheKey(eng, from, to, text);
    if (cache.has(k)) return Promise.resolve(cache.get(k));
    if (inflight.has(k)) return inflight.get(k);

    var segs = splitSegments(text);
    var p = segs.reduce(function (chain, seg) {
      return chain.then(function (acc) {
        return oneWithFallback(eng, seg, from, to).then(function (tr) {
          return acc + tr;
        });
      });
    }, Promise.resolve(''))
      .then(function (result) {
        result = result.trim();
        putCache(k, result);
        inflight.delete(k);
        return result;
      })
      .catch(function (err) {
        inflight.delete(k);
        throw err;
      });

    inflight.set(k, p);
    return p;
  }

  /* 批量：串行处理一组 {text,from,to,engine}，返回等长结果数组 */
  function translateMany(items) {
    return items.reduce(function (chain, it) {
      return chain.then(function (acc) {
        return translate(it.text, it.from, it.to, it.engine)
          .then(function (r) { acc.push(r); return acc; })
          .catch(function () { acc.push(null); return acc; });
      });
    }, Promise.resolve([]));
  }

  WTC.translator = {
    translate: translate,
    translateMany: translateMany,
    clearCache: function () { cache.clear(); inflight.clear(); },
    cacheSize: function () { return cache.size; }
  };
})();



/* ---- modules/messages.js ---- */
/* =====================================================================
 * WATransChat shared-core · modules/messages.js
 * 1) 实时双向翻译：扫描可见气泡，每条只插一次译文（below/right/only）；
 * 2) 输入翻译并发送：autoSend 开启时拦截回车/发送按钮先译后发，关闭时
 *    在输入框旁提供「翻译并发送」按钮；
 * 3) 语音输入：Web Speech API 转文字填入输入框，再按 autoSend 逻辑发送。
 * 暴露 WTC.composeSend / WTC.composeFill / WTC.composeTargetLang 供其它模块复用。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.registerModule('messages', function (ctx) {
    var utils = WTC.utils;
    var seenMarks = new Set();
    var bypassSend = false;       // 原生发送时绕过拦截
    var actionsMounted = false;

    /* ---------- 基础：输入框 / 发送按钮 ---------- */
    function getInput() { return utils.find('inputBox'); }
    function getSendBtn() { return utils.find('sendButton'); }

    function readInput(el) {
      el = el || getInput();
      if (!el) return '';
      return (el.innerText || el.textContent || '').replace(/ /g, ' ').trim();
    }

    /* 写入 contenteditable（execCommand 优先，事件兜底） */
    function fillInput(el, text) {
      if (!el) return;
      el.focus();
      try {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = root.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('delete', false, null);
      } catch (e) { el.textContent = ''; }
      if (text) {
        try {
          document.execCommand('insertText', false, text);
        } catch (e) {
          el.textContent = text;
        }
      }
      try {
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) {}
    }

    /* 当前联系人目标语言：联系人级设置 > 国家推断 > 空 */
    function currentTargetLang() {
      var cc = WTC.currentChat && WTC.currentChat.chatId;
      var c = cc && WTC.state.contacts[cc];
      if (c && c.targetLang) return c.targetLang;
      return (WTC.currentChat && WTC.currentChat.targetLang) || '';
    }
    function engineFor(chatId) {
      var c = chatId && WTC.state.contacts[chatId];
      return (c && c.engine) || WTC.state.engine;
    }

    /* 原生点击发送（带绕过标记，避免被自己的拦截再次截获） */
    function nativeSend() {
      var btn = getSendBtn();
      bypassSend = true;
      setTimeout(function () { bypassSend = false; }, 900);
      if (btn) {
        btn.click();
      } else {
        var inp = getInput();
        if (inp) {
          inp.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', which: 13, keyCode: 13, bubbles: true
          }));
        }
      }
    }

    /* 翻译输入框文本（中文->客户语言）并发送；text 为空则取输入框内容 */
    function sendTranslated(zhText) {
      var text = (zhText != null ? zhText : readInput()).trim();
      if (!text) return;
      var to = currentTargetLang() || 'en';
      var eng = engineFor(WTC.currentChat && WTC.currentChat.chatId);
      var inp = getInput();
      WTC.translator.translate(text, WTC.state.myLanguage, to, eng)
        .then(function (tr) {
          fillInput(inp, tr || text);
          nativeSend();
        })
        .catch(function () {
          WTC.toast('翻译失败，已发送原文');
          fillInput(inp, text);
          nativeSend();
        });
    }

    /* 对外暴露，供快捷短语/待办等模块复用同一套翻译发送逻辑 */
    WTC.composeSend = sendTranslated;
    WTC.composeFill = fillInput;
    WTC.composeTargetLang = currentTargetLang;

    /* ---------- 自动发送：拦截回车 + 发送按钮（capture 阶段） ---------- */
    document.addEventListener('keydown', function (e) {
      if (bypassSend || !WTC.state || !WTC.state.enabled || !WTC.state.autoSend) return;
      if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
      var inp = getInput();
      if (!inp) return;
      var t = e.target;
      if (t !== inp && !inp.contains(t)) return;
      e.preventDefault();
      e.stopPropagation();
      sendTranslated();
    }, true);

    document.addEventListener('click', function (e) {
      if (bypassSend || !WTC.state || !WTC.state.enabled || !WTC.state.autoSend) return;
      var t = e.target;
      if (!t || !t.closest) return;
      var btn = t.closest('button[aria-label*="Send"],button[aria-label*="send"],button[aria-label*="发送"],button[data-testid="send"],span[data-icon="send"]');
      if (!btn) return;
      var inp = getInput();
      if (!inp) return;
      e.preventDefault();
      e.stopPropagation();
      sendTranslated();
    }, true);

    /* ---------- 输入框旁操作区：翻译并发送按钮（autoSend 关时）+ 语音按钮 ---------- */
    function mountActions() {
      var footer = utils.find('footer') || (getInput() && getInput().closest('footer'));
      if (!footer) return;
      var box = footer.querySelector('.wtc-input-actions');
      if (!box) {
        box = utils.el('div', { class: 'wtc-input-actions' });
        footer.appendChild(box);
      }
      // 翻译并发送（autoSend 关闭时显示）
      var sendBtn = box.querySelector('.wtc-ia-btn.wtc-translate-send');
      if (!WTC.state.autoSend) {
        if (!sendBtn) {
          sendBtn = utils.el('button', { class: 'wtc-ia-btn wtc-translate-send', title: '翻译并发送' }, '译');
          sendBtn.addEventListener('click', function () { sendTranslated(); });
          box.appendChild(sendBtn);
        }
      } else if (sendBtn) {
        sendBtn.parentNode.removeChild(sendBtn);
      }
      // 语音输入按钮
      if (WTC.state.voiceInput !== false) {
        if (!box.querySelector('.wtc-ia-btn.wtc-voice')) {
          var mic = utils.el('button', { class: 'wtc-ia-btn wtc-ghost wtc-voice', title: '语音输入' }, '🎤');
          mic.addEventListener('pointerdown', startVoice);
          mic.addEventListener('pointerup', stopVoice);
          mic.addEventListener('pointerleave', stopVoice);
          mic.addEventListener('click', function (e) { e.preventDefault(); });
          box.appendChild(mic);
        }
      }
    }

    /* ---------- 语音输入（Web Speech API） ---------- */
    var recognition = null;
    var voiceOverlay = null;
    var voiceFinal = '';

    function showVoiceOverlay() {
      if (voiceOverlay) return;
      voiceOverlay = utils.el('div', { class: 'wtc-voice-overlay' });
      voiceOverlay.appendChild(utils.el('div', { class: 'wtc-voice-title' }, '倾听中，松手结束'));
      voiceOverlay.appendChild(utils.el('div', { class: 'wtc-voice-wave' }, '· · · · · · · · · · · · · · · ·'));
      voiceOverlay.appendChild(utils.el('div', { class: 'wtc-voice-lang' }, '转文字·普通话'));
      document.body.appendChild(voiceOverlay);
    }
    function hideVoiceOverlay() {
      if (voiceOverlay) { voiceOverlay.parentNode && voiceOverlay.parentNode.removeChild(voiceOverlay); voiceOverlay = null; }
    }

    function startVoice() {
      var SR = root.SpeechRecognition || root.webkitSpeechRecognition;
      if (!SR) { WTC.toast('当前浏览器不支持语音输入'); return; }
      if (recognition) return;
      showVoiceOverlay();
      recognition = new SR();
      recognition.lang = WTC.state.myLanguage || 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;
      voiceFinal = '';
      var inp = getInput();
      recognition.onresult = function (ev) {
        var interim = '';
        for (var i = ev.resultIndex; i < ev.results.length; i++) {
          var r = ev.results[i];
          if (r.isFinal) voiceFinal += r[0].transcript;
          else interim += r[0].transcript;
        }
        if (inp) fillInput(inp, (voiceFinal + interim).trim());
      };
      recognition.onend = function () {
        recognition = null;
        hideVoiceOverlay();
        var text = (voiceFinal || readInput()).trim();
        if (!text) return;
        if (WTC.state.autoSend) sendTranslated(text);
      };
      recognition.onerror = function () {
        recognition = null;
        hideVoiceOverlay();
        WTC.toast('语音识别失败，请重试');
      };
      try { recognition.start(); } catch (e) { recognition = null; hideVoiceOverlay(); }
    }
    function stopVoice() {
      if (recognition) { try { recognition.stop(); } catch (e) {} }
    }

    /* ---------- 气泡翻译扫描 ---------- */
    function markOf(row, text) {
      var id = utils.bubbleId(row);
      if (id) return 'b_' + id;
      return 't_' + text.length + '_' + text.slice(0, 32);
    }

    function translateRow(row) {
      if (!WTC.state.enabled) return;
      var dir = utils.dirOf(row);
      if (dir === 'in' && !WTC.state.translateIncoming) return;
      if (dir === 'out' && !WTC.state.translateOutgoing) return;
      var text = utils.bubblePlain(row);
      if (!text) return;
      var host = row.querySelector('div.copyable-text') || row.querySelector('span.selectable-text');
      if (!host) return;
      var mark = markOf(row, text);
      if (host.getAttribute('data-wtc-mark') === mark || seenMarks.has(mark)) return;
      seenMarks.add(mark);
      host.setAttribute('data-wtc-mark', mark);

      var pos = WTC.state.translatePosition || 'below';
      var to = WTC.state.myLanguage;
      var eng = engineFor(WTC.currentChat && WTC.currentChat.chatId);

      WTC.translator.translate(text, 'auto', to, eng)
        .then(function (tr) {
          if (!tr || !host.isConnected) return;
          var old = host.querySelector('.wtc-translation');
          if (old) old.parentNode.removeChild(old);

          // only：隐藏原文
          if (pos === 'only') {
            var spans = host.querySelectorAll('span.selectable-text');
            Array.prototype.forEach.call(spans, function (sp) {
              if (!sp.querySelector('.wtc-translation')) sp.style.display = 'none';
            });
          }

          var cls = 'wtc-translation';
          if (pos === 'right') cls += ' wtc-translation-inline';
          if (utils.isRTL(to)) cls += ' wtc-rtl';
          var trEl = utils.el('span', { class: cls, 'data-wtc-translated': '1' });
          trEl.textContent = tr;
          host.appendChild(trEl);
        })
        .catch(function () {
          host.removeAttribute('data-wtc-mark');
          seenMarks.delete(mark);
        });
    }

    function scan() {
      if (!WTC.state.enabled) return;
      mountActions();
      var rows = utils.findAll('messageRows');
      Array.prototype.forEach.call(rows, function (row) {
        if (!utils.inViewport(row)) return;
        translateRow(row);
      });
    }

    WTC.onDomChanged(utils.debounce(scan, 120));
    scan();
  });
})();



/* ---- modules/countryBar.js ---- */
/* =====================================================================
 * WATransChat shared-core · modules/countryBar.js
 * 聊天头部下方插入信息条（wtc-topbar）：
 *   第1行 号码 + 中文国家名（.wtc-country）
 *   第2行 语言中文名 · 货币代码 · 当地时间 HH:MM:SS（每秒刷新）
 *   附「最后上线时间」（尽力从头部副标题提取，无则不显示）
 * 号码经 normalizePhone + WTC.countries.lookupByPhone 推断，
 * 结果写入 WTC.currentChat={phone,chatId,country,targetLang}；
 * 点击信息条调用 settingsPanel.openLang()。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.registerModule('countryBar', function (ctx) {
    var utils = WTC.utils;
    var bar = null;
    var clockTimer = null;
    var lastKey = '';

    function openLang() {
      var panel = WTC.modules && WTC.modules.settingsPanel;
      if (panel && typeof panel.openLang === 'function') panel.openLang();
      else if (typeof WTC.openLang === 'function') WTC.openLang();
    }

    /* 尽力从头部提取「最后上线时间」副标题 */
    function extractSeen(header) {
      if (!header) return '';
      var title = utils.find('headerTitle', header);
      var spans = header.querySelectorAll('span[title], span[dir="auto"]');
      var candidates = [];
      Array.prototype.forEach.call(spans, function (s) {
        var t = (s.textContent || '').trim();
        if (!t || (title && s === title)) return;
        if (/online|last seen|最后上线|在线|今天|昨天|分钟前|小时前|ago|小时|分钟/i.test(t)) candidates.push(t);
      });
      return candidates[0] || '';
    }

    function buildBar() {
      var header = utils.find('chatHeader');
      if (!header) return;

      var raw = utils.headerText();
      var phone = utils.normalizePhone(raw);
      var key = phone || raw;
      if (key === lastKey && bar) return;
      lastKey = key;

      // 旧条移除，旧时钟停掉
      if (bar) { bar.parentNode && bar.parentNode.removeChild(bar); bar = null; }
      if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }

      var rec = null;
      if (phone && WTC.countries && typeof WTC.countries.lookupByPhone === 'function') {
        rec = WTC.countries.lookupByPhone(phone) || null;
      }

      var chatId = phone ? phone.replace(/^\+/, '') + '@c.us' : '';
      var saved = chatId && WTC.state.contacts[chatId];
      var targetLang = (saved && saved.targetLang) || (rec && rec.lang) || '';

      WTC.currentChat = {
        phone: phone,
        chatId: chatId,
        country: rec,
        targetLang: targetLang
      };

      bar = utils.el('div', { class: 'wtc-topbar', 'data-wtc-countrybar': '1' });
      var ic = utils.el('div', { class: 'wtc-topbar-ic' }, '👤');
      var lines = utils.el('div', { class: 'wtc-topbar-lines' });

      var line1 = utils.el('div', { class: 'wtc-topbar-line1' });
      var numSpan = utils.el('span', { class: 'wtc-topbar-phone' }, raw || phone || '未知号码');
      line1.appendChild(numSpan);
      if (rec && rec.zh) {
        line1.appendChild(utils.el('span', { class: 'wtc-country' }, ' ' + rec.zh));
      }

      var line2 = utils.el('div', { class: 'wtc-topbar-line2' });
      var langName = (rec && rec.langZh) || (targetLang ? WTC.config.langName(targetLang) : '');
      var currency = (rec && rec.currency) || '';
      var tz = rec && rec.tz;
      var metaParts = [langName, currency].filter(Boolean);
      var timeText = tz ? utils.nowIn(tz) : '';
      line2.textContent = metaParts.join(' · ') + (timeText ? ' · ' + timeText : '');

      lines.appendChild(line1);
      lines.appendChild(line2);

      var seen = extractSeen(header);
      if (seen) {
        lines.appendChild(utils.el('div', { class: 'wtc-topbar-seen' }, '最后上线时间 ' + seen));
      }

      bar.appendChild(ic);
      bar.appendChild(lines);
      bar.addEventListener('click', openLang);

      header.parentNode && header.parentNode.insertBefore(bar, header.nextSibling);

      // 当地时间每秒刷新
      if (tz) {
        clockTimer = setInterval(function () {
          if (!bar || !bar.isConnected) { clearInterval(clockTimer); clockTimer = null; return; }
          var parts = [langName, currency].filter(Boolean);
          line2.textContent = parts.join(' · ') + ' · ' + utils.nowIn(tz);
        }, 1000);
      }
    }

    WTC.onDomChanged(utils.debounce(buildBar, 200));
    buildBar();
  });
})();



/* ---- modules/chatList.js ---- */
/* =====================================================================
 * WATransChat shared-core · modules/chatList.js
 * 1) 会话列表每项标题号码后追加中文国家名（.wtc-chatlist-country），只追加一次；
 * 2) 搜索框下方插入筛选标签（.wtc-chatlist-filter / .wtc-filter-chip）：
 *    所有 / 未读 / 特别关注 / 群组，点击做基础过滤。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.registerModule('chatList', function (ctx) {
    var utils = WTC.utils;
    var currentFilter = 'all';
    var chipsBuilt = false;

    /* ---------- 国家名追加 ---------- */
    function enrichItem(item) {
      if (item.getAttribute('data-wtc-cl-done')) return;
      var title = item.querySelector('span[title][dir="auto"]') ||
        item.querySelector('span[title]') ||
        item.querySelector('span[class*="ggj6brxd"] span');
      if (!title) return;
      var raw = (title.getAttribute('title') || title.textContent || '').trim();
      var phone = utils.normalizePhone(raw);
      if (!phone) return;
      item.setAttribute('data-wtc-cl-done', '1');

      if (WTC.countries && typeof WTC.countries.lookupByPhone === 'function') {
        var rec = WTC.countries.lookupByPhone(phone);
        if (rec && rec.zh && !item.querySelector('.wtc-chatlist-country')) {
          var tag = utils.el('span', { class: 'wtc-chatlist-country' }, ' ' + rec.zh);
          title.parentNode && title.parentNode.appendChild(tag);
        }
      }
    }

    /* ---------- 筛选 ---------- */
    function isUnread(item) {
      return !!(item.querySelector('[data-testid="icon-unread"], span[aria-label*="unread"], span[class*="unread"]') ||
        item.querySelector('span[style*="border-radius:50%"], span[style*="background-color: #25D366"]'));
    }
    function isGroup(item) {
      return !!(item.querySelector('[data-testid="icon-group"], [data-icon="group"], span[class*="group"]') ||
        /群组|group/i.test(item.textContent || ''));
    }
    function isStarred(item) {
      var title = item.querySelector('span[title][dir="auto"]') || item.querySelector('span[title]');
      var phone = title && utils.normalizePhone(title.getAttribute('title') || title.textContent || '');
      var chatId = phone ? phone.replace(/^\+/, '') + '@c.us' : '';
      var c = chatId && WTC.state.contacts[chatId];
      return !!(c && c.starred);
    }

    function applyFilter() {
      var items = utils.findAll('chatListItem');
      Array.prototype.forEach.call(items, function (item) {
        var show = true;
        if (currentFilter === 'unread') show = isUnread(item);
        else if (currentFilter === 'starred') show = isStarred(item);
        else if (currentFilter === 'group') show = isGroup(item);
        item.style.display = show ? '' : 'none';
      });
    }

    /* ---------- 筛选标签条 ---------- */
    function buildChips() {
      var pane = document.querySelector('#pane-side') || document.body;
      var searchRow = pane.querySelector('header') ||
        pane.querySelector('div[contenteditable="true"]') &&
        pane.querySelector('div[contenteditable="true"]').closest('div');
      if (!searchRow) return;

      var existing = pane.querySelector('.wtc-chatlist-filter');
      if (existing) return;

      var bar = utils.el('div', { class: 'wtc-chatlist-filter' });
      var defs = [
        { id: 'all', label: '所有' },
        { id: 'unread', label: '未读' },
        { id: 'starred', label: '特别关注' },
        { id: 'group', label: '群组' }
      ];
      defs.forEach(function (d) {
        var chip = utils.el('button', { class: 'wtc-filter-chip' + (currentFilter === d.id ? ' wtc-active' : '') }, d.label);
        chip.addEventListener('click', function () {
          currentFilter = d.id;
          bar.querySelectorAll('.wtc-filter-chip').forEach(function (c) { c.classList.remove('wtc-active'); });
          chip.classList.add('wtc-active');
          applyFilter();
        });
        bar.appendChild(chip);
      });

      // 插在搜索行之后
      if (searchRow.parentNode) searchRow.parentNode.insertBefore(bar, searchRow.nextSibling);
      chipsBuilt = true;
    }

    function scan() {
      buildChips();
      var items = utils.findAll('chatListItem');
      Array.prototype.forEach.call(items, enrichItem);
      if (chipsBuilt) applyFilter();
    }

    WTC.onDomChanged(utils.debounce(scan, 180));
    scan();
  });
})();



/* ---- modules/quickPhrase.js ---- */
/* =====================================================================
 * WATransChat shared-core · modules/quickPhrase.js
 * 输入框旁按钮打开侧滑面板（wtc-panel）管理 state.phrases：
 * 分组 + 中文内容，支持增/删/改，改动写回 state.phrases 并 WTC.save()；
 * 点某条把中文插入输入框，按 autoSend 逻辑翻译发送。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.registerModule('quickPhrase', function (ctx) {
    var utils = WTC.utils;
    var panel = null;
    var editingId = null;

    /* ---------- 面板 ---------- */
    function closePanel() {
      if (panel) { panel.parentNode && panel.parentNode.removeChild(panel); panel = null; }
    }

    function openPanel() {
      closePanel();
      panel = utils.el('div', { class: 'wtc-panel' });
      var head = utils.el('div', { class: 'wtc-panel-head' }, '快捷短语');
      var closeBtn = utils.el('button', { class: 'wtc-close' }, '×');
      closeBtn.addEventListener('click', closePanel);
      head.appendChild(closeBtn);
      var body = utils.el('div', { class: 'wtc-panel-body' });
      panel.appendChild(head);
      panel.appendChild(body);
      document.body.appendChild(panel);
      render(body);
    }

    function uid() { return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4); }

    function sendPhrase(zh) {
      if (typeof WTC.composeSend === 'function') {
        WTC.composeSend(zh);
      } else {
        var inp = utils.find('inputBox');
        if (inp) {
          try { document.execCommand && document.execCommand('insertText', false, zh); }
          catch (e) { inp.textContent = zh; }
        }
      }
      closePanel();
    }

    function render(body) {
      body.innerHTML = '';
      var phrases = WTC.state.phrases || [];

      // 列表
      phrases.forEach(function (p) {
        var item = utils.el('div', { class: 'wtc-list-item' });
        var top = utils.el('div', { class: 'wtc-li-top' });
        top.appendChild(utils.el('span', { class: 'wtc-li-group' }, p.group || '常用'));
        var text = utils.el('span', { class: 'wtc-li-text' }, p.zh);
        top.appendChild(text);
        var acts = utils.el('div', { class: 'wtc-li-act' });
        var edit = utils.el('button', { class: 'wtc-icon-btn' }, '改');
        var del = utils.el('button', { class: 'wtc-icon-btn' }, '删');
        edit.addEventListener('click', function () { startEdit(p, body); });
        del.addEventListener('click', function () {
          WTC.state.phrases = phrases.filter(function (x) { return x.id !== p.id; });
          WTC.save();
          render(body);
        });
        text.style.cursor = 'pointer';
        text.addEventListener('click', function () { sendPhrase(p.zh); });
        acts.appendChild(edit);
        acts.appendChild(del);
        top.appendChild(acts);
        item.appendChild(top);
        body.appendChild(item);
      });

      // 新增 / 编辑表单
      var gField = utils.el('div', { class: 'wtc-field' });
      gField.appendChild(utils.el('label', { class: 'wtc-label' }, '分组'));
      var gInput = utils.el('input', { class: 'wtc-input', placeholder: '如：欢迎 / 报价 / 售后' });
      gField.appendChild(gInput);

      var zField = utils.el('div', { class: 'wtc-field' });
      zField.appendChild(utils.el('label', { class: 'wtc-label' }, '中文内容'));
      var zInput = utils.el('textarea', { class: 'wtc-input', rows: '3', placeholder: '输入要发送的中文话术' });
      zField.appendChild(zInput);

      var saveBtn = utils.el('button', { class: 'wtc-btn wtc-btn-primary wtc-btn-block' }, editingId ? '保存修改' : '添加短语');
      saveBtn.addEventListener('click', function () {
        var g = gInput.value.trim() || '常用';
        var z = zInput.value.trim();
        if (!z) { WTC.toast('请输入短语内容'); return; }
        if (editingId) {
          WTC.state.phrases.forEach(function (x) {
            if (x.id === editingId) { x.group = g; x.zh = z; }
          });
          editingId = null;
        } else {
          WTC.state.phrases.push({ id: uid(), group: g, zh: z });
        }
        WTC.save();
        render(body);
      });

      body.appendChild(gField);
      body.appendChild(zField);
      body.appendChild(saveBtn);

      function startEdit(p, b) {
        editingId = p.id;
        gInput.value = p.group || '';
        zInput.value = p.zh || '';
        b.scrollTop = b.scrollHeight;
      }
    }

    /* ---------- 输入框旁按钮 ---------- */
    function mountButton() {
      var footer = utils.find('footer') || (utils.find('inputBox') && utils.find('inputBox').closest('footer'));
      if (!footer) return;
      var actions = footer.querySelector('.wtc-input-actions');
      if (!actions) {
        actions = utils.el('div', { class: 'wtc-input-actions' });
        footer.appendChild(actions);
      }
      if (actions.querySelector('.wtc-quickphrase')) return;
      var btn = utils.el('button', { class: 'wtc-ia-btn wtc-ghost wtc-quickphrase', title: '快捷短语' }, '语');
      btn.addEventListener('click', openPanel);
      actions.appendChild(btn);
    }

    WTC.onDomChanged(utils.debounce(mountButton, 200));
    mountButton();
  });
})();



/* ---- modules/quickChat.js ---- */
/* =====================================================================
 * WATransChat shared-core · modules/quickChat.js
 * 悬浮按钮（wtc-fab）+ 面板：输入带区号号码（+86/+1…），点「开始聊天」
 * 打开 web.whatsapp.com/send?phone=<纯数字>&text=<可选译文>（或 wa.me），
 * 不写入通讯录。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.registerModule('quickChat', function (ctx) {
    var utils = WTC.utils;
    var panel = null;

    function closePanel() {
      if (panel) { panel.parentNode && panel.parentNode.removeChild(panel); panel = null; }
    }

    function openPanel() {
      closePanel();
      panel = utils.el('div', { class: 'wtc-panel' });
      var head = utils.el('div', { class: 'wtc-panel-head' }, '快速聊天');
      var closeBtn = utils.el('button', { class: 'wtc-close' }, '×');
      closeBtn.addEventListener('click', closePanel);
      head.appendChild(closeBtn);

      var body = utils.el('div', { class: 'wtc-panel-body' });

      var phoneField = utils.el('div', { class: 'wtc-field' });
      phoneField.appendChild(utils.el('label', { class: 'wtc-label' }, '对方号码（带区号，如 +86 13800138000 / +1 5551234567）'));
      var phoneInput = utils.el('input', { class: 'wtc-input', placeholder: '+86 13800138000' });
      phoneField.appendChild(phoneInput);

      var msgField = utils.el('div', { class: 'wtc-field' });
      msgField.appendChild(utils.el('label', { class: 'wtc-label' }, '开场白（可选，中文将按当前引擎翻译）'));
      var msgInput = utils.el('textarea', { class: 'wtc-input', rows: '3', placeholder: '您好，我是……' });
      msgField.appendChild(msgInput);

      var goBtn = utils.el('button', { class: 'wtc-btn wtc-btn-primary wtc-btn-block' }, '开始聊天');
      goBtn.addEventListener('click', function () {
        var raw = phoneInput.value.trim();
        var digits = raw.replace(/[^\d]/g, '');
        if (!digits) { WTC.toast('请输入对方号码'); return; }
        var msg = msgInput.value.trim();
        var open = function (text) {
          var url = 'https://web.whatsapp.com/send?phone=' + digits +
            (text ? '&text=' + encodeURIComponent(text) : '');
          root.open(url, '_blank');
          closePanel();
        };
        if (msg) {
          WTC.translator.translate(msg, WTC.state.myLanguage, 'en')
            .then(open)
            .catch(function () { open(msg); });
        } else {
          open('');
        }
      });

      body.appendChild(phoneField);
      body.appendChild(msgField);
      body.appendChild(goBtn);
      panel.appendChild(head);
      panel.appendChild(body);
      document.body.appendChild(panel);
    }

    /* ---------- 悬浮按钮 ---------- */
    function mountFab() {
      var stack = document.querySelector('.wtc-fab-stack');
      if (!stack) {
        stack = utils.el('div', { class: 'wtc-fab-stack' });
        document.body.appendChild(stack);
      }
      if (stack.querySelector('.wtc-quickchat-fab')) return;
      var fab = utils.el('button', { class: 'wtc-fab wtc-quickchat-fab', title: '快速聊天' }, '📞');
      fab.addEventListener('click', openPanel);
      stack.appendChild(fab);
    }

    mountFab();
  });
})();



/* ---- modules/todo.js ---- */
/* =====================================================================
 * WATransChat shared-core · modules/todo.js
 * 面板管理 state.todos（按当前联系人新增：时间 + 内容，wtc-list-item，
 * 可完成/删除）；到点提醒：扩展环境用 chrome.alarms + chrome.notifications，
 * 无 chrome 时用 setTimeout + 页面内 toast 兜底；保存即 WTC.save()。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.registerModule('todo', function (ctx) {
    var utils = WTC.utils;
    var panel = null;
    var timers = {};

    function hasChrome() { return !!(root.chrome && root.chrome.alarms); }

    function closePanel() {
      if (panel) { panel.parentNode && panel.parentNode.removeChild(panel); panel = null; }
    }

    function currentChatId() {
      return (WTC.currentChat && WTC.currentChat.chatId) || '';
    }

    /* 为单条待办安排提醒 */
    function scheduleTodo(t) {
      if (!t || t.done || t.notified) return;
      var delay = Number(t.time) - Date.now();
      if (isNaN(delay) || delay < 0) return;

      // 扩展环境：注册 alarm（由 background 弹通知）
      if (hasChrome()) {
        try {
          root.chrome.alarms.create('wtc-todo-' + t.id, { when: Number(t.time) });
        } catch (e) {}
      }
      // 兜底：页面内 setTimeout + toast
      if (timers[t.id]) clearTimeout(timers[t.id]);
      timers[t.id] = setTimeout(function () {
        t.notified = true;
        WTC.save();
        WTC.toast('待办提醒：' + t.text, 4000);
      }, delay);
    }

    function rescheduleAll() {
      Object.keys(timers).forEach(function (k) { clearTimeout(timers[k]); timers[k] = null; });
      (WTC.state.todos || []).forEach(scheduleTodo);
    }

    function openPanel() {
      closePanel();
      panel = utils.el('div', { class: 'wtc-panel' });
      var head = utils.el('div', { class: 'wtc-panel-head' }, '待办提醒');
      var closeBtn = utils.el('button', { class: 'wtc-close' }, '×');
      closeBtn.addEventListener('click', closePanel);
      head.appendChild(closeBtn);

      var body = utils.el('div', { class: 'wtc-panel-body' });
      panel.appendChild(head);
      panel.appendChild(body);
      document.body.appendChild(panel);
      render(body);
    }

    function fmt(ts) {
      var d = new Date(Number(ts));
      var p = function (n) { return ('0' + n).slice(-2); };
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
        ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    }

    function render(body) {
      body.innerHTML = '';
      var cid = currentChatId();
      var list = (WTC.state.todos || []).filter(function (t) { return !cid || t.chatId === cid; });

      list.forEach(function (t) {
        var item = utils.el('div', { class: 'wtc-list-item' + (t.done ? ' wtc-done' : '') });
        var top = utils.el('div', { class: 'wtc-li-top' });
        var text = utils.el('span', { class: 'wtc-li-text' }, (t.phone ? t.phone + ' · ' : '') + t.text);
        var time = utils.el('div', { class: 'wtc-hint' }, fmt(t.time));
        top.appendChild(text);
        var acts = utils.el('div', { class: 'wtc-li-act' });
        var doneBtn = utils.el('button', { class: 'wtc-icon-btn' }, t.done ? '已完成' : '完成');
        var delBtn = utils.el('button', { class: 'wtc-icon-btn' }, '删');
        doneBtn.addEventListener('click', function () {
          t.done = !t.done;
          WTC.save();
          render(body);
        });
        delBtn.addEventListener('click', function () {
          WTC.state.todos = (WTC.state.todos || []).filter(function (x) { return x.id !== t.id; });
          WTC.save();
          render(body);
        });
        acts.appendChild(doneBtn);
        acts.appendChild(delBtn);
        top.appendChild(acts);
        item.appendChild(top);
        item.appendChild(time);
        body.appendChild(item);
      });

      if (!list.length) body.appendChild(utils.el('div', { class: 'wtc-hint' }, '暂无待办，在下方添加。'));

      // 表单
      var timeField = utils.el('div', { class: 'wtc-field' });
      timeField.appendChild(utils.el('label', { class: 'wtc-label' }, '提醒时间'));
      var timeInput = utils.el('input', { class: 'wtc-input', type: 'datetime-local' });
      timeField.appendChild(timeInput);

      var textField = utils.el('div', { class: 'wtc-field' });
      textField.appendChild(utils.el('label', { class: 'wtc-label' }, '待办内容'));
      var textInput = utils.el('input', { class: 'wtc-input', placeholder: '如：跟进客户报价单' });
      textField.appendChild(textInput);

      var addBtn = utils.el('button', { class: 'wtc-btn wtc-btn-primary wtc-btn-block' }, '添加待办');
      addBtn.addEventListener('click', function () {
        if (!timeInput.value) { WTC.toast('请选择提醒时间'); return; }
        var val = textInput.value.trim();
        if (!val) { WTC.toast('请输入待办内容'); return; }
        var ts = new Date(timeInput.value).getTime();
        var todo = {
          id: 't' + Date.now().toString(36),
          chatId: cid,
          phone: (WTC.currentChat && WTC.currentChat.phone) || '',
          text: val,
          time: ts,
          done: false,
          notified: false
        };
        WTC.state.todos = WTC.state.todos || [];
        WTC.state.todos.push(todo);
        WTC.save();
        scheduleTodo(todo);
        render(body);
      });

      body.appendChild(timeField);
      body.appendChild(textField);
      body.appendChild(addBtn);
    }

    /* ---------- 输入框旁入口按钮 ---------- */
    function mountButton() {
      var footer = utils.find('footer') || (utils.find('inputBox') && utils.find('inputBox').closest('footer'));
      if (!footer) return;
      var actions = footer.querySelector('.wtc-input-actions');
      if (!actions) {
        actions = utils.el('div', { class: 'wtc-input-actions' });
        footer.appendChild(actions);
      }
      if (actions.querySelector('.wtc-todo-btn')) return;
      var btn = utils.el('button', { class: 'wtc-ia-btn wtc-ghost wtc-todo-btn', title: '待办提醒' }, '✓');
      btn.addEventListener('click', openPanel);
      actions.appendChild(btn);
    }

    WTC.onDomChanged(utils.debounce(mountButton, 200));
    mountButton();
    rescheduleAll();
  });
})();



/* ---- modules/aiStaff.js ---- */
/* =====================================================================
 * WATransChat shared-core · modules/aiStaff.js
 * AI 员工 / 自动回复完整 UI（wtc-panel）：
 * 总开关、定时启用（开始/结束时间）、按联系人自动回复开关与列表、话术模板编辑；
 * API 调用位置预留清晰 TODO（state.engines.ai 的 baseUrl/apiKey/model），
 * 当前用本地规则 / 占位实现；标注「尊享版」入口；保存到 state.aiStaff。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.registerModule('aiStaff', function (ctx) {
    var utils = WTC.utils;
    var panel = null;

    function ai() { return WTC.state.aiStaff = WTC.state.aiStaff || {
      enabled: false, scheduleEnabled: false, start: '09:00', end: '18:00',
      autoReply: false, template: '', contacts: {}
    }; }

    function persist() { WTC.save(); }

    function closePanel() {
      if (panel) { panel.parentNode && panel.parentNode.removeChild(panel); panel = null; }
    }

    /* 本地规则：当前是否处于启用/定时窗口内（占位判定，未真正发信） */
    function inSchedule() {
      var a = ai();
      if (!a.scheduleEnabled) return true;
      var now = new Date();
      var cur = now.getHours() * 60 + now.getMinutes();
      var s = a.start.split(':').map(Number), e = a.end.split(':').map(Number);
      var sm = s[0] * 60 + s[1], em = e[0] * 60 + e[1];
      return sm <= em ? (cur >= sm && cur <= em) : (cur >= sm || cur <= em);
    }
    function shouldReply(chatId) {
      var a = ai();
      return !!(a.enabled && a.autoReply && inSchedule() &&
        (a.contacts && a.contacts[chatId]));
    }
    WTC.aiStaff = { shouldReply: shouldReply, inSchedule: inSchedule };

    /* ===================== TODO: 接入 AI API（尊享版） =====================
     * 当 state.engines.ai.baseUrl / apiKey / model 配置完成后，在此调用：
     *   var cfg = WTC.state.engines.ai;
     *   WTC.net.http(cfg.baseUrl + '/chat/completions', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json',
     *                'Authorization': 'Bearer ' + cfg.apiKey },
     *     body: JSON.stringify({ model: cfg.model, messages: [...] })
     *   }).then(...)
     * 当前为本地规则 / 占位实现，不发起网络请求。
     * ====================================================================== */

    function makeSwitch(checked, onChange) {
      var lab = utils.el('label', { class: 'wtc-switch' });
      var input = utils.el('input', { type: 'checkbox' });
      input.checked = !!checked;
      var slider = utils.el('span', { class: 'wtc-slider' });
      input.addEventListener('change', function () { onChange(input.checked); });
      lab.appendChild(input);
      lab.appendChild(slider);
      return lab;
    }

    function row(label, hint, control) {
      var r = utils.el('div', { class: 'wtc-member-row' });
      var left = utils.el('div');
      left.appendChild(utils.el('div', { class: 'wtc-mr-label' }, label));
      if (hint) left.appendChild(utils.el('div', { class: 'wtc-hint' }, hint));
      r.appendChild(left);
      r.appendChild(control);
      return r;
    }

    function openPanel() {
      closePanel();
      var a = ai();
      panel = utils.el('div', { class: 'wtc-panel' });
      var head = utils.el('div', { class: 'wtc-panel-head' }, 'AI 员工 · 尊享版');
      var closeBtn = utils.el('button', { class: 'wtc-close' }, '×');
      closeBtn.addEventListener('click', closePanel);
      head.appendChild(closeBtn);

      var body = utils.el('div', { class: 'wtc-panel-body' });

      // 总开关
      body.appendChild(row('AI 员工总开关', '开启后可按规则自动回复',
        makeSwitch(a.enabled, function (v) { a.enabled = v; persist(); })));

      // 定时启用
      body.appendChild(row('定时启用', '仅在开始~结束时间内自动回复',
        makeSwitch(a.scheduleEnabled, function (v) { a.scheduleEnabled = v; persist(); })));
      var timeField = utils.el('div', { class: 'wtc-field' });
      timeField.appendChild(utils.el('label', { class: 'wtc-label' }, '启用时间段'));
      var timeRow = utils.el('div', { style: 'display:flex;gap:8px;' });
      var startIn = utils.el('input', { class: 'wtc-input', type: 'time', value: a.start });
      var endIn = utils.el('input', { class: 'wtc-input', type: 'time', value: a.end });
      startIn.addEventListener('change', function () { a.start = startIn.value || '09:00'; persist(); });
      endIn.addEventListener('change', function () { a.end = endIn.value || '18:00'; persist(); });
      timeRow.appendChild(startIn);
      timeRow.appendChild(endIn);
      timeField.appendChild(timeRow);
      body.appendChild(timeField);

      // 自动回复
      body.appendChild(row('自动回复', '收到客户消息后按话术模板回复',
        makeSwitch(a.autoReply, function (v) { a.autoReply = v; persist(); })));

      // 当前联系人开关
      var cid = (WTC.currentChat && WTC.currentChat.chatId) || '';
      body.appendChild(row('当前联系人自动回复', cid || '未识别到联系人',
        makeSwitch(!!(a.contacts && a.contacts[cid]), function (v) {
          a.contacts = a.contacts || {};
          a.contacts[cid] = v;
          persist();
        })));

      // 话术模板
      var tField = utils.el('div', { class: 'wtc-field' });
      tField.appendChild(utils.el('label', { class: 'wtc-label' }, '话术模板'));
      var tInput = utils.el('textarea', { class: 'wtc-input', rows: '3', placeholder: '自动回复话术' }, a.template);
      tInput.addEventListener('input', function () { a.template = tInput.value; persist(); });
      tField.appendChild(tInput);
      body.appendChild(tField);

      // 尊享版 / API 配置占位
      var pro = utils.el('div', { class: 'wtc-list-item' });
      pro.appendChild(utils.el('div', { class: 'wtc-li-group' }, '尊享版'));
      pro.appendChild(utils.el('div', { class: 'wtc-li-text', style: 'margin-top:6px;' },
        '接入自定义大模型（baseUrl / apiKey / model）后可实现 AI 上下文精确回复；当前为本地占位规则。'));
      body.appendChild(pro);

      panel.appendChild(head);
      panel.appendChild(body);
      document.body.appendChild(panel);
    }

    /* ---------- 入口按钮 ---------- */
    function mountButton() {
      var footer = utils.find('footer') || (utils.find('inputBox') && utils.find('inputBox').closest('footer'));
      if (!footer) return;
      var actions = footer.querySelector('.wtc-input-actions');
      if (!actions) {
        actions = utils.el('div', { class: 'wtc-input-actions' });
        footer.appendChild(actions);
      }
      if (actions.querySelector('.wtc-aistaff-btn')) return;
      var btn = utils.el('button', { class: 'wtc-ia-btn wtc-ghost wtc-aistaff-btn', title: 'AI 员工（尊享版）' }, '🤖');
      btn.addEventListener('click', openPanel);
      actions.appendChild(btn);
    }

    WTC.onDomChanged(utils.debounce(mountButton, 200));
    mountButton();
  });
})();



/* ---- modules/settingsPanel.js ---- */
/* =====================================================================
 * WATransChat shared-core · modules/settingsPanel.js
 * - openLang()：客户语言设置弹窗（目标语言 / 翻译引擎 / 不再提醒，保存到
 *   state.contacts[chatId]）；
 * - openSettings()：页面内「翻译设置」面板（您的语言、全局引擎、译文颜色
 *   圆点+调色板、自动发送、DOM 检查、译文位置、分屏、引擎 key、短语/待办
 *   入口、导入导出）；
 * - openMember()：会员/账户信息页；
 * - 网页 DOM 检查：state.domInspector 为真时右下角「DOM 检查」按钮，
 *   悬停高亮并显示元素 outerHTML 截断提示。
 * 暴露 openLang / openSettings / openMember 供其它模块与 popup 调用。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.registerModule('settingsPanel', function (ctx) {
    var utils = WTC.utils;

    /* ---------- 通用弹层 ---------- */
    function closeAll() {
      document.querySelectorAll('.wtc-overlay, .wtc-panel').forEach(function (n) {
        n.parentNode && n.parentNode.removeChild(n);
      });
    }

    function openCard(title) {
      closeAll();
      var overlay = utils.el('div', { class: 'wtc-overlay' });
      var card = utils.el('div', { class: 'wtc-card' });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) closeAll(); });
      card.appendChild(utils.el('h3', { class: 'wtc-card-title' }, title));
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      return card;
    }

    function openSidePanel(title) {
      closeAll();
      var panel = utils.el('div', { class: 'wtc-panel' });
      var head = utils.el('div', { class: 'wtc-panel-head' }, title);
      var closeBtn = utils.el('button', { class: 'wtc-close' }, '×');
      closeBtn.addEventListener('click', closeAll);
      head.appendChild(closeBtn);
      var body = utils.el('div', { class: 'wtc-panel-body' });
      panel.appendChild(head);
      panel.appendChild(body);
      document.body.appendChild(panel);
      return body;
    }

    function makeSwitch(checked, onChange) {
      var lab = utils.el('label', { class: 'wtc-switch' });
      var input = utils.el('input', { type: 'checkbox' });
      input.checked = !!checked;
      var slider = utils.el('span', { class: 'wtc-slider' });
      input.addEventListener('change', function () { onChange(input.checked); });
      lab.appendChild(input);
      lab.appendChild(slider);
      return lab;
    }

    function settingRow(label, hint, control) {
      var r = utils.el('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:13px 0;border-bottom:1px solid var(--wtc-line);' });
      var left = utils.el('div');
      left.appendChild(utils.el('div', { class: 'wtc-mr-label', style: 'font-size:14px;color:var(--wtc-ink);' }, label));
      if (hint) left.appendChild(utils.el('div', { class: 'wtc-hint' }, hint));
      r.appendChild(left);
      r.appendChild(control);
      return r;
    }

    /* ============================ openLang ============================ */
    function openLang(chatId) {
      chatId = chatId || (WTC.currentChat && WTC.currentChat.chatId) || '';
      var phone = (WTC.currentChat && WTC.currentChat.phone) || utils.headerText();
      var saved = chatId && WTC.state.contacts[chatId];

      var card = openCard('客户语言设置' + (phone ? ' (' + phone + ')' : ''));

      // 目标语言
      var lField = utils.el('div', { class: 'wtc-field' });
      lField.appendChild(utils.el('label', { class: 'wtc-label' }, '目标语言:'));
      var langSel = utils.el('select', { class: 'wtc-select' });
      WTC.config.LANGUAGES.forEach(function (l) {
        var opt = utils.el('option', { value: l.code }, l.name + ' (' + l.native + ')');
        langSel.appendChild(opt);
      });
      langSel.value = (saved && saved.targetLang) || (WTC.currentChat && WTC.currentChat.targetLang) || 'en';
      lField.appendChild(langSel);

      // 翻译引擎
      var eField = utils.el('div', { class: 'wtc-field' });
      eField.appendChild(utils.el('label', { class: 'wtc-label' }, '翻译引擎:'));
      var engSel = utils.el('select', { class: 'wtc-select' });
      WTC.config.SCHEMA.engines.forEach(function (e) {
        engSel.appendChild(utils.el('option', { value: e.id }, e.name));
      });
      engSel.value = (saved && saved.engine) || WTC.state.engine;
      eField.appendChild(engSel);

      // 不再提醒
      var rememberLab = utils.el('label', { style: 'display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:14px;cursor:pointer;' });
      var remember = utils.el('input', { type: 'checkbox' });
      remember.checked = !!(saved && saved.remember);
      rememberLab.appendChild(remember);
      rememberLab.appendChild(document.createTextNode('该客户今后都用此配置，不再提醒'));

      var actions = utils.el('div', { class: 'wtc-card-actions' });
      var saveBtn = utils.el('button', { class: 'wtc-btn wtc-btn-primary' }, '保存');
      var cancelBtn = utils.el('button', { class: 'wtc-btn wtc-btn-ghost' }, '取消');
      cancelBtn.addEventListener('click', closeAll);
      saveBtn.addEventListener('click', function () {
        WTC.state.contacts = WTC.state.contacts || {};
        WTC.state.contacts[chatId] = Object.assign({}, WTC.state.contacts[chatId], {
          targetLang: langSel.value,
          engine: engSel.value,
          remember: remember.checked
        });
        if (WTC.currentChat) {
          WTC.currentChat.targetLang = langSel.value;
          WTC.currentChat.chatId = chatId;
        }
        WTC.save();
        WTC.toast('客户语言已保存');
        closeAll();
      });
      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);

      card.appendChild(lField);
      card.appendChild(eField);
      card.appendChild(rememberLab);
      card.appendChild(actions);
    }

    /* ========================= openSettings ========================= */
    function openSettings() {
      var st = WTC.state;
      var body = openSidePanel('翻译设置');

      body.appendChild(utils.el('div', { class: 'wtc-label', style: 'margin:4px 0 10px;' }, '译文设置'));

      // 您的语言
      var myField = utils.el('div', { class: 'wtc-field' });
      myField.appendChild(utils.el('label', { class: 'wtc-label' }, '您的语言'));
      myField.appendChild(utils.el('div', { class: 'wtc-hint' }, '设置您的语言，用于翻译接口的源语言和接收消息的目标语言'));
      var mySel = utils.el('select', { class: 'wtc-select' });
      WTC.config.LANGUAGES.forEach(function (l) { mySel.appendChild(utils.el('option', { value: l.code }, l.name)); });
      mySel.value = st.myLanguage;
      mySel.addEventListener('change', function () { st.myLanguage = mySel.value; WTC.save(); });
      myField.appendChild(mySel);
      body.appendChild(myField);

      // 全局翻译引擎
      var engField = utils.el('div', { class: 'wtc-field' });
      engField.appendChild(utils.el('label', { class: 'wtc-label' }, '全局翻译引擎'));
      engField.appendChild(utils.el('div', { class: 'wtc-hint' }, '设置默认翻译引擎，所有客户将使用此引擎，除非单独设置'));
      var engSel = utils.el('select', { class: 'wtc-select' });
      WTC.config.SCHEMA.engines.forEach(function (e) { engSel.appendChild(utils.el('option', { value: e.id }, e.name)); });
      engSel.value = st.engine;
      engSel.addEventListener('change', function () { st.engine = engSel.value; WTC.save(); });
      engField.appendChild(engSel);
      body.appendChild(engField);

      // 译文颜色（圆点 + 调色板）
      var colorRow = settingRow('译文颜色', '设置聊天中译文的显示颜色',
        utils.el('div', { style: 'width:26px;height:26px;border-radius:50%;background:' + st.translateColor + ';cursor:pointer;', id: 'wtc-color-dot' }));
      colorRow.querySelector('#wtc-color-dot').addEventListener('click', openPalette);
      body.appendChild(colorRow);

      // 自动发送译文
      body.appendChild(settingRow('自动发送译文', '开启后按回车或点发送按钮，将自动翻译并发送译文',
        makeSwitch(st.autoSend, function (v) { st.autoSend = v; WTC.save(); })));

      // 网页 DOM 检查
      body.appendChild(settingRow('网页 DOM 检查', '开启后聊天网页右下角显示「DOM 检查」按钮，可悬停查看元素 HTML。默认关闭。',
        makeSwitch(st.domInspector, function (v) {
          st.domInspector = v; WTC.save(); syncInspector();
        })));

      // 译文位置
      var posField = utils.el('div', { class: 'wtc-field' });
      posField.appendChild(utils.el('label', { class: 'wtc-label' }, '译文位置'));
      var posSel = utils.el('select', { class: 'wtc-select' });
      WTC.config.SCHEMA.positions.forEach(function (p) { posSel.appendChild(utils.el('option', { value: p.id }, p.name)); });
      posSel.value = st.translatePosition;
      posSel.addEventListener('change', function () { st.translatePosition = posSel.value; WTC.save(); });
      posField.appendChild(posSel);
      body.appendChild(posField);

      // 分屏翻译
      body.appendChild(settingRow('分屏翻译', '原文与译文分屏对照显示',
        makeSwitch(st.splitScreen, function (v) { st.splitScreen = v; WTC.save(); })));

      // 引擎 key 配置
      body.appendChild(utils.el('div', { class: 'wtc-label', style: 'margin:16px 0 8px;' }, '引擎密钥配置'));
      var v = st.engines.volcano, d = st.engines.deepl, ai = st.engines.ai;

      function keyInput(label, val, oninput, type) {
        var f = utils.el('div', { class: 'wtc-field' });
        f.appendChild(utils.el('label', { class: 'wtc-label' }, label));
        var inp = utils.el('input', { class: 'wtc-input', type: type || 'text', placeholder: label }, val || '');
        inp.addEventListener('change', function () { oninput(inp.value); WTC.save(); });
        f.appendChild(inp);
        return f;
      }
      body.appendChild(keyInput('火山 AccessKeyId', v.accessKeyId, function (x) { v.accessKeyId = x; }));
      body.appendChild(keyInput('火山 SecretAccessKey', v.secretAccessKey, function (x) { v.secretAccessKey = x; }, 'password'));
      body.appendChild(keyInput('火山 region', v.region, function (x) { v.region = x; }));
      body.appendChild(keyInput('DeepL API Key', d.apiKey, function (x) { d.apiKey = x; }, 'password'));
      var freeLab = utils.el('label', { style: 'display:flex;gap:8px;font-size:13px;margin-bottom:10px;' });
      var freeChk = utils.el('input', { type: 'checkbox' });
      freeChk.checked = d.free !== false;
      freeChk.addEventListener('change', function () { d.free = freeChk.checked; WTC.save(); });
      freeLab.appendChild(freeChk);
      freeLab.appendChild(document.createTextNode('DeepL Free 端点'));
      body.appendChild(freeLab);
      body.appendChild(keyInput('AI baseUrl', ai.baseUrl, function (x) { ai.baseUrl = x; }));
      body.appendChild(keyInput('AI apiKey', ai.apiKey, function (x) { ai.apiKey = x; }, 'password'));
      body.appendChild(keyInput('AI model', ai.model, function (x) { ai.model = x; }));

      // 短语 / 待办入口
      var entryRow = utils.el('div', { style: 'display:flex;gap:10px;margin:14px 0;' });
      var phraseBtn = utils.el('button', { class: 'wtc-btn wtc-btn-ghost wtc-btn-block' }, '快捷短语管理');
      phraseBtn.addEventListener('click', function () {
        var b = document.querySelector('.wtc-quickphrase');
        if (b) b.click(); else WTC.toast('请在聊天窗口使用快捷短语按钮');
      });
      var todoBtn = utils.el('button', { class: 'wtc-btn wtc-btn-ghost wtc-btn-block' }, '待办管理');
      todoBtn.addEventListener('click', function () {
        var b = document.querySelector('.wtc-todo-btn');
        if (b) b.click(); else WTC.toast('请在聊天窗口使用待办按钮');
      });
      entryRow.appendChild(phraseBtn);
      entryRow.appendChild(todoBtn);
      body.appendChild(entryRow);

      // 导入 / 导出
      var ioRow = utils.el('div', { style: 'display:flex;gap:10px;margin-bottom:16px;' });
      var exportBtn = utils.el('button', { class: 'wtc-btn wtc-btn-primary wtc-btn-block' }, '导出配置');
      exportBtn.addEventListener('click', exportConfig);
      var importBtn = utils.el('button', { class: 'wtc-btn wtc-btn-ghost wtc-btn-block' }, '导入配置');
      var fileInput = utils.el('input', { type: 'file', accept: 'application/json', style: 'display:none;' });
      importBtn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () { importConfig(fileInput); });
      ioRow.appendChild(exportBtn);
      ioRow.appendChild(importBtn);
      body.appendChild(ioRow);
      body.appendChild(fileInput);
    }

    /* 调色板 */
    function openPalette() {
      var card = openCard('选择译文颜色');
      var preview = utils.el('div', { class: 'wtc-color-preview', style: 'background:' + WTC.state.translateColor });
      card.appendChild(preview);
      var palette = utils.el('div', { class: 'wtc-palette' });
      WTC.config.SCHEMA.colors.forEach(function (c) {
        var sw = utils.el('button', { class: 'wtc-swatch' + (c === WTC.state.translateColor ? ' wtc-sel' : ''), style: 'background:' + c });
        sw.addEventListener('click', function () {
          WTC.state.translateColor = c;
          WTC.save();
          WTC.applyVisual && WTC.applyVisual();
          preview.style.background = c;
          WTC.toast('译文颜色已更新');
        });
        palette.appendChild(sw);
      });
      card.appendChild(palette);
      var actions = utils.el('div', { class: 'wtc-card-actions' });
      var cancel = utils.el('button', { class: 'wtc-btn wtc-btn-ghost' }, '取消');
      cancel.addEventListener('click', closeAll);
      actions.appendChild(cancel);
      card.appendChild(actions);
    }

    function exportConfig() {
      var blob = new Blob([JSON.stringify(WTC.state, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = utils.el('a', { href: url, download: 'wtc_config.json' });
      document.body.appendChild(a);
      a.click();
      a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function importConfig(fileInput) {
      var f = fileInput.files && fileInput.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          WTC.state = WTC.config.deepMerge(WTC.config.DEFAULTS, parsed);
          WTC.save();
          WTC.applyVisual && WTC.applyVisual();
          WTC.toast('配置已导入');
        } catch (e) { WTC.toast('配置文件无效'); }
      };
      reader.readAsText(f);
    }

    /* ========================= openMember ========================= */
    function openMember() {
      var m = WTC.state.member || {};
      var body = openSidePanel('会员信息');

      var head = utils.el('div', { class: 'wtc-member-head' });
      head.appendChild(utils.el('div', { class: 'wtc-avatar' }, (m.name || '用').slice(0, 1)));
      var info = utils.el('div');
      info.appendChild(utils.el('div', { style: 'font-weight:700;font-size:16px;' }, m.name || 'WATransChat 用户'));
      info.appendChild(utils.el('span', { class: 'wtc-plan-badge' }, m.plan || '基础版'));
      head.appendChild(info);
      body.appendChild(head);

      function mRow(label, val, onClick) {
        var r = utils.el('div', { class: 'wtc-member-row' });
        r.appendChild(utils.el('span', { class: 'wtc-mr-label' }, label));
        var v = utils.el('span', { class: 'wtc-mr-val' }, val || '—');
        r.appendChild(v);
        if (onClick) r.addEventListener('click', onClick);
        body.appendChild(r);
      }
      mRow('账户信息', m.email || '未登录');
      mRow('套餐类型', m.plan || '基础版');
      mRow('到期日期', m.expire || '长期有效');
      mRow('翻译设置', '', openSettings);
      mRow('设备管理', (m.devices || 1) + ' 台设备');
      mRow('订阅计划', '查看套餐');
      mRow('退出登录', '', function () {
        WTC.state.member = Object.assign({}, m, { loggedIn: false });
        WTC.save();
        WTC.toast('已退出登录');
        openMember();
      });
    }

    /* ======================== DOM 检查 ======================== */
    var inspectorFab = null;
    var inspectorOn = false;
    var hlEl = null;
    var tipEl = null;

    function syncInspector() {
      if (WTC.state.domInspector) {
        if (!inspectorFab) {
          inspectorFab = utils.el('button', { class: 'wtc-fab wtc-dom', title: 'DOM 检查' }, '🔍');
          inspectorFab.addEventListener('click', toggleInspector);
          document.body.appendChild(inspectorFab);
        }
        inspectorFab.style.display = '';
      } else if (inspectorFab) {
        inspectorFab.style.display = 'none';
        stopInspector();
      }
    }

    function toggleInspector() {
      inspectorOn = !inspectorOn;
      if (!inspectorOn) stopInspector();
    }
    function stopInspector() {
      inspectorOn = false;
      if (hlEl) { hlEl.classList.remove('wtc-dom-highlight'); hlEl = null; }
      if (tipEl) { tipEl.parentNode && tipEl.parentNode.removeChild(tipEl); tipEl = null; }
    }

    document.addEventListener('mousemove', function (e) {
      if (!inspectorOn) return;
      var t = e.target;
      if (!t || !t.closest || t.closest('.wtc-root, .wtc-panel, .wtc-overlay, .wtc-fab')) return;
      if (hlEl && hlEl !== t) hlEl.classList.remove('wtc-dom-highlight');
      hlEl = t;
      t.classList.add('wtc-dom-highlight');
      if (!tipEl) tipEl = utils.el('div', { class: 'wtc-dom-tip' });
      var html = (t.outerHTML || '').slice(0, 300);
      tipEl.textContent = html;
      tipEl.style.left = Math.min(e.clientX + 14, window.innerWidth - 370) + 'px';
      tipEl.style.top = (e.clientY + 14) + 'px';
      if (!tipEl.parentNode) document.body.appendChild(tipEl);
    }, true);

    /* ---------- 暴露（合并进已注册的模块对象，保留 init） ---------- */
    WTC.modules.settingsPanel.openLang = openLang;
    WTC.modules.settingsPanel.openSettings = openSettings;
    WTC.modules.settingsPanel.openMember = openMember;
    WTC.openLang = openLang;
    WTC.openSettings = openSettings;
    WTC.openMember = openMember;

    syncInspector();
    document.addEventListener('wtc:config-changed', syncInspector);
  });
})();



/* ---- inject.js ---- */
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


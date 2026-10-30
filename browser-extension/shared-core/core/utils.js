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

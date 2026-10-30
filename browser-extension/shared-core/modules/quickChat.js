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

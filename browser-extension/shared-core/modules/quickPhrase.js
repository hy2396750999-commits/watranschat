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

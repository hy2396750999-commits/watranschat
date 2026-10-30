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

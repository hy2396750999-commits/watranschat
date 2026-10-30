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

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

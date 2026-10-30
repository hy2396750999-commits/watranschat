/* =====================================================================
 * WATransChat · options/options.js
 * 翻译设置页：读取 WTC.storage.loadState()，改动后 saveState() 持久化。
 * 引擎密钥 / 快捷短语 / 待办 / 导入导出均在本页本地完成读写。
 * ===================================================================== */
(function () {
  'use strict';

  var state = null;
  var $ = function (id) { return document.getElementById(id); };
  var hasChrome = !!(window.chrome && window.chrome.runtime);

  /* ---------- 存储 ---------- */
  function load() {
    if (window.WTC && WTC.storage && WTC.storage.loadState) {
      return WTC.storage.loadState();
    }
    return new Promise(function (resolve) {
      if (hasChrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get('wtc_config_v1', function (res) {
          resolve(res && res['wtc_config_v1'] ? res['wtc_config_v1'] : {});
        });
      } else {
        resolve({});
      }
    });
  }

  function persist() {
    if (window.WTC && WTC.storage && WTC.storage.saveState) {
      return WTC.storage.saveState(state);
    }
    return new Promise(function (resolve) {
      if (hasChrome && chrome.storage && chrome.storage.local) {
        var o = {}; o['wtc_config_v1'] = state;
        chrome.storage.local.set(o, resolve);
      } else { resolve(); }
    });
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('opToast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 1800);
  }

  /* ---------- 下拉：语言 / 引擎 ---------- */
  function fillSelect(el, items, value, labelKey) {
    el.innerHTML = '';
    items.forEach(function (it) {
      var opt = document.createElement('option');
      opt.value = it.code != null ? it.code : it.id;
      opt.textContent = it.name + (it.native ? '（' + it.native + '）' : '');
      el.appendChild(opt);
    });
    el.value = value;
  }

  function bindBasics() {
    var langSel = $('selMyLang');
    fillSelect(langSel, WTC.config.LANGUAGES, state.myLanguage || 'zh-CN');
    langSel.addEventListener('change', function () {
      state.myLanguage = langSel.value;
      persist();
    });

    var engSel = $('selEngine');
    fillSelect(engSel, WTC.config.SCHEMA.engines, state.engine || 'google');
    engSel.addEventListener('change', function () {
      state.engine = engSel.value;
      persist();
    });
  }

  /* ---------- 开关 ---------- */
  function bindSwitch(id, key) {
    var sw = $(id);
    sw.checked = !!state[key];
    sw.addEventListener('change', function () {
      state[key] = sw.checked;
      persist();
    });
  }

  /* ---------- 译文位置（单选） ---------- */
  function bindPosition() {
    var box = $('positionRadios');
    box.innerHTML = '';
    WTC.config.SCHEMA.positions.forEach(function (p) {
      var label = document.createElement('label');
      var radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'translatePosition';
      radio.value = p.id;
      radio.checked = state.translatePosition === p.id;
      radio.addEventListener('change', function () {
        state.translatePosition = p.id;
        persist();
      });
      label.appendChild(radio);
      label.appendChild(document.createTextNode(' ' + p.name));
      box.appendChild(label);
    });
  }

  /* ---------- 译文颜色调色板 ---------- */
  function updateColorDot() {
    $('colorDot').style.background = state.translateColor || '#2563eb';
    $('colorText').textContent = state.translateColor || '#2563eb';
    $('colorPreview').style.background = state.translateColor || '#2563eb';
  }

  function bindColor() {
    var overlay = $('colorOverlay');
    var grid = $('paletteGrid');
    updateColorDot();
    overlay.hidden = true;
    grid.innerHTML = '';
    WTC.config.SCHEMA.colors.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'op-swatch' + (c === state.translateColor ? ' op-sel' : '');
      b.style.background = c;
      b.addEventListener('click', function () {
        state.translateColor = c;
        updateColorDot();
        persist();
        overlay.hidden = true;
        toast('译文颜色已更新');
      });
      grid.appendChild(b);
    });

    $('btnColor').addEventListener('click', function () {
      updateColorDot();
      overlay.hidden = false;
    });
    $('btnCancelColor').addEventListener('click', function () {
      overlay.hidden = true;
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.hidden = true;
    });
  }

  /* ---------- 引擎密钥 ---------- */
  function bindEngines() {
    var v = state.engines = state.engines || {};
    v.volcano = v.volcano || { accessKeyId: '', secretAccessKey: '', region: 'cn-north-1', host: 'open.volcengineapi.com' };
    v.deepl = v.deepl || { apiKey: '', free: true };
    v.ai = v.ai || { baseUrl: '', apiKey: '', model: 'gpt-4o-mini' };

    bindText('vcAk', function (val) { v.volcano.accessKeyId = val; });
    bindText('vcSk', function (val) { v.volcano.secretAccessKey = val; });
    bindText('vcRegion', function (val) { v.volcano.region = val; });
    bindText('deeplKey', function (val) { v.deepl.apiKey = val; });
    bindText('aiBase', function (val) { v.ai.baseUrl = val; });
    bindText('aiKey', function (val) { v.ai.apiKey = val; });
    bindText('aiModel', function (val) { v.ai.model = val; });

    $('vcAk').value = v.volcano.accessKeyId || '';
    $('vcSk').value = v.volcano.secretAccessKey || '';
    $('vcRegion').value = v.volcano.region || 'cn-north-1';
    $('deeplKey').value = v.deepl.apiKey || '';
    $('aiBase').value = v.ai.baseUrl || '';
    $('aiKey').value = v.ai.apiKey || '';
    $('aiModel').value = v.ai.model || 'gpt-4o-mini';

    // DeepL free / pro
    var tier = document.querySelectorAll('input[name="deeplFree"]');
    tier.forEach(function (r) {
      r.checked = (v.deepl.free !== false) === (r.value === 'free');
      r.addEventListener('change', function () {
        v.deepl.free = (r.value === 'free');
        persist();
      });
    });
  }

  function bindText(id, setter) {
    var el = $(id);
    var timer = null;
    el.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        setter(el.value);
        persist();
      }, 400);
    });
    el.addEventListener('blur', function () {
      clearTimeout(timer);
      setter(el.value);
      persist();
    });
  }

  /* ---------- 快捷短语 ---------- */
  function renderPhrases() {
    var box = $('phraseList');
    box.innerHTML = '';
    (state.phrases || []).forEach(function (p) {
      var item = document.createElement('div');
      item.className = 'op-list-item';

      var group = document.createElement('span');
      group.className = 'op-li-group';
      group.textContent = p.group || '常用';

      var text = document.createElement('span');
      text.className = 'op-li-text';
      text.textContent = p.zh || '';

      var act = document.createElement('span');
      act.className = 'op-li-act';

      var edit = document.createElement('button');
      edit.className = 'op-icon-btn';
      edit.textContent = '编辑';
      edit.addEventListener('click', function () {
        var nv = prompt('修改短语内容：', p.zh || '');
        if (nv != null) { p.zh = nv; persist(); renderPhrases(); }
      });

      var del = document.createElement('button');
      del.className = 'op-icon-btn';
      del.textContent = '删除';
      del.addEventListener('click', function () {
        state.phrases = (state.phrases || []).filter(function (x) { return x.id !== p.id; });
        persist(); renderPhrases();
      });

      act.appendChild(edit);
      act.appendChild(del);
      item.appendChild(group);
      item.appendChild(text);
      item.appendChild(act);
      box.appendChild(item);
    });
  }

  function bindPhrases() {
    $('btnAddPhrase').addEventListener('click', function () {
      var group = $('phGroup').value.trim() || '常用';
      var zh = $('phText').value.trim();
      if (!zh) { toast('请填写短语内容'); return; }
      state.phrases = state.phrases || [];
      state.phrases.push({ id: 'p' + Date.now(), group: group, zh: zh });
      $('phGroup').value = '';
      $('phText').value = '';
      persist().then(renderPhrases);
    });
  }

  /* ---------- 待办 ---------- */
  function fmtTime(ms) {
    var d = new Date(ms);
    if (isNaN(d.getTime())) return '';
    var pad = function (n) { return ('0' + n).slice(-2); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function renderTodos() {
    var box = $('todoList');
    box.innerHTML = '';
    (state.todos || []).forEach(function (t) {
      var item = document.createElement('div');
      item.className = 'op-list-item' + (t.done ? ' op-done' : '');

      var toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = !!t.done;
      toggle.style.accentColor = '#00A884';
      toggle.addEventListener('change', function () {
        t.done = toggle.checked;
        persist(); renderTodos();
      });

      var text = document.createElement('span');
      text.className = 'op-li-text';
      text.textContent = t.text || '';

      var time = document.createElement('span');
      time.className = 'op-li-time';
      time.textContent = fmtTime(t.time);

      var act = document.createElement('span');
      act.className = 'op-li-act';
      var del = document.createElement('button');
      del.className = 'op-icon-btn';
      del.textContent = '删除';
      del.addEventListener('click', function () {
        state.todos = (state.todos || []).filter(function (x) { return x.id !== t.id; });
        persist(); renderTodos();
      });
      act.appendChild(del);

      item.appendChild(toggle);
      item.appendChild(text);
      item.appendChild(time);
      item.appendChild(act);
      box.appendChild(item);
    });
  }

  function registerAlarm(t) {
    if (!hasChrome || !chrome.runtime || !chrome.runtime.sendMessage) return;
    if (!t.time || t.time <= Date.now()) return;
    chrome.runtime.sendMessage({
      type: 'wtc:alarm',
      id: t.id,
      when: t.time,
      title: 'WATransChat 待办提醒',
      message: t.text
    }, function () { void chrome.runtime.lastError; });
  }

  function bindTodos() {
    $('btnAddTodo').addEventListener('click', function () {
      var text = $('todoText').value.trim();
      var val = $('todoTime').value;
      if (!text) { toast('请填写待办内容'); return; }
      var ms = val ? new Date(val).getTime() : Date.now();
      var todo = { id: 'todo' + Date.now(), text: text, time: ms, done: false, notified: false };
      state.todos = state.todos || [];
      state.todos.push(todo);
      $('todoText').value = '';
      $('todoTime').value = '';
      persist().then(function () {
        registerAlarm(todo);
        renderTodos();
        toast('待办已添加');
      });
    });
  }

  /* ---------- 导入 / 导出 ---------- */
  function bindData() {
    $('btnExport').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'wtc_config_v1.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('配置已导出');
    });

    $('btnImport').addEventListener('click', function () {
      $('importFile').click();
    });

    $('importFile').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var imported = JSON.parse(reader.result);
          if (WTC.config && WTC.config.deepMerge) {
            state = WTC.config.deepMerge(WTC.config.DEFAULTS, imported || {});
          } else {
            state = imported;
          }
          persist().then(function () {
            toast('配置已导入');
            rerenderAll();
          });
        } catch (err) {
          toast('导入失败：JSON 格式错误');
        }
      };
      reader.readAsText(file, 'utf-8');
      e.target.value = '';
    });
  }

  /* ---------- 通话翻译分组 ---------- */
  function bindCall() {
    state.call = state.call || {};
    var c = state.call;
    c.myLang = c.myLang || 'zh-CN';
    c.clientLang = c.clientLang || 'en';
    c.autoSpeak = c.autoSpeak !== false;
    c.voiceClient = c.voiceClient || 'male';
    c.voiceMine = c.voiceMine || 'female';
    c.asrEngine = c.asrEngine || 'webspeech';
    c.showLegal = c.showLegal !== false;

    var mySel = $('selCallMyLang');
    fillSelect(mySel, WTC.config.LANGUAGES, c.myLang);
    mySel.addEventListener('change', function () { c.myLang = mySel.value; persist(); });

    var cliSel = $('selCallClientLang');
    fillSelect(cliSel, WTC.config.LANGUAGES, c.clientLang);
    cliSel.addEventListener('change', function () { c.clientLang = cliSel.value; persist(); });

    $('swCallAutoSpeak').checked = !!c.autoSpeak;
    $('swCallAutoSpeak').addEventListener('change', function () { c.autoSpeak = $('swCallAutoSpeak').checked; persist(); });

    var clientRadios = document.querySelectorAll('input[name="callVoiceClient"]');
    clientRadios.forEach(function (r) {
      r.checked = r.value === c.voiceClient;
      r.addEventListener('change', function () { if (r.checked) { c.voiceClient = r.value; persist(); } });
    });
    var mineRadios = document.querySelectorAll('input[name="callVoiceMine"]');
    mineRadios.forEach(function (r) {
      r.checked = r.value === c.voiceMine;
      r.addEventListener('change', function () { if (r.checked) { c.voiceMine = r.value; persist(); } });
    });

    var asrSel = $('selCallAsr');
    asrSel.value = c.asrEngine;
    asrSel.addEventListener('change', function () { c.asrEngine = asrSel.value; persist(); });

    $('swCallLegal').checked = !!c.showLegal;
    $('swCallLegal').addEventListener('change', function () { c.showLegal = $('swCallLegal').checked; persist(); });
  }

  /* ---------- 重新渲染（导入后） ---------- */
  function rerenderAll() {
    bindBasics();
    bindSwitch('swAutoSend', 'autoSend');
    bindSwitch('swDomInspector', 'domInspector');
    bindSwitch('swSplit', 'splitScreen');
    bindPosition();
    bindColor();
    bindEngines();
    bindCall();
    renderPhrases();
    renderTodos();
  }

  /* ---------- 锚点定位（popup 跳转） ---------- */
  function jumpAnchor() {
    var hash = sessionStorage.getItem('wtc_open_hash') || location.hash;
    sessionStorage.removeItem('wtc_open_hash');
    if (!hash) return;
    var el = $(hash.slice(1));
    if (el) setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
  }

  /* ---------- 启动 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    load().then(function (cfg) {
      state = cfg || {};
      rerenderAll();
      bindPhrases();
      bindTodos();
      bindData();
      jumpAnchor();
    });
  });
})();

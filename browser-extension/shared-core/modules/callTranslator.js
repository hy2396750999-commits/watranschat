/* =====================================================================
 * WATransChat shared-core · modules/callTranslator.js
 * 通话（语音通话）实时翻译 —— 独立「通话同声传译」全屏面板。
 * 扩展无法 hook WhatsApp Web 的 WebRTC 通话音频，因此面板用于：接通
 * WhatsApp/电话后开扬声器，面板实时听译双方说话并显示双语字幕、朗读译文。
 *
 * 平台：
 *  - 浏览器扩展：getUserMedia + webkitSpeechRecognition 双路（失败降级单路）
 *    + speechSynthesis 朗读；
 *  - iOS（window.WTCNative 存在）：走原生桥 postMessage {id,action,args}，
 *    原生识别结果经 window.__wtcCallASR(side,isFinal,text) 回调。
 *
 * 暴露：WTC.callPanel.open(contact)；聊天头部注入 .wtc-call-entry 听筒按钮。
 * 纯 JS、无 import、无构建依赖。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.registerModule('callTranslator', function (ctx) {
    var utils = WTC.utils;

    /* ---------- 运行状态 ---------- */
    var overlay = null;               // .wtc-call-overlay
    var interimEls = { me: null, peer: null };
    var state = { started: false, stopping: false };
    var engine = root.WTCNative ? 'native' : 'browser';
    var recs = [];                    // 浏览器 SpeechRecognition 实例
    var bStream = null;               // getUserMedia MediaStream
    var singleMode = false;           // 双路失败降级单路
    var forcedSide = 'me';            // 单路模式下当前归属 side
    var endCount = 0;                 // onend 抖动计数（检测双路互抢）
    var endWindowStart = Date.now();
    var timerInt = null;
    var startedAt = 0;

    /* ---------- 配置读写（state.call） ---------- */
    function callCfg() {
      var c = (WTC.state && WTC.state.call) || {};
      return {
        myLang: c.myLang || 'zh-CN',
        clientLang: c.clientLang || 'en',
        autoSpeak: c.autoSpeak !== false,
        voiceClient: c.voiceClient || 'male',
        voiceMine: c.voiceMine || 'female',
        showLegal: c.showLegal !== false,
        asrEngine: c.asrEngine || 'webspeech',
        speakerOn: c.speakerOn !== false,
        muted: !!c.muted,
        translateEnabled: c.translateEnabled !== false
      };
    }
    function saveCall(patch) {
      WTC.state.call = Object.assign(callCfg(), patch || {});
      WTC.save();
    }

    function currentContact() {
      var name = utils.headerText() || '通话';
      var phone = utils.normalizePhone(name);
      var chatId = (WTC.currentChat && WTC.currentChat.chatId) || phone;
      var saved = chatId && WTC.state.contacts && WTC.state.contacts[chatId];
      return {
        name: name,
        phone: phone,
        chatId: chatId,
        clientLang: (saved && saved.targetLang) || (WTC.state.call && WTC.state.call.clientLang) || 'en'
      };
    }

    /* ==================== 原生桥（iOS） ==================== */
    function nativeCall(action, args) {
      var payload = {
        id: 'wtc-' + Date.now() + '-' + Math.floor(Math.random() * 1e6),
        action: action,
        args: args || {}
      };
      try {
        if (root.WTCNative && typeof root.WTCNative.postMessage === 'function') {
          root.WTCNative.postMessage(JSON.stringify(payload));
          return;
        }
        if (root.webkit && root.webkit.messageHandlers && root.webkit.messageHandlers.wtcNative) {
          root.webkit.messageHandlers.wtcNative.postMessage(payload);
          return;
        }
        root.postMessage({ source: 'wtcNativeBridge', payload: payload }, '*');
      } catch (e) {}
    }

    /* 原生识别结果回调（仅原生环境会调用） */
    root.__wtcCallASR = function (side, isFinal, text) {
      if (!overlay || text == null) return;
      text = String(text).trim();
      if (!text) return;
      if (isFinal) finalizeSegment(side, text);
      else upsertInterim(side, text);
    };
    root.__wtcCallError = function (where, message) {
      WTC.toast('通话识别：' + (message || where || '未知错误'));
    };

    /* ==================== 字幕气泡 ==================== */
    function makeBubble(side) {
      var b = utils.el('div', { class: 'wtc-call-bubble ' + side });
      b.appendChild(utils.el('span', { class: 'wtc-cb-tag' }, side === 'me' ? '我' : '对方'));
      b.appendChild(utils.el('span', { class: 'wtc-cb-orig' }, ''));
      b.appendChild(utils.el('span', { class: 'wtc-cb-trans' }, ''));
      return b;
    }
    function scrollSub() {
      if (!overlay) return;
      var sub = overlay.querySelector('.wtc-call-sub');
      if (sub) sub.scrollTop = sub.scrollHeight;
    }
    function upsertInterim(side, text) {
      if (!overlay) return;
      var sub = overlay.querySelector('.wtc-call-sub');
      var el = interimEls[side];
      if (!el) {
        el = makeBubble(side);
        el.classList.add('interim');
        sub.appendChild(el);
        interimEls[side] = el;
      }
      el.querySelector('.wtc-cb-orig').textContent = text;
      el.querySelector('.wtc-cb-trans').innerHTML = '<span class="wtc-cb-caret">▍</span>';
      scrollSub();
    }
    function finalizeSegment(side, text) {
      if (!overlay) return;
      var el = interimEls[side];
      if (el) {
        el.classList.remove('interim');
        var caret = el.querySelector('.wtc-cb-caret');
        if (caret) caret.parentNode.removeChild(caret);
        el.querySelector('.wtc-cb-orig').textContent = text;
        el.querySelector('.wtc-cb-trans').textContent = '';
        interimEls[side] = null;
      } else {
        el = makeBubble(side);
        el.querySelector('.wtc-cb-orig').textContent = text;
        overlay.querySelector('.wtc-call-sub').appendChild(el);
      }
      scrollSub();
      if (!callCfg().translateEnabled) return;
      var from = side === 'me' ? callCfg().myLang : callCfg().clientLang;
      var to = side === 'me' ? callCfg().clientLang : callCfg().myLang;
      WTC.translator.translate(text, from, to).then(function (tr) {
        if (!el.parentNode) return;
        el.querySelector('.wtc-cb-trans').textContent = tr || '';
        scrollSub();
        if (callCfg().autoSpeak && !callCfg().muted && tr) {
          speakSegment(tr, to, side === 'me' ? callCfg().voiceClient : callCfg().voiceMine);
        }
      }).catch(function () {});
    }

    /* ==================== 朗读 ==================== */
    function speakSegment(text, lang, gender) {
      if (engine === 'native') {
        nativeCall('speak', { text: text, lang: lang, gender: gender });
        return;
      }
      if (!('speechSynthesis' in root) || !text) return;
      try {
        root.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        var voices = root.speechSynthesis.getVoices() || [];
        var base = (lang || '').toLowerCase().split('-')[0];
        var pref = voices.filter(function (v) {
          return (v.lang || '').toLowerCase().indexOf(base) === 0;
        });
        var genderRe = gender === 'male'
          ? /male|guy|david|mark|daniel|alex|fred/i
          : /female|woman|zira|samantha|victoria|karen|moira|tessa|fiona|kate|serena/i;
        var matched = pref.filter(function (v) { return genderRe.test(v.name); });
        var chosen = matched[0] || pref[0] || null;
        if (chosen) u.voice = chosen;
        else { u.pitch = gender === 'male' ? 0.7 : 1.4; u.rate = 1.0; }
        root.speechSynthesis.speak(u);
      } catch (e) {}
    }

    /* ==================== 浏览器 ASR ==================== */
    var SR = root.SpeechRecognition || root.webkitSpeechRecognition;

    function showMicGuide() {
      if (!overlay) return;
      var sub = overlay.querySelector('.wtc-call-sub');
      var old = sub.querySelector('.wtc-call-micguide');
      if (old) old.parentNode.removeChild(old);
      var g = utils.el('div', { class: 'wtc-call-micguide' });
      g.innerHTML =
        '<h4>无法获取麦克风 / 语音识别</h4>' +
        '<ol>' +
        '<li>检查浏览器地址栏左侧的麦克风权限，允许 web.whatsapp.com 使用麦克风。</li>' +
        '<li>点击地址栏锁形图标 → 网站设置 → 麦克风 → 允许，然后刷新页面。</li>' +
        '<li>Windows：设置 → 系统 → 声音，确认系统麦克风未被禁用、未静音。</li>' +
        '<li>请使用 Chrome / Edge 浏览器（需要 Web Speech 语音识别支持）。</li>' +
        '</ol>';
      sub.appendChild(g);
    }

    function makeRec(side) {
      var r = new SR();
      r.lang = side === 'me' ? callCfg().myLang : callCfg().clientLang;
      r.continuous = true;
      r.interimResults = true;
      r.side = side;
      r.onresult = function (e) { handleRecEvent(r, e); };
      r.onerror = function () {};
      r.onend = function () {
        var now = Date.now();
        if (now - endWindowStart > 3000) { endWindowStart = now; endCount = 0; }
        endCount++;
        // 双路互抢导致频繁 onend → 平滑降级单路
        if (endCount > 3 && !singleMode && state.started) { switchToSingle(); return; }
        if (state.started && !state.stopping && !callCfg().muted) {
          try { r.start(); } catch (e) { switchToSingle(); }
        }
      };
      return r;
    }

    function handleRecEvent(r, e) {
      var side = r.side;
      var interim = '', finalText = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var res = e.results[i];
        var t = res[0] && res[0].transcript || '';
        if (res.isFinal) finalText += t; else interim += t;
      }
      if (finalText.trim()) finalizeSegment(side, finalText.trim());
      else if (interim.trim()) upsertInterim(side, interim.trim());
    }

    function stopRecs() {
      recs.forEach(function (r) {
        try { r.onend = function () {}; r.stop(); } catch (e) {}
      });
      recs = [];
    }

    function switchToSingle() {
      if (singleMode) return;
      singleMode = true;
      stopRecs();
      var seg = overlay && overlay.querySelector('.wtc-call-side-seg');
      if (seg) seg.style.display = '';
      var r = makeRec(forcedSide);
      recs.push(r);
      try { r.start(); } catch (e) {}
    }

    function startRecs() {
      stopRecs();
      if (!singleMode) {
        var ok = true;
        try { var rMe = makeRec('me'); recs.push(rMe); rMe.start(); } catch (e) { ok = false; }
        try { var rPeer = makeRec('peer'); recs.push(rPeer); rPeer.start(); } catch (e) { ok = false; }
        if (!ok) { switchToSingle(); return; }
      } else {
        var r = makeRec(forcedSide);
        recs.push(r);
        try { r.start(); } catch (e) {}
      }
    }

    function startBrowserASR() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { showMicGuide(); return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        bStream = stream;
        if (!SR) { showMicGuide(); return; }
        startRecs();
      }).catch(function () { showMicGuide(); });
    }
    function stopBrowserASR() {
      stopRecs();
      if (bStream) {
        bStream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
        bStream = null;
      }
    }

    /* ==================== 计时 ==================== */
    function startTimer() {
      startedAt = Date.now();
      var st = overlay.querySelector('.wtc-call-status');
      st.classList.add('running');
      timerInt = setInterval(function () {
        var s = Math.floor((Date.now() - startedAt) / 1000);
        var m = Math.floor(s / 60);
        var ss = s % 60;
        st.textContent = m + ':' + ('0' + ss).slice(-2);
      }, 1000);
    }
    function stopTimer() { if (timerInt) { clearInterval(timerInt); timerInt = null; } }

    /* ==================== 开始 / 停止 / 挂断 ==================== */
    function doStart() {
      state.started = true;
      state.stopping = false;
      var tgl = overlay.querySelector('.wtc-call-toggle');
      tgl.textContent = '停止翻译';
      tgl.classList.remove('start');
      tgl.classList.add('stop');
      startTimer();
      syncControlIcons();
      if (root.WTCNative) {
        engine = 'native';
        nativeCall('startCallASR', { myLang: callCfg().myLang, clientLang: callCfg().clientLang });
      } else {
        engine = 'browser';
        startBrowserASR();
      }
    }
    function doStop() {
      state.started = false;
      state.stopping = true;
      stopTimer();
      if (engine === 'native') {
        nativeCall('stopCallASR', {});
        nativeCall('stopSpeak', {});
      } else {
        stopBrowserASR();
      }
      if ('speechSynthesis' in root) { try { root.speechSynthesis.cancel(); } catch (e) {} }
      var tgl = overlay.querySelector('.wtc-call-toggle');
      tgl.textContent = '开始翻译';
      tgl.classList.add('start');
      tgl.classList.remove('stop');
      var st = overlay.querySelector('.wtc-call-status');
      st.classList.remove('running');
      st.textContent = '已停止';
      syncControlIcons();
    }
    function hangup() {
      doStop();
      if (overlay) { overlay.parentNode && overlay.parentNode.removeChild(overlay); overlay = null; }
      interimEls = { me: null, peer: null };
    }

    function showLegalBanner() {
      var old = overlay.querySelector('.wtc-call-legal');
      if (old) old.parentNode.removeChild(old);
      var bar = utils.el('div', { class: 'wtc-call-legal' });
      bar.innerHTML =
        '正在录制通话内容，请确保合法使用并保护隐私。' +
        '<div class="wtc-cl-btns">' +
        '<button class="wtc-legal-ok">同意并开始</button>' +
        '<button class="wtc-legal-no">取消</button>' +
        '</div>';
      overlay.appendChild(bar);
      bar.querySelector('.wtc-legal-ok').addEventListener('click', function () {
        bar.parentNode && bar.parentNode.removeChild(bar);
        saveCall({ showLegal: false });
        doStart();
      });
      bar.querySelector('.wtc-legal-no').addEventListener('click', function () {
        bar.parentNode && bar.parentNode.removeChild(bar);
      });
    }
    function onToggle() {
      if (!state.started) {
        if (callCfg().showLegal) { showLegalBanner(); return; }
        doStart();
      } else {
        doStop();
      }
    }

    /* ==================== 底部控制 ==================== */
    function syncControlIcons() {
      var c = callCfg();
      var t = overlay.querySelector('#cc-translate'); if (t) t.classList.toggle('active', state.started && c.translateEnabled);
      var sp = overlay.querySelector('#cc-speaker'); if (sp) sp.classList.toggle('slash', !c.speakerOn);
      var mi = overlay.querySelector('#cc-mic'); if (mi) mi.classList.toggle('slash', c.muted);
    }
    function onMute() {
      var m = !callCfg().muted;
      saveCall({ muted: m });
      syncControlIcons();
      if (engine === 'native') { nativeCall('setMuted', { muted: m }); }
      if (state.started) {
        if (m) {
          stopRecs();
          if ('speechSynthesis' in root) { try { root.speechSynthesis.cancel(); } catch (e) {} }
        } else if (!root.WTCNative) {
          startRecs();
        }
      }
    }

    /* ==================== 面板构建 ==================== */
    function langBlock(cap, val) {
      var w = utils.el('div', { class: 'wtc-call-lang' });
      w.appendChild(utils.el('span', { class: 'wtc-cl-cap' }, cap));
      w.appendChild(utils.el('span', { class: 'wtc-cl-val' }, WTC.config.langName(val)));
      var sel = utils.el('select');
      WTC.config.LANGUAGES.forEach(function (l) {
        sel.appendChild(utils.el('option', { value: l.code }, l.name));
      });
      sel.value = val;
      w.appendChild(sel);
      return w;
    }
    function syncLangBlock(w, code) {
      w.querySelector('.wtc-cl-val').textContent = WTC.config.langName(code);
    }
    function voiceRow(label, val, onpick) {
      var row = utils.el('div', { class: 'wtc-call-voice-row' });
      row.appendChild(utils.el('span', { class: 'wtc-cvr-label' }, label));
      var seg = utils.el('div', { class: 'wtc-call-voice-seg' });
      ['male', 'female'].forEach(function (g) {
        var b = utils.el('button', { class: g === val ? 'sel' : '' }, g === 'male' ? '男声' : '女声');
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) { x.classList.remove('sel'); });
          b.classList.add('sel');
          onpick(g);
        });
        seg.appendChild(b);
      });
      row.appendChild(seg);
      return row;
    }

    function openCallPanel(contact) {
      if (overlay) { overlay.parentNode && overlay.parentNode.removeChild(overlay); overlay = null; }
      interimEls = { me: null, peer: null };
      state.started = false;
      state.stopping = false;
      singleMode = false;
      endCount = 0;
      engine = root.WTCNative ? 'native' : 'browser';
      contact = contact || currentContact();
      var c = callCfg();

      overlay = utils.el('div', { class: 'wtc-call-overlay' });

      // 顶部：语言栏 + 开始/停止 + 音色
      var top = utils.el('div', { class: 'wtc-call-top' });
      var langbar = utils.el('div', { class: 'wtc-call-langbar' });
      var mine = langBlock('我的语言', c.myLang);
      var swap = utils.el('button', { class: 'wtc-call-swap', title: '交换语言' }, '⇄');
      var peer = langBlock('客户语言', contact.clientLang || c.clientLang);
      langbar.appendChild(mine);
      langbar.appendChild(swap);
      langbar.appendChild(peer);
      top.appendChild(langbar);

      var toggle = utils.el('button', { class: 'wtc-call-toggle start' }, '开始翻译');
      top.appendChild(toggle);

      top.appendChild(voiceRow('对方听', c.voiceClient, function (v) { saveCall({ voiceClient: v }); }));
      top.appendChild(voiceRow('我方听', c.voiceMine, function (v) { saveCall({ voiceMine: v }); }));
      overlay.appendChild(top);

      // 联系人区
      var contactEl = utils.el('div', { class: 'wtc-call-contact' });
      contactEl.appendChild(utils.el('div', { class: 'wtc-call-name' }, contact.name || '通话'));
      contactEl.appendChild(utils.el('div', { class: 'wtc-call-enc' }, '🔒 端到端加密'));
      var status = utils.el('div', { class: 'wtc-call-status' }, '正在连接…');
      contactEl.appendChild(status);
      var sideSeg = utils.el('div', { class: 'wtc-call-side-seg', style: 'display:none;margin:6px 0 0;' });
      sideSeg.innerHTML = '<button data-side="me">我</button><button data-side="peer">对方</button>';
      contactEl.appendChild(sideSeg);
      overlay.appendChild(contactEl);

      // 字幕流
      overlay.appendChild(utils.el('div', { class: 'wtc-call-sub' }));

      // 底部控制栏
      var controls = utils.el('div', { class: 'wtc-call-controls' });
      var btnTrans = utils.el('button', { class: 'wtc-cc-btn', id: 'cc-translate', title: '翻译开关' }, '<span class="wtc-cc-ic">译</span>');
      var btnVideo = utils.el('button', { class: 'wtc-cc-btn', id: 'cc-video', title: '视频' }, '<span class="wtc-cc-ic">📹</span>');
      var btnSpk = utils.el('button', { class: 'wtc-cc-btn', id: 'cc-speaker', title: '扬声器' }, '<span class="wtc-cc-ic">🔊</span>');
      var btnMic = utils.el('button', { class: 'wtc-cc-btn', id: 'cc-mic', title: '静音' }, '<span class="wtc-cc-ic">🎤</span>');
      var btnHang = utils.el('button', { class: 'wtc-cc-btn hangup', id: 'cc-hangup', title: '挂断' }, '<span class="wtc-cc-ic">📞</span>');
      controls.appendChild(btnTrans);
      controls.appendChild(btnVideo);
      controls.appendChild(btnSpk);
      controls.appendChild(btnMic);
      controls.appendChild(btnHang);
      overlay.appendChild(controls);

      document.body.appendChild(overlay);

      // 事件
      toggle.addEventListener('click', onToggle);
      swap.addEventListener('click', function () {
        var mv = mine.querySelector('select').value;
        var pv = peer.querySelector('select').value;
        mine.querySelector('select').value = pv; syncLangBlock(mine, pv);
        peer.querySelector('select').value = mv; syncLangBlock(peer, mv);
        saveCall({ myLang: pv, clientLang: mv });
      });
      mine.querySelector('select').addEventListener('change', function () {
        saveCall({ myLang: this.value }); syncLangBlock(mine, this.value);
      });
      peer.querySelector('select').addEventListener('change', function () {
        saveCall({ clientLang: this.value }); syncLangBlock(peer, this.value);
      });
      btnTrans.addEventListener('click', function () {
        saveCall({ translateEnabled: !callCfg().translateEnabled }); syncControlIcons();
      });
      btnVideo.addEventListener('click', function () {
        WTC.toast('视频通话以系统通话为准，本面板继续同声传译');
      });
      btnSpk.addEventListener('click', function () {
        saveCall({ speakerOn: !callCfg().speakerOn }); syncControlIcons();
      });
      btnMic.addEventListener('click', onMute);
      btnHang.addEventListener('click', hangup);
      sideSeg.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('button') : null;
        if (!b) return;
        forcedSide = b.getAttribute('data-side');
        Array.prototype.forEach.call(sideSeg.querySelectorAll('button'), function (x) {
          x.classList.toggle('sel', x === b);
        });
        if (state.started && !root.WTCNative) startRecs();
      });

      syncControlIcons();
    }

    /* ==================== 头部听筒入口 ==================== */
    function injectEntry() {
      var header = utils.find('chatHeader');
      if (!header) return;
      if (header.querySelector('.wtc-call-entry')) return;
      var btn = utils.el('button', { class: 'wtc-call-entry', title: '通话同声传译' }, '📞');
      btn.addEventListener('click', function () { openCallPanel(null); });
      header.appendChild(btn);
    }

    /* ---------- 暴露 ---------- */
    WTC.callPanel = { open: function (contact) { openCallPanel(contact || null); } };

    /* ---------- popup 消息：打开通话面板 ---------- */
    if (root.chrome && root.chrome.runtime && root.chrome.runtime.onMessage &&
        root.chrome.runtime.onMessage.addListener) {
      root.chrome.runtime.onMessage.addListener(function (msg) {
        if (msg && msg.type === 'wtc:call:open') openCallPanel(msg.contact || null);
      });
    }

    /* ---------- 启动：注入入口 + DOM 变化时补注入 ---------- */
    injectEntry();
    WTC.onDomChanged(function () { injectEntry(); });
  });
})();

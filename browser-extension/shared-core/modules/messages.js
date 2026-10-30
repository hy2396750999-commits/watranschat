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

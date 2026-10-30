/* =====================================================================
 * WATransChat · popup/popup.js
 * 工具栏弹窗：总开关（读写 wtc_config_v1）+ 功能入口。
 * 复用 shared-core 的 WTC.storage.loadState/saveState，不重复造存储。
 * ===================================================================== */
(function () {
  'use strict';

  var state = null;
  var $ = function (id) { return document.getElementById(id); };

  var hasChrome = !!(window.chrome && window.chrome.runtime);

  /* ---------- 读取配置 ---------- */
  function load() {
    if (window.WTC && WTC.storage && WTC.storage.loadState) {
      return WTC.storage.loadState();
    }
    // 兜底：直接读 chrome.storage.local
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

  function persist(next) {
    if (window.WTC && WTC.storage && WTC.storage.saveState) {
      return WTC.storage.saveState(next);
    }
    return new Promise(function (resolve) {
      if (hasChrome && chrome.storage && chrome.storage.local) {
        var o = {}; o['wtc_config_v1'] = next;
        chrome.storage.local.set(o, resolve);
      } else { resolve(); }
    });
  }

  /* ---------- 总开关 ---------- */
  function bindSwitch() {
    var sw = $('masterSwitch');
    sw.checked = !!(state && state.enabled !== false);
    sw.addEventListener('change', function () {
      state = state || {};
      state.enabled = sw.checked;
      persist(state).then(function () {
        // 广播给当前 WA 页面，使其即时响应开关
        if (hasChrome && chrome.tabs) {
          chrome.tabs.query({ url: ['https://web.whatsapp.com/*', 'https://*.whatsapp.com/*'] }, function (tabs) {
            (tabs || []).forEach(function (t) {
              try { chrome.tabs.sendMessage(t.id, { type: 'wtc:config-changed', state: state }); } catch (e) {}
            });
          });
        }
      });
    });
  }

  /* ---------- 会员信息卡 ---------- */
  function renderMember() {
    var m = (state && state.member) || {};
    $('mName').textContent = m.name || 'WATransChat 用户';
    $('mPlan').textContent = m.plan || '基础版';
    $('mExpire').textContent = m.expire || '未开通会员';
    $('mDevices').textContent = (m.devices != null ? m.devices : 1) + ' 台';
  }

  function toggleMember() {
    var panel = $('memberPanel');
    panel.hidden = !panel.hidden;
    $('memberArrow').textContent = panel.hidden ? '›' : '⌄';
    if (!panel.hidden) renderMember();
  }

  /* ---------- 入口按钮 ---------- */
  function openOptions(hash) {
    if (hasChrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      if (hash) {
        // options.js 启动时读取 location.hash 定位分组
        sessionStorage.setItem('wtc_open_hash', hash);
      }
      chrome.runtime.openOptionsPage();
    }
  }

  function openWaTab() {
    if (hasChrome && chrome.tabs) {
      chrome.tabs.create({ url: 'https://web.whatsapp.com' });
    }
  }

  function quickChat() {
    // 优先通知已打开的 WA 页面唤起快速聊天；无页面则新开
    var delivered = false;
    if (hasChrome && chrome.tabs) {
      chrome.tabs.query({ url: ['https://web.whatsapp.com/*', 'https://*.whatsapp.com/*'] }, function (tabs) {
        (tabs || []).forEach(function (t) {
          try {
            chrome.tabs.sendMessage(t.id, { type: 'wtc:quickchat:open' });
            delivered = true;
          } catch (e) {}
        });
        if (!delivered) openWaTab();
      });
    } else {
      openWaTab();
    }
  }

  function openCall() {
    // 通知已打开的 WA 页面打开通话同声传译面板；无页面则新开 WhatsApp 标签
    var delivered = false;
    if (hasChrome && chrome.tabs) {
      chrome.tabs.query({ url: ['https://web.whatsapp.com/*', 'https://*.whatsapp.com/*'] }, function (tabs) {
        (tabs || []).forEach(function (t) {
          try {
            chrome.tabs.sendMessage(t.id, { type: 'wtc:call:open' });
            delivered = true;
          } catch (e) {}
        });
        if (!delivered) openWaTab();
      });
    } else {
      openWaTab();
    }
  }

  function bindButtons() {
    $('btnSettings').addEventListener('click', function () { openOptions(); });
    $('btnPhrases').addEventListener('click', function () { openOptions('#phrases'); });
    $('btnQuickChat').addEventListener('click', quickChat);
    $('btnCall').addEventListener('click', openCall);
    $('btnMember').addEventListener('click', toggleMember);
    $('btnOpenWa').addEventListener('click', openWaTab);
  }

  /* ---------- 启动 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    load().then(function (cfg) {
      state = cfg || {};
      bindSwitch();
      bindButtons();
    });
  });
})();

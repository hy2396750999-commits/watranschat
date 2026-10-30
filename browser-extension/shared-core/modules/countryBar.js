/* =====================================================================
 * WATransChat shared-core · modules/countryBar.js
 * 聊天头部下方插入信息条（wtc-topbar）：
 *   第1行 号码 + 中文国家名（.wtc-country）
 *   第2行 语言中文名 · 货币代码 · 当地时间 HH:MM:SS（每秒刷新）
 *   附「最后上线时间」（尽力从头部副标题提取，无则不显示）
 * 号码经 normalizePhone + WTC.countries.lookupByPhone 推断，
 * 结果写入 WTC.currentChat={phone,chatId,country,targetLang}；
 * 点击信息条调用 settingsPanel.openLang()。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.registerModule('countryBar', function (ctx) {
    var utils = WTC.utils;
    var bar = null;
    var clockTimer = null;
    var lastKey = '';

    function openLang() {
      var panel = WTC.modules && WTC.modules.settingsPanel;
      if (panel && typeof panel.openLang === 'function') panel.openLang();
      else if (typeof WTC.openLang === 'function') WTC.openLang();
    }

    /* 尽力从头部提取「最后上线时间」副标题 */
    function extractSeen(header) {
      if (!header) return '';
      var title = utils.find('headerTitle', header);
      var spans = header.querySelectorAll('span[title], span[dir="auto"]');
      var candidates = [];
      Array.prototype.forEach.call(spans, function (s) {
        var t = (s.textContent || '').trim();
        if (!t || (title && s === title)) return;
        if (/online|last seen|最后上线|在线|今天|昨天|分钟前|小时前|ago|小时|分钟/i.test(t)) candidates.push(t);
      });
      return candidates[0] || '';
    }

    function buildBar() {
      var header = utils.find('chatHeader');
      if (!header) return;

      var raw = utils.headerText();
      var phone = utils.normalizePhone(raw);
      var key = phone || raw;
      if (key === lastKey && bar) return;
      lastKey = key;

      // 旧条移除，旧时钟停掉
      if (bar) { bar.parentNode && bar.parentNode.removeChild(bar); bar = null; }
      if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }

      var rec = null;
      if (phone && WTC.countries && typeof WTC.countries.lookupByPhone === 'function') {
        rec = WTC.countries.lookupByPhone(phone) || null;
      }

      var chatId = phone ? phone.replace(/^\+/, '') + '@c.us' : '';
      var saved = chatId && WTC.state.contacts[chatId];
      var targetLang = (saved && saved.targetLang) || (rec && rec.lang) || '';

      WTC.currentChat = {
        phone: phone,
        chatId: chatId,
        country: rec,
        targetLang: targetLang
      };

      bar = utils.el('div', { class: 'wtc-topbar', 'data-wtc-countrybar': '1' });
      var ic = utils.el('div', { class: 'wtc-topbar-ic' }, '👤');
      var lines = utils.el('div', { class: 'wtc-topbar-lines' });

      var line1 = utils.el('div', { class: 'wtc-topbar-line1' });
      var numSpan = utils.el('span', { class: 'wtc-topbar-phone' }, raw || phone || '未知号码');
      line1.appendChild(numSpan);
      if (rec && rec.zh) {
        line1.appendChild(utils.el('span', { class: 'wtc-country' }, ' ' + rec.zh));
      }

      var line2 = utils.el('div', { class: 'wtc-topbar-line2' });
      var langName = (rec && rec.langZh) || (targetLang ? WTC.config.langName(targetLang) : '');
      var currency = (rec && rec.currency) || '';
      var tz = rec && rec.tz;
      var metaParts = [langName, currency].filter(Boolean);
      var timeText = tz ? utils.nowIn(tz) : '';
      line2.textContent = metaParts.join(' · ') + (timeText ? ' · ' + timeText : '');

      lines.appendChild(line1);
      lines.appendChild(line2);

      var seen = extractSeen(header);
      if (seen) {
        lines.appendChild(utils.el('div', { class: 'wtc-topbar-seen' }, '最后上线时间 ' + seen));
      }

      bar.appendChild(ic);
      bar.appendChild(lines);
      bar.addEventListener('click', openLang);

      header.parentNode && header.parentNode.insertBefore(bar, header.nextSibling);

      // 当地时间每秒刷新
      if (tz) {
        clockTimer = setInterval(function () {
          if (!bar || !bar.isConnected) { clearInterval(clockTimer); clockTimer = null; return; }
          var parts = [langName, currency].filter(Boolean);
          line2.textContent = parts.join(' · ') + ' · ' + utils.nowIn(tz);
        }, 1000);
      }
    }

    WTC.onDomChanged(utils.debounce(buildBar, 200));
    buildBar();
  });
})();

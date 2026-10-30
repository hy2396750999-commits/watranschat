/* =====================================================================
 * WATransChat shared-core · modules/chatList.js
 * 1) 会话列表每项标题号码后追加中文国家名（.wtc-chatlist-country），只追加一次；
 * 2) 搜索框下方插入筛选标签（.wtc-chatlist-filter / .wtc-filter-chip）：
 *    所有 / 未读 / 特别关注 / 群组，点击做基础过滤。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.registerModule('chatList', function (ctx) {
    var utils = WTC.utils;
    var currentFilter = 'all';
    var chipsBuilt = false;

    /* ---------- 国家名追加 ---------- */
    function enrichItem(item) {
      if (item.getAttribute('data-wtc-cl-done')) return;
      var title = item.querySelector('span[title][dir="auto"]') ||
        item.querySelector('span[title]') ||
        item.querySelector('span[class*="ggj6brxd"] span');
      if (!title) return;
      var raw = (title.getAttribute('title') || title.textContent || '').trim();
      var phone = utils.normalizePhone(raw);
      if (!phone) return;
      item.setAttribute('data-wtc-cl-done', '1');

      if (WTC.countries && typeof WTC.countries.lookupByPhone === 'function') {
        var rec = WTC.countries.lookupByPhone(phone);
        if (rec && rec.zh && !item.querySelector('.wtc-chatlist-country')) {
          var tag = utils.el('span', { class: 'wtc-chatlist-country' }, ' ' + rec.zh);
          title.parentNode && title.parentNode.appendChild(tag);
        }
      }
    }

    /* ---------- 筛选 ---------- */
    function isUnread(item) {
      return !!(item.querySelector('[data-testid="icon-unread"], span[aria-label*="unread"], span[class*="unread"]') ||
        item.querySelector('span[style*="border-radius:50%"], span[style*="background-color: #25D366"]'));
    }
    function isGroup(item) {
      return !!(item.querySelector('[data-testid="icon-group"], [data-icon="group"], span[class*="group"]') ||
        /群组|group/i.test(item.textContent || ''));
    }
    function isStarred(item) {
      var title = item.querySelector('span[title][dir="auto"]') || item.querySelector('span[title]');
      var phone = title && utils.normalizePhone(title.getAttribute('title') || title.textContent || '');
      var chatId = phone ? phone.replace(/^\+/, '') + '@c.us' : '';
      var c = chatId && WTC.state.contacts[chatId];
      return !!(c && c.starred);
    }

    function applyFilter() {
      var items = utils.findAll('chatListItem');
      Array.prototype.forEach.call(items, function (item) {
        var show = true;
        if (currentFilter === 'unread') show = isUnread(item);
        else if (currentFilter === 'starred') show = isStarred(item);
        else if (currentFilter === 'group') show = isGroup(item);
        item.style.display = show ? '' : 'none';
      });
    }

    /* ---------- 筛选标签条 ---------- */
    function buildChips() {
      var pane = document.querySelector('#pane-side') || document.body;
      var searchRow = pane.querySelector('header') ||
        pane.querySelector('div[contenteditable="true"]') &&
        pane.querySelector('div[contenteditable="true"]').closest('div');
      if (!searchRow) return;

      var existing = pane.querySelector('.wtc-chatlist-filter');
      if (existing) return;

      var bar = utils.el('div', { class: 'wtc-chatlist-filter' });
      var defs = [
        { id: 'all', label: '所有' },
        { id: 'unread', label: '未读' },
        { id: 'starred', label: '特别关注' },
        { id: 'group', label: '群组' }
      ];
      defs.forEach(function (d) {
        var chip = utils.el('button', { class: 'wtc-filter-chip' + (currentFilter === d.id ? ' wtc-active' : '') }, d.label);
        chip.addEventListener('click', function () {
          currentFilter = d.id;
          bar.querySelectorAll('.wtc-filter-chip').forEach(function (c) { c.classList.remove('wtc-active'); });
          chip.classList.add('wtc-active');
          applyFilter();
        });
        bar.appendChild(chip);
      });

      // 插在搜索行之后
      if (searchRow.parentNode) searchRow.parentNode.insertBefore(bar, searchRow.nextSibling);
      chipsBuilt = true;
    }

    function scan() {
      buildChips();
      var items = utils.findAll('chatListItem');
      Array.prototype.forEach.call(items, enrichItem);
      if (chipsBuilt) applyFilter();
    }

    WTC.onDomChanged(utils.debounce(scan, 180));
    scan();
  });
})();

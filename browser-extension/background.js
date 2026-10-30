/* =====================================================================
 * WATransChat · background.js（MV3 service worker）
 * 外壳职责：
 *  1. wtc:http 代理：content script 经此发出跨域 fetch，绕过页面 CORS；
 *  2. wtc:alarm ：注册待办提醒（chrome.alarms），到点发系统通知；
 *  3. wtc:notify：content/页面直接请求弹一条系统通知。
 * 不在此初始化任何翻译逻辑（shared-core 自行启动）。
 * ===================================================================== */
'use strict';

const ALARM_PREFIX = 'wtc:alarm:';
const ALARM_STORE_KEY = 'wtc_alarm_map';

/* ---------- 1. 跨域 HTTP 代理 ---------- */
async function handleHttp(msg, sendResponse) {
  try {
    const options = msg.options || {};
    const resp = await fetch(msg.url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
      credentials: options.credentials || 'omit'
    });
    const body = await resp.text();
    sendResponse({ ok: resp.ok, status: resp.status, body: body });
  } catch (err) {
    sendResponse({ error: (err && err.message) ? err.message : String(err) });
  }
}

/* ---------- 2. 待办提醒：注册 alarm ---------- */
async function handleAlarm(msg, sendResponse) {
  try {
    const id = String(msg.id || ('todo-' + Date.now()));
    const name = ALARM_PREFIX + id;
    const when = Number(msg.when);
    const detail = {
      id: id,
      title: msg.title || 'WATransChat 待办提醒',
      message: msg.message || msg.text || '您有一条待办事项到期了',
      when: when
    };

    // 服务worker可能被回收，把提醒详情持久化到 storage.local
    const stored = await chrome.storage.local.get(ALARM_STORE_KEY);
    const map = (stored && stored[ALARM_STORE_KEY]) || {};
    map[name] = detail;
    await chrome.storage.local.set({ [ALARM_STORE_KEY]: map });

    const alarmOpts = {};
    if (when && when > Date.now()) {
      alarmOpts.when = when;
    } else if (msg.delayInMinutes != null) {
      alarmOpts.delayInMinutes = Number(msg.delayInMinutes);
    } else {
      alarmOpts.delayInMinutes = 1;
    }
    await chrome.alarms.create(name, alarmOpts);
    sendResponse({ ok: true, alarmName: name });
  } catch (err) {
    sendResponse({ error: (err && err.message) ? err.message : String(err) });
  }
}

/* ---------- 3. 直接发通知 ---------- */
function handleNotify(msg, sendResponse) {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: msg.title || 'WATransChat',
      message: msg.message || msg.text || '',
      priority: 1
    }, function () {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ ok: true });
      }
    });
  } catch (err) {
    sendResponse({ error: (err && err.message) ? err.message : String(err) });
  }
}

/* ---------- 消息路由 ---------- */
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg || !msg.type) return false;

  if (msg.type === 'wtc:http') {
    handleHttp(msg, sendResponse);
    return true; // 异步回传
  }
  if (msg.type === 'wtc:alarm') {
    handleAlarm(msg, sendResponse);
    return true;
  }
  if (msg.type === 'wtc:notify') {
    handleNotify(msg, sendResponse);
    return true;
  }
  return false;
});

/* ---------- alarm 触发：发系统通知并清理 ---------- */
chrome.alarms.onAlarm.addListener(async function (alarm) {
  if (!alarm || alarm.name.indexOf(ALARM_PREFIX) !== 0) return;

  let detail = { title: 'WATransChat 待办提醒', message: '您有一条待办事项到期了' };
  try {
    const stored = await chrome.storage.local.get(ALARM_STORE_KEY);
    const map = (stored && stored[ALARM_STORE_KEY]) || {};
    if (map[alarm.name]) detail = map[alarm.name];
    delete map[alarm.name];
    await chrome.storage.local.set({ [ALARM_STORE_KEY]: map });
  } catch (e) { /* 忽略存储读取失败，仍尝试发通知 */ }

  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: detail.title || 'WATransChat 待办提醒',
      message: detail.message || '',
      priority: 1
    });
  } catch (e) { /* 通知不可用时静默 */ }
});

/* ---------- 首次安装：无特殊初始化逻辑 ---------- */
chrome.runtime.onInstalled.addListener(function () {
  // 预留：无需预装数据
});

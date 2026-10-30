/* =====================================================================
 * WATransChat shared-core · core/config.js
 * 全局配置的唯一事实来源（default + schema）。options/popup/各模块都读它。
 * 纯 JS，挂载到 window.WTC，无 import、无构建依赖。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  /* 默认配置（与视频「翻译设置」逐项对应） */
  var DEFAULTS = {
    enabled: true,                 // 总开关
    myLanguage: 'zh-CN',           // 您的语言
    engine: 'google',              // 全局翻译引擎：google|bing|volcano|deepl
    translateColor: '#2563eb',     // 译文颜色（默认蓝）
    autoSend: true,                // 自动发送译文
    domInspector: false,           // 网页 DOM 检查
    translatePosition: 'below',    // 译文位置：below(原文在上译文在下)|right(在右)|only(仅译文)
    splitScreen: false,            // 分屏翻译
    showOriginal: true,            // 是否保留原文（only 时为 false）
    translateIncoming: true,       // 翻译对方消息
    translateOutgoing: true,       // 翻译自己发送的消息（在下方显示中文原文）
    autoDetectContact: true,       // 根据区号自动推断客户语言
    voiceInput: true,              // 语音输入转文字
    // 引擎密钥
    engines: {
      volcano: { accessKeyId: '', secretAccessKey: '', region: 'cn-north-1', host: 'open.volcengineapi.com' },
      deepl: { apiKey: '', free: true },
      ai: { baseUrl: '', apiKey: '', model: 'gpt-4o-mini' }
    },
    // 联系人级语言偏好：{ [chatId]: { targetLang, engine, remember, name, phone } }
    contacts: {},
    // 快捷短语
    phrases: [
      { id: 'p1', group: '欢迎', zh: '您好，很高兴收到您的询盘，请问有什么可以帮您？' },
      { id: 'p2', group: '报价', zh: '这是我们的最新报价单，FOB 价格，量大可优惠，详情请见附件。' },
      { id: 'p3', group: '售后', zh: '非常抱歉给您带来不便，我们会尽快为您处理，请提供订单号和问题照片。' },
      { id: 'p4', group: '物流', zh: '货物已安排发货，预计 7-15 个工作日到达，我会把物流单号发给您。' },
      { id: 'p5', group: '成交', zh: '感谢您的信任与支持，期待长期合作，欢迎再次下单！' }
    ],
    // 待办：{ id, chatId, phone, text, time(ISO ms), done, notified }
    todos: [],
    // AI 员工 / 自动回复
    aiStaff: {
      enabled: false,
      scheduleEnabled: false,
      start: '09:00',
      end: '18:00',
      autoReply: false,
      template: '您好，我现在不在，已收到您的消息，稍后会尽快回复您。',
      contacts: {} // chatId -> bool
    },
    // 会员 / 账户（本地账户概念）
    member: {
      loggedIn: false,
      name: 'WATransChat 用户',
      plan: '基础版',
      expire: '',
      email: '',
      devices: 1
    },
    // 多账号标签
    tabs: [],
    // 通话（语音通话）实时翻译
    call: {
      myLang: 'zh-CN',            // 我的语言
      clientLang: 'en',           // 客户语言（默认英语，打开联系人时按记忆覆盖）
      autoSpeak: true,            // 自动朗读译文
      voiceClient: 'male',        // 对方听到的音色：male|female
      voiceMine: 'female',        // 我方听到的音色：male|female
      showLegal: true,            // 开始时是否显示法律提示
      asrEngine: 'webspeech',     // 识别引擎：webspeech|native|cloud
      speakerOn: true,            // 扬声器（false=听筒，按钮显示红叉）
      muted: false,               // 静音（按钮显示红叉，暂停采集）
      translateEnabled: true      // 「译」总开关
    }
  };

  /* 配置项描述（供 options 渲染 / 导入导出） */
  var SCHEMA = {
    engines: [
      { id: 'google', name: '谷歌翻译', free: true },
      { id: 'bing', name: '微软翻译', free: true },
      { id: 'volcano', name: '火山引擎翻译', free: false },
      { id: 'deepl', name: 'DeepL 翻译', free: false }
    ],
    positions: [
      { id: 'below', name: '原文在上，译文在下' },
      { id: 'right', name: '原文在上，译文在右' },
      { id: 'only', name: '仅显示译文' }
    ],
    colors: [
      '#2563eb', '#1d4ed8', '#38bdf8', '#22c55e', '#14b8a6', '#0ea5e9',
      '#f97316', '#dc2626', '#e11d48', '#ef4444', '#f87171', '#f472b6',
      '#bfdbfe', '#93c5fd', '#c4b5fd', '#f9a8d4', '#a5b4fc', '#e5e7eb',
      '#e11d48', '#eab308', '#ef4444', '#22c55e', '#0ea5e9', '#a855f7',
      '#f3f4f6', '#d1d5db', '#9ca3af', '#6b7280', '#111827', '#000000',
      '#1f2937', '#111827', '#1e293b', '#374151', '#000000', '#0f172a'
    ]
  };

  /* 常用语言（目标语言下拉，带英文母语名） */
  var LANGUAGES = [
    { code: 'zh-CN', name: '中文（简体）', native: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: '中文（繁体）', native: 'Chinese (Traditional)' },
    { code: 'en', name: '英语', native: 'English' },
    { code: 'hu', name: '匈牙利语', native: 'Hungarian' },
    { code: 'pl', name: '波兰语', native: 'Polish' },
    { code: 'de', name: '德语', native: 'German' },
    { code: 'fr', name: '法语', native: 'French' },
    { code: 'es', name: '西班牙语', native: 'Spanish' },
    { code: 'pt', name: '葡萄牙语', native: 'Portuguese' },
    { code: 'it', name: '意大利语', native: 'Italian' },
    { code: 'ru', name: '俄语', native: 'Russian' },
    { code: 'ar', name: '阿拉伯语', native: 'Arabic' },
    { code: 'tr', name: '土耳其语', native: 'Turkish' },
    { code: 'he', name: '希伯来语', native: 'Hebrew' },
    { code: 'hi', name: '印地语', native: 'Hindi' },
    { code: 'id', name: '印尼语', native: 'Indonesian' },
    { code: 'ja', name: '日语', native: 'Japanese' },
    { code: 'ko', name: '韩语', native: 'Korean' },
    { code: 'th', name: '泰语', native: 'Thai' },
    { code: 'vi', name: '越南语', native: 'Vietnamese' },
    { code: 'nl', name: '荷兰语', native: 'Dutch' },
    { code: 'cs', name: '捷克语', native: 'Czech' },
    { code: 'sv', name: '瑞典语', native: 'Swedish' },
    { code: 'uk', name: '乌克兰语', native: 'Ukrainian' },
    { code: 'ro', name: '罗马尼亚语', native: 'Romanian' },
    { code: 'el', name: '希腊语', native: 'Greek' },
    { code: 'fa', name: '波斯语', native: 'Persian' },
    { code: 'ms', name: '马来语', native: 'Malay' },
    { code: 'th', name: '泰语', native: 'Thai' },
    { code: 'km', name: '高棉语', native: 'Khmer' },
    { code: 'ne', name: '尼泊尔语', native: 'Nepali' },
    { code: 'bn', name: '孟加拉语', native: 'Bengali' },
    { code: 'ur', name: '乌尔都语', native: 'Urdu' },
    { code: 'fil', name: '菲律宾语', native: 'Filipino' },
    { code: 'sw', name: '斯瓦希里语', native: 'Swahili' }
  ];

  /* 深合并（用于把存储值覆盖到默认值） */
  function deepMerge(base, over) {
    if (over == null) return base;
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(over || {}).forEach(function (k) {
      var bv = base ? base[k] : undefined;
      var ov = over[k];
      if (ov && typeof ov === 'object' && !Array.isArray(ov) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
        out[k] = deepMerge(bv, ov);
      } else {
        out[k] = ov;
      }
    });
    return out;
  }

  /* 模块注册机制（必须在各模块文件加载前就绪，故放在首个加载的 config.js） */
  WTC.modules = {};
  WTC._moduleOrder = [];
  WTC.registerModule = function (name, initFn) {
    WTC.modules[name] = { init: initFn };
    if (WTC._moduleOrder.indexOf(name) < 0) WTC._moduleOrder.push(name);
  };

  WTC.config = {
    DEFAULTS: DEFAULTS,
    SCHEMA: SCHEMA,
    LANGUAGES: LANGUAGES,
    deepMerge: deepMerge,
    /* 语言 code -> 显示名 */
    langName: function (code) {
      var l = LANGUAGES.filter(function (x) { return x.code === code; })[0];
      return l ? l.name : code;
    },
    engineName: function (id) {
      var e = SCHEMA.engines.filter(function (x) { return x.id === id; })[0];
      return e ? e.name : id;
    }
  };
})();

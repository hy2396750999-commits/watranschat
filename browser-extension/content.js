/* =====================================================================
 * WATransChat · content.js（最后加载的兜底标记，禁止重复初始化）
 * shared-core 的 inject.js / 各模块已完成全部启动逻辑；本文件只做环境
 * 确认与就绪标记，不再次注册监听、不再次渲染 UI。
 * ===================================================================== */
(function () {
  'use strict';

  // 环境确认：WTC 命名空间由 shared-core/core/config.js 先于本文件挂载
  if (window.WTC) {
    window.__WTC_EXT_READY = true;
    document.dispatchEvent(new CustomEvent('wtc:ext-ready', {
      detail: { version: '2.6.8', ready: true }
    }));
  } else {
    // shared-core 尚未就绪时仅记录，不做补救初始化
    console.warn('[WATransChat] shared-core 未加载，content.js 仅作兜底标记。');
  }
})();

/* =====================================================================
 * WATransChat iOS · build-combined.js
 * Node 合并脚本：读取根 shared-core，按 inject.js 注释里的加载顺序合并出
 * WATransChat/share/wtc.combined.js（供 WKUserScript 在 documentStart 注入）。
 *
 * 用法：
 *   node build-combined.js
 * 集成阶段 shared-core 更新后，重新运行本脚本即可覆盖 share/wtc.combined.js。
 *
 * 合并顺序：
 *   1. share/native-bridge.js（iOS 原生桥 shim，page world 最先执行）
 *   2. styles.css -> window.__WTC_CSS__ = `<css>`（转义反引号 / ${} / 反斜杠）
 *   3. core/config.js, core/storage.js, core/utils.js, core/net.js
 *   4. data/countries.js
 *   5. translators/google.js, bing.js, volcano.js, deepl.js
 *   6. modules/translate.js, messages.js, countryBar.js, chatList.js,
 *      quickPhrase.js, quickChat.js, todo.js, aiStaff.js, settingsPanel.js
 *   7. inject.js
 * 缺失文件只打警告、跳过，不中断（模块尚未写完时也能先出一个可检查语法的包）。
 * ===================================================================== */

const fs = require('fs');
const path = require('path');

// ios/WATransChat/build-combined.js -> 上两级 = 项目根(外贸翻译软件)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SHARED_CORE = path.join(PROJECT_ROOT, 'shared-core');
const IOS_APP_DIR = __dirname;
const SHARE_DIR = path.join(IOS_APP_DIR, 'WATransChat', 'share');
const OUT_FILE = path.join(SHARE_DIR, 'wtc.combined.js');

/* 按 inject.js 注释声明的顺序（相对 shared-core 的路径） */
const JS_ORDER = [
  'core/config.js',
  'core/storage.js',
  'core/utils.js',
  'core/net.js',
  'data/countries.js',
  'translators/google.js',
  'translators/bing.js',
  'translators/volcano.js',
  'translators/deepl.js',
  'modules/translate.js',
  'modules/messages.js',
  'modules/countryBar.js',
  'modules/chatList.js',
  'modules/quickPhrase.js',
  'modules/quickChat.js',
  'modules/todo.js',
  'modules/aiStaff.js',
  'modules/settingsPanel.js',
  'inject.js'
];

function readIfExists(p) {
  if (fs.existsSync(p)) {
    return fs.readFileSync(p, 'utf8');
  }
  return null;
}

/* CSS 包进模板字符串：转义反斜杠、反引号、${ */
function cssToTemplate(css) {
  const escaped = css
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  return 'window.__WTC_CSS__ = `' + escaped + '`;\n';
}

function main() {
  fs.mkdirSync(SHARE_DIR, { recursive: true });

  const parts = [];
  const missing = [];

  parts.push('/* ============================================================\n' +
    ' * wtc.combined.js — 由 build-combined.js 自动生成，请勿手改。\n' +
    ' * 重新运行 `node build-combined.js` 即可用最新 shared-core 覆盖。\n' +
    ' * ============================================================ */\n');

  // 1. iOS 原生桥 shim（最先）
  const bridgePath = path.join(SHARE_DIR, 'native-bridge.js');
  const bridge = readIfExists(bridgePath);
  if (bridge != null) {
    parts.push('\n/* ---- native-bridge.js ---- */\n' + bridge + '\n');
  } else {
    missing.push('share/native-bridge.js');
  }

  // 2. styles.css -> __WTC_CSS__
  const cssPath = path.join(SHARED_CORE, 'styles.css');
  const css = readIfExists(cssPath);
  if (css != null) {
    parts.push('\n/* ---- styles.css -> __WTC_CSS__ ---- */\n' + cssToTemplate(css));
    // 同步复制一份到 share（供参考 / 备用）
    fs.writeFileSync(path.join(SHARE_DIR, 'styles.css'), css, 'utf8');
  } else {
    missing.push('shared-core/styles.css');
  }

  // 3-7. 按顺序合并 JS
  JS_ORDER.forEach(function (rel) {
    const p = path.join(SHARED_CORE, rel);
    const code = readIfExists(p);
    if (code != null) {
      parts.push('\n/* ---- ' + rel + ' ---- */\n' + code + '\n');
    } else {
      missing.push('shared-core/' + rel);
    }
  });

  const out = parts.join('\n');
  fs.writeFileSync(OUT_FILE, out, 'utf8');

  console.log('[build-combined] 输出: ' + OUT_FILE);
  console.log('[build-combined] 字节数: ' + Buffer.byteLength(out, 'utf8'));
  if (missing.length) {
    console.log('[build-combined] 以下文件缺失，已跳过（集成时补齐后重跑即可）:');
    missing.forEach(function (m) { console.log('  - ' + m); });
  } else {
    console.log('[build-combined] 全部文件齐备。');
  }
}

main();

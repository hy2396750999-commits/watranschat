/* check-pbxproj.js — 离线核对 project.pbxproj 与落盘文件的一致性
 * 1) 解析 PBXFileReference / PBXGroup / 构建阶段 / buildFile 引用
 * 2) 正向：每个引用文件都在磁盘上存在（相对项目根，即 pbxproj 所在目录）
 * 3) 反向：磁盘上每个应打包的源文件/资源都被 pbxproj 引用
 * 4) 统计 PBXFileReference 数、Sources/Resources 阶段文件数
 * 说明：Info.plist 经 INFOPLIST_FILE 构建设置引用，不作为 PBXFileReference。
 */
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');          // ios/WATransChat（pbxproj 所在）
const SRC_DIR = path.join(PROJECT_DIR, 'WATransChat');       // 源码/资源目录
const PBX = path.join(PROJECT_DIR, 'WATransChat.xcodeproj', 'project.pbxproj');
const text = fs.readFileSync(PBX, 'utf8');

const failures = [];

/* ---------- 仅提取 PBXFileReference（排除 PBXGroup） ---------- */
const frBlockRe = /([0-9A-F]{24})\s*\/\*[^*]*\*\/\s*=\s*\{\s*isa\s*=\s*PBXFileReference;([\s\S]*?)\};/g;
const fileRefs = {};
let m;
while ((m = frBlockRe.exec(text)) !== null) {
  const id = m[1];
  const body = m[2];
  const pm = body.match(/path\s*=\s*([^;]+);/);
  let p = pm ? pm[1].trim() : '';
  if (p.startsWith('"')) p = p.slice(1, -1);
  fileRefs[id] = p;
}

/* ---------- 提取 PBXGroup（children + path） ---------- */
const groupRe = /([0-9A-F]{24})(\s*\/\*[^*]*\*\/)?\s*=\s*\{\s*isa\s*=\s*PBXGroup;([\s\S]*?)\};/g;
const groups = {};
while ((m = groupRe.exec(text)) !== null) {
  const id = m[1];
  const body = m[3];
  const pathMatch = body.match(/path\s*=\s*([^;]+);/);
  const gpath = pathMatch ? pathMatch[1].trim().replace(/^"|"$/g, '') : '';
  const children = [];
  const childRe = /([0-9A-F]{24})\s*\/\*/g;
  let cm;
  while ((cm = childRe.exec(body)) !== null) children.push(cm[1]);
  groups[id] = { path: gpath, children };
}

/* 定位 main group：含 Products 组（含 WATransChat.app）的组 */
const productsGroupId = Object.keys(groups).find(g =>
  groups[g].children.some(c => fileRefs[c] === 'WATransChat.app'));
const rootGroupId = Object.keys(groups).find(g => groups[g].children.includes(productsGroupId));

/* fileRef -> 相对项目根的磁盘路径（按组层级拼路径） */
function resolveFileRef(frId, groupId, prefix) {
  const g = groups[groupId];
  if (!g) return null;
  const myPrefix = g.path ? (prefix ? prefix + '/' + g.path : g.path) : prefix;
  for (const child of g.children) {
    if (child === frId) {
      return myPrefix ? myPrefix + '/' + fileRefs[frId] : fileRefs[frId];
    }
    if (groups[child]) {
      const r = resolveFileRef(frId, child, myPrefix);
      if (r) return r;
    }
  }
  return null;
}

/* ---------- BuildFile -> fileRef ---------- */
const bfRe = /([0-9A-F]{24})\s*\/\*[^*]*\*\/\s*=\s*\{\s*isa\s*=\s*PBXBuildFile;\s*fileRef\s*=\s*([0-9A-F]{24})/g;
const buildFiles = {};
while ((m = bfRe.exec(text)) !== null) buildFiles[m[1]] = m[2];

function phaseFiles(isa) {
  const re = new RegExp(isa + ';[\\s\\S]*?files\\s*=\\s*\\(([\\s\\S]*?)\\);', 'g');
  const out = [];
  while ((m = re.exec(text)) !== null) out.push(...(m[1].match(/[0-9A-F]{24}/g) || []));
  return out;
}
const sourcesBF = phaseFiles('PBXSourcesBuildPhase');
const resourcesBF = phaseFiles('PBXResourcesBuildPhase');

/* ---------- 正向核对 ---------- */
const referencedOnDisk = new Set();
for (const [frId, rel] of Object.entries(fileRefs)) {
  if (rel === 'WATransChat.app') continue;
  const resolved = resolveFileRef(frId, rootGroupId, '') || rel;
  const abs = path.join(PROJECT_DIR, resolved);
  if (!fs.existsSync(abs)) {
    failures.push(`引用文件缺失: ${frId} -> ${resolved}`);
  } else {
    referencedOnDisk.add(path.normalize(resolved).replace(/\\/g, '/'));
  }
}

/* ---------- 反向核对（相对项目根） ---------- */
function walk(dir, base, acc) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(PROJECT_DIR, full).replace(/\\/g, '/');
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'Assets.xcassets') { referencedOnDisk.add('WATransChat/Assets.xcassets'); continue; }
      walk(full, base, acc);
    } else {
      acc.push(rel);
    }
  }
  return acc;
}
const onDisk = walk(SRC_DIR, '', []);
for (const rel of onDisk) {
  if (rel.startsWith('WATransChat/Assets.xcassets/')) continue; // 资产目录整体引用
  if (rel === 'WATransChat/Info.plist') continue;                 // INFOPLIST_FILE 引用
  if (!referencedOnDisk.has(rel)) failures.push(`磁盘文件未被 pbxproj 引用: ${rel}`);
}

/* ---------- buildFile 交叉核对 ---------- */
for (const [bf, fr] of Object.entries(buildFiles)) {
  if (!fileRefs[fr]) failures.push(`buildFile ${bf} 指向不存在的 fileRef ${fr}`);
}
for (const bf of [...sourcesBF, ...resourcesBF]) {
  if (!buildFiles[bf]) failures.push(`构建阶段引用了未声明的 buildFile ${bf}`);
}

/* ---------- 统计 ---------- */
console.log('=== pbxproj 统计 ===');
console.log('PBXFileReference 总数:', Object.keys(fileRefs).length);
console.log('PBXBuildFile 总数:', Object.keys(buildFiles).length);
console.log('Sources 阶段文件数:', sourcesBF.length);
console.log('Resources 阶段文件数:', resourcesBF.length);
console.log('磁盘应打包文件数(不含资产目录/Info.plist):',
  onDisk.filter(r => !r.startsWith('WATransChat/Assets.xcassets/') && r !== 'WATransChat/Info.plist').length);

console.log('\n=== 正向：引用 -> 磁盘（相对项目根） ===');
for (const [frId, rel] of Object.entries(fileRefs)) {
  console.log(`  ${frId}  ${resolveFileRef(frId, rootGroupId, '') || rel}`);
}
console.log('\n=== 结果 ===');
if (failures.length) {
  console.log('FAILURES:');
  failures.forEach(f => console.log('  [X] ' + f));
  process.exit(1);
} else {
  console.log('PBXPROJ_CONSISTENCY_OK');
}

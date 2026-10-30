# WATransChat · WhatsApp 跨语言智能翻译助手

给 **WhatsApp Web（web.whatsapp.com）** 用的实时双向翻译工具，面向外贸沟通。一套核心注入脚本（`shared-core`），同时交付：

- **浏览器扩展**：Chrome / Edge（Manifest V3），可直接「加载已解压」。
- **iOS 端**：完整 Swift + WKWebView 工程，用 Mac 的 Xcode 打开即可编译到 iPhone / TestFlight。

> 工作原理：扩展（或 iOS 的 WKWebView 壳）打开 web.whatsapp.com 后，注入同一套纯 JS 核心，监听页面里的消息气泡，自动在原文下方插入译文，并提供输入翻译发送、国家信息条、快捷短语、待办、快速聊天等功能。仅翻译可见内容，不收集任何数据。

---

## 一、目录结构

```
外贸翻译软件/
├─ shared-core/                 # 两端共用的核心注入脚本（纯 JS，零构建依赖）
│  ├─ inject.js                 # 主入口
│  ├─ core/   config.js storage.js utils.js net.js
│  ├─ modules/ translate.js messages.js countryBar.js chatList.js
│  │          quickPhrase.js quickChat.js todo.js aiStaff.js settingsPanel.js
│  ├─ data/   countries.js      # 国际区号→国家/语言/货币/时区（≥200 条）
│  ├─ translators/ google.js bing.js volcano.js deepl.js
│  └─ styles.css
├─ browser-extension/           # Chrome/Edge MV3 扩展
│  ├─ manifest.json background.js content.js
│  ├─ shared-core/              # 核心副本（集成时复制，扩展必须自包含）
│  ├─ popup/                    # 工具栏弹窗
│  ├─ options/                  # 翻译设置页
│  └─ icons/
├─ ios/WATransChat/             # iOS Xcode 工程
│  ├─ WATransChat.xcodeproj/
│  ├─ WATransChat/  (Swift + share/wtc.combined.js)
│  ├─ build-combined.js
│  └─ README-编译说明.md
├─ WATransChat.zip              # 浏览器扩展打包（解压后可加载）
└─ README-安装与使用.md          # 本文件
```

---

## 二、Chrome / Edge 安装（浏览器扩展）

### 方式 A：加载已解压（推荐，免打包）

1. 打开 Chrome，地址栏输入 `chrome://extensions` 并回车；Edge 用 `edge://extensions`。
2. 打开右上角 / 左下角的 **「开发者模式」**。
3. 点击 **「加载已解压的扩展程序」**。
4. 选择本目录下的 **`browser-extension`** 文件夹（即包含 `manifest.json` 的那一层）。
5. 列表出现「WATransChat - WhatsApp 智能翻译」即安装成功。
6. 打开或刷新 **https://web.whatsapp.com**，按页面提示扫码登录，即可看到：
   - 聊天顶部的国家信息条（号码 + 国家 + 语言/货币/当地时间）；
   - 每条消息下方的译文；
   - 输入框旁的「翻译并发送 / 快捷短语 / 语音」按钮。

> 若用的是 `WATransChat.zip`：先解压，再按上面第 3–4 步选择解压出的文件夹即可。

### 方式 B：固定到工具栏

点击浏览器右上角的扩展（拼图）图标，把 WATransChat「图钉」固定，方便随时点开关、进入设置。

---

## 三、翻译设置（options）

- 点击工具栏 WATransChat 图标 → **「打开翻译设置」**；或在扩展页点「详细信息 → 扩展程序选项」。
- 可配置：
  - **您的语言**（默认中文简体）；
  - **全局翻译引擎**（默认谷歌翻译，可换微软 / 火山 / DeepL）；
  - **译文颜色**（圆点 → 调色板，默认蓝色 `#2563eb`）；
  - **自动发送译文**（开启后回车即先翻译再发送）；
  - **网页 DOM 检查**、**译文位置**（下方 / 右侧 / 仅译文）、**分屏翻译**；
  - 引擎密钥、快捷短语、待办、导入 / 导出配置。

---

## 四、翻译引擎与密钥配置

| 引擎 | 是否免费 | 说明 |
|---|---|---|
| 谷歌翻译 | 免费（默认） | 客户端端点 `translate.googleapis.com`，无需密钥。 |
| 微软翻译 | 免费 | 自动抓取临时 token，免密钥；个别网络环境可能不可用，会自动降级。 |
| 火山引擎 | 需密钥 | 在「翻译设置 → 引擎 key」填写 **AccessKeyId / SecretAccessKey / region**。 |
| DeepL | 需密钥 | 填写 **API Key**，并选择免费版 / 专业版对应端点。 |

**配置步骤：**
1. 火山引擎：登录火山引擎控制台 → 访问控制 → 访问密钥，创建并复制 AccessKeyId / SecretAccessKey，填入设置页；region 默认为 `cn-north-1`。
2. DeepL：在 deepl.com/pro-api 或免费版申请 API Key，填入设置页；免费账号勾选「免费版」。
3. 任一引擎请求失败时，核心会自动重试并降级到可用引擎（默认回退谷歌 / 微软）。

> 浏览器扩展的跨域请求统一由后台 Service Worker 发起（已在 `host_permissions` 中声明相关域名），无需额外配置。

---

## 五、iOS 安装（iPhone）

Windows 无法直接编译 `.ipa`，但工程已完整提供。在任意一台 **Mac** 上操作：

1. 安装 **Xcode**（Mac App Store）。
2. 双击打开 `ios/WATransChat/WATransChat.xcodeproj`。
3. 在 TARGETS → Signing & Capabilities 选择你自己的 Apple ID 团队（免费 Apple ID 也可真机调试，证书 7 天有效；上架 TestFlight 需付费开发者账号）。
4. 连接 iPhone，选择设备后点 ▶️ 运行；首次运行在 iPhone「设置 → 通用 → VPN与设备管理」信任你的开发者证书。
5. 上架 TestFlight / 详细图文流程见 **`ios/WATransChat/README-编译说明.md`**。

> 若更新了根目录 `shared-core`，在 Mac（或本机）重新运行 `node build-combined.js` 即可把最新核心合并进 `ios/WATransChat/WATransChat/share/wtc.combined.js`。

---

## 六、通话实时翻译（电话同声传译）

**它是什么**：浏览器扩展无法直接读取 WhatsApp 通话的 WebRTC 加密音频，所以本功能是一个独立的「通话同声传译」全屏面板——接通 WhatsApp/电话后打开面板，它实时听译双方说话、显示双语字幕并朗读译文。

**使用步骤（Chrome / Edge）**
1. 先在 WhatsApp 正常发起或接听语音 / 视频通话，并把通话设为**免提（扬声器）**，让双方声音外放。
2. 回到聊天界面，点顶部右侧的**电话听筒图标**（或扩展 popup 里的「通话翻译」）打开黑色通话面板。
3. 顶部确认「我的语言（中文）」与「客户语言（如英语）」，点绿色「开始翻译」。
4. 首次会提示「正在录制通话内容，请确保合法使用并保护隐私」，点「同意并开始」，并在浏览器弹窗中**允许使用麦克风**。
5. 双方说话后出现双语字幕：我方绿色气泡靠右、对方深色气泡靠左；默认自动朗读译文。
6. 底部按钮：译（翻译开关）、视频（仅提示）、扬声器（红叉=听筒）、静音（红叉=暂停采集）、红色挂断（关闭面板并清理）。
7. 若麦克风打不开：点地址栏左侧 🔒 图标 → 允许麦克风；或在 Windows「设置 → 隐私和安全性 → 麦克风」中允许桌面应用使用，然后刷新重试。

**使用步骤（iOS）**
- 打开通话面板后允许「麦克风 / 语音识别」权限；交互与浏览器一致；原生用 Speech 框架做识别与朗读。

**音色**：可在面板或设置中选择「对方听 男声/女声」「我方听 男声/女声」。

---

## 七、功能清单

1. 实时双向翻译（对方消息译成中文、自己消息显示中文原意；颜色/位置可配）
2. 输入翻译并发送（自动发送 或 手动「翻译并发送」）
3. 顶部国家信息条（号码 / 国家 / 语言 / 货币 / 当地时间 / 最后上线）
4. 会话列表国家名标注 + 筛选标签
5. 翻译记忆与按联系人语言偏好
6. 客户语言设置弹窗
7. 多翻译引擎（谷歌 / 微软 / 火山 / DeepL，统一接口，缓存/重试/降级）
8. 快捷短语库（可增删改，外贸模板）
9. 快速聊天（输入号码直接发起，不存通讯录）
10. 待办提醒（到点通知）
11. AI 员工 / 自动回复（完整 UI，可接自定义 API）
12. 翻译设置页（高度还原）
13. 会员 / 账户信息页
14. 语音输入转文字并翻译发送
15. 多账号标签页入口
16. 通话实时翻译（独立同声传译面板，双语字幕 + 双音色朗读）

---

## 八、隐私

- 仅在你打开 web.whatsapp.com 时，对当前可见的消息文本调用翻译接口进行翻译；通话翻译仅在你主动开启面板并授权麦克风后才进行本地识别。
- 所有设置（语言偏好、短语、待办、通话偏好）保存在你本地（`chrome.storage` / iOS 沙盒），不上传、不收集。
- 通话录音/识别在本地处理，挂断或关闭面板即停止并释放麦克风，不保存录音。
- 若你配置了第三方引擎（火山 / DeepL），译文会按该引擎的服务条款发送到对应服务商。
- 请在合法、取得对方知情的前提下使用通话翻译。

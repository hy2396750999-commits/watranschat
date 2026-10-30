# WATransChat iOS 工程 · Mac / Xcode 编译上架说明

本目录是 WATransChat 的 iPhone（兼容 iPad）原生工程：一个 WKWebView 壳加载
`https://web.whatsapp.com`，在 `documentStart` 注入与浏览器扩展完全相同的
shared-core JS（合并产物 `WATransChat/share/wtc.combined.js`），并通过原生桥
`wtcNative` 提供配置读写与跨域 HTTP。

> 当前在 Windows 上无法编译 `.ipa`；本工程已在离线侧完成引用一致性、JS 语法、
> plist / JSON 合法性自检，拿到 Mac 后用 Xcode 直接打开即可编译。

---

## 一、目录结构

```
ios\WATransChat\
├─ WATransChat.xcodeproj\
│  └─ project.pbxproj                 # Xcode 工程文件（objectVersion 56）
├─ WATransChat\
│  ├─ App.swift                       # @main + AppDelegate（UIKit 生命周期）
│  ├─ SceneDelegate.swift             # 程序化创建 window，根视图 ViewController
│  ├─ ViewController.swift            # WKWebView + WKUserScript(.page) + 原生桥
│  ├─ SettingsViewController.swift     # 原生设置页（读写同一份 wtc_config_v1）
│  ├─ ConfigStore.swift               # 沙盒 KV 配置读写（Documents/wtc_store.json）
│  ├─ Info.plist                      # 权限 / Scene Manifest / ATS
│  ├─ Localizable.strings             # 中英文案参考
│  ├─ Assets.xcassets\                # AppIcon + AccentColor(#00A884)
│  └─ share\
│     ├─ native-bridge.js             # iOS 原生桥 shim（page world 最先执行）
│     ├─ wtc.combined.js              # 合并注入脚本（build-combined.js 生成）
│     └─ styles.css                   # 从 shared-core 复制的样式
├─ build-combined.js                  # Node 合并脚本（重新生成 wtc.combined.js）
├─ tools\
│  ├─ make-icons.py                   # AppIcon 再生成脚本（Pillow）
│  └─ check-pbxproj.js                 # pbxproj 离线一致性核对
└─ README-编译说明.md
```

## 二、环境要求（Mac）

- macOS 13+ / Xcode 15+（工程 deployment target = iOS 15.0，Swift 5.0）
- 一台 iPhone（iOS 15+）用于真机调试；模拟器可启动但扫码登录建议真机
- Apple ID（免费即可真机调试；上架需付费开发者账号 $99/年）

## 三、打开工程

1. 把整个 `ios\WATransChat` 文件夹拷贝到 Mac（保持内部相对路径不变）。
2. 双击 `WATransChat.xcodeproj`，Xcode 自动索引。
3. 首次打开若提示 "Update to recommended settings"，点 **Perform Release** 即可，
   不要改动 INFOPLIST_FILE / SWIFT_VERSION。

## 四、签名配置

1. 左侧选中项目 **WATransChat** → **TARGETS → WATransChat → Signing & Capabilities**。
2. 勾选 **Automatically manage signing**。
3. **Team** 选择自己的 Apple ID（没有就 Add Account 登录）。
4. **Bundle Identifier** 默认 `com.watranschat.app`，上架前改成自己的唯一标识，
   例如 `com.你的公司.watranschat`。

## 五、真机运行

1. 顶部设备选自己的 iPhone（先在手机上登录同一 Apple ID 并信任开发者）。
2. 手机连接数据线（或同一局域网无线调试），点 ▶️ Run（⌘R）。
3. 首次安装后：设置 → 通用 → VPN与设备管理 → 信任开发者证书。
4. App 打开后加载 WhatsApp Web，扫码登录即可使用翻译功能。
5. 顶部工具条：🔄 刷新、🗂 历史/标签、⚙️ 设置（您的语言 / 全局引擎 / 自动发送 /
   译文颜色 / 火山 / DeepL / AI 密钥）。

## 六、重新生成注入脚本（shared-core 更新后）

shared-core 改动后，在 `ios\WATransChat` 目录运行（Node 18+）：

```bash
node build-combined.js
```

脚本按 `inject.js` 声明的顺序合并：native-bridge.js → styles.css(包成
`window.__WTC_CSS__`) → core/config,storage,utils,net → data/countries →
translators/google,bing,volcano,deepl → modules/translate,messages,countryBar,
chatList,quickPhrase,quickChat,todo,aiStaff,settingsPanel → inject.js，
输出覆盖 `WATransChat/share/wtc.combined.js`。重新编译 App 即生效。

## 七、TestFlight 上架流程

1. **Archive**：设备选 `Any iOS Device (arm64)`，菜单 **Product → Archive**。
2. Organizer 中选中归档 → **Distribute App → App Store Connect → Upload**。
3. 登录 [App Store Connect](https://appstoreconnect.apple.com) 填写版本信息、
   截图、隐私政策 URL、年龄分级，提交审核。
4. 审核通过后在 App Store 发布；TestFlight 可先内部测试（最多 10000 人）。

### 上架注意
- `NSCameraUsageDescription / NSMicrophoneUsageDescription /
  NSSpeechRecognitionUsageDescription / NSPhotoLibraryUsageDescription`
  已写中文说明（通话同声传译需要麦克风 + 语音识别），提交时按商店语言补英文文案。
- ATS 已开 `NSAllowsArbitraryLoads`（WhatsApp Web 及翻译接口需要），审核可能
  询问，说明用于加载 WhatsApp Web 与第三方翻译接口即可。
- 隐私清单（PrivacyInfo.xcprivacy）上架前建议补一份，声明 WKWebView /
  网络接口用途。

## 八、原生桥协议（供后续维护）

JS 侧 `window.WTCNative`：

| action | args | 原生返回 |
|---|---|---|
| get | `{key}` | 沙盒 KV 值（一般 key = `wtc_config_v1`） |
| set | `{key, value}` | `true` |
| http | `{url, method, headers, body}` | `{ok, status, body, headers}`，失败 `{error}` |
| startCallASR | `{myLang, clientLang}` | 启动双路识别；结果走 `window.__wtcCallASR(side, isFinal, text)` |
| stopCallASR | `{}` | 停止识别 |
| speak | `{text, lang, gender}` | 朗读（gender=male/female） |
| stopSpeak | `{}` | 停止朗读 |
| setMuted | `{muted}` | 静音切换 |

原生通过 `window.__wtcNativeCallback(id, result, error)` 回传；识别结果与错误
通过 `window.__wtcCallASR(side, isFinal, text)`、`window.__wtcCallError(where, message)`
主动推送。消息通道名 `wtcNative`，注册在 `.page` contentWorld，与注入脚本同世界。
通话原生实现见 `CallSpeechManager.swift`（SFSpeechRecognizer + AVAudioEngine +
AVSpeechSynthesizer）。

## 九、已完成的离线自检

- `node build-combined.js` 生成 `wtc.combined.js`，`node --check` 通过。
- `tools/check-pbxproj.js`：PBXFileReference 12 个、Sources 6、Resources 5，
  引用与落盘文件双向核对一致（PBXPROJ_CONSISTENCY_OK）。
- `Info.plist` plistlib 解析通过（含语音识别权限）；3 个 Contents.json JSON 解析通过。
- Swift 因 Windows 无法编译，已逐文件人工核对 API（.page world 注入、
  contentWorld 消息桥、媒体权限回调、URLSession 桥、SFSpeechRecognizer/AVAudioEngine）。

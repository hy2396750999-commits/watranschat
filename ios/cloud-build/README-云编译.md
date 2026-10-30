# 云编译 WATransChat ipa（两条路，任选其一）

本目录包含把 iOS 工程编译成 .ipa 的全部配置。编译必须用 macOS（Xcode），本机是 Windows，
所以走下面任一通道产出 **未签名 ipa**，再用爱思助手「IPA 签名」签名安装到手机。

## 路 A：GitHub Actions（有 GitHub 账号即可，推荐）

1. 新建一个 GitHub 仓库（公开或私有均可），把 `D:\电脑软件\外贸翻译软件` 整个文件夹推上去
   （推送命令：`git init && git add -A && git commit -m "WATransChat" && git remote add origin <你的仓库地址> && git push -u origin main`）。
   注意 `.github/workflows/build-ipa.yml` 必须随仓库一起推送（在仓库根）。
2. 在 GitHub 仓库页面点 **Actions** → 左侧 **Build WATransChat IPA** → **Run workflow**。
3. 等 5–10 分钟，构建完成后进入该次运行的 **Artifacts**，下载 `WATransChat-unsigned-ipa`，
   解压得到 `WATransChat-unsigned.ipa`，放到本机任意位置。
4. 把 ipa 路径告诉我，我直接用爱思助手签名+安装进手机。
   - 私有仓库 macOS 构建会产生少量费用（约 ¥0.6/分钟，一次构建约 5–10 分钟）；公开仓库免费。
   - 若不想付费，用路 B（Codemagic 每月 500 分钟免费）。

## 路 B：Codemagic（私有项目免费 500 分钟/月）

1. 注册 codemagic.io（邮箱即可，免费档每月 500 分钟 macOS 构建）。
2. 连接 GitHub（把仓库设为私有也不影响免费额度），导入该仓库。
3. 配置时选择 **iOS 原生项目**，构建命令填：
   ```
   xcodebuild -project ios/WATransChat/WATransChat.xcodeproj -target WATransChat -configuration Release -sdk iphoneos -derivedDataPath build/DerivedData CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO build
   ```
   并在构建后脚本打包：
   ```
   APP_PATH=$(find build/DerivedData/Build/Products/Release-iphoneos -maxdepth 1 -name "*.app" -type d | head -n 1)
   mkdir -p ipa/Payload && cp -R "$APP_PATH" ipa/Payload/ && cd ipa && zip -qr WATransChat-unsigned.ipa Payload
   ```
   产物会出现在构建的 Artifacts 里。
4. 下载 `WATransChat-unsigned.ipa` 放到本机，路径告诉我，我负责签名+安装。

## 路 C：手头有 Mac

把 `D:\电脑软件\外贸翻译软件\ios\WATransChat` 拷贝到 Mac，终端执行：
```
chmod +x build-ipa-local.sh && ./build-ipa-local.sh
```
产出 `WATransChat-unsigned.ipa`，传回本机，路径告诉我即可。

## 拿到未签名 ipa 之后（我来做）

1. 爱思助手 → 工具箱 → **IPA 签名** → 导入 ipa。
2. 用你的 Apple ID 免费签名（首次需在手机上输入 Apple ID 密码确认，7 天有效，到期重新签一次即可；爱思助手可勾选自动续签）。
3. 签名成功后点安装，iPhone 8 Plus 上即可出现 WATransChat 图标。

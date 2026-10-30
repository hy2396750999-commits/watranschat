#!/bin/bash
# 在 Mac 上编译 WATransChat 未签名 ipa
# 用法: chmod +x build-ipa-local.sh && ./build-ipa-local.sh
# 产物: WATransChat-unsigned.ipa（未签名，供爱思助手「IPA 签名」后安装）
set -euxo pipefail
cd "$(dirname "$0")"

xcodebuild -project WATransChat.xcodeproj \
  -target WATransChat \
  -configuration Release \
  -sdk iphoneos \
  -derivedDataPath build/DerivedData \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO \
  build

APP_PATH=$(find build/DerivedData/Build/Products/Release-iphoneos -maxdepth 1 -name "*.app" -type d | head -n 1)
mkdir -p ipa/Payload
cp -R "$APP_PATH" ipa/Payload/
cd ipa
zip -qr WATransChat-unsigned.ipa Payload
cd ..
echo "完成: $(pwd)/ipa/WATransChat-unsigned.ipa"

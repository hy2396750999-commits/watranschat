/* =====================================================================
 * WATransChat shared-core · translators/volcano.js
 * 火山引擎机器翻译（机器翻译 2020-06-01，TranslateText）。
 * 使用 state.engines.volcano 的 accessKeyId/secretAccessKey/region/host，
 * 按火山签名 V4（HMAC-SHA256，WebCrypto crypto.subtle）签名。
 * 密钥为空直接 reject，交由降级逻辑接管。
 * 纯 JS，挂载到 window.WTC.engines.volcano，网络一律走 WTC.net.http。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};
  WTC.engines = WTC.engines || {};

  var SERVICE = 'translate';
  var VERSION = '2020-06-01';
  var ACTION = 'TranslateText';

  /* ---- WebCrypto 基础工具 ---- */
  function toBytes(str) {
    return new TextEncoder().encode(str);
  }
  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }
  function sha256Hex(str) {
    return crypto.subtle.digest('SHA-256', toBytes(str)).then(hex);
  }
  function hmac(keyBytes, msg) {
    return crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then(function (k) { return crypto.subtle.sign('HMAC', k, toBytes(msg)); });
  }

  /* 签名密钥派生：secret -> date -> region -> service -> request */
  function deriveSigningKey(secret, date, region, service) {
    return hmac(toBytes(secret), date)
      .then(function (k1) { return hmac(k1, region); })
      .then(function (k2) { return hmac(k2, service); })
      .then(function (k3) { return hmac(k3, 'request'); });
  }

  /* 火山语言码：简繁都归并为 zh；auto 时省略 SourceLanguage */
  function mapSrc(l) {
    if (!l || l === 'auto') return '';
    if (l === 'zh-CN' || l === 'zh-TW' || l === 'zh-Hans' || l === 'zh-Hant') return 'zh';
    return l;
  }
  function mapTgt(l) {
    if (!l) return '';
    if (l === 'zh-CN' || l === 'zh-TW' || l === 'zh-Hans' || l === 'zh-Hant') return 'zh';
    return l;
  }

  WTC.engines.volcano = {
    id: 'volcano',
    name: '火山引擎翻译',
    /* translate(text, from, to, state) -> Promise<string> */
    translate: function (text, from, to, state) {
      var cfg = (state && state.engines && state.engines.volcano) || {};
      if (!cfg.accessKeyId || !cfg.secretAccessKey) {
        return Promise.reject(new Error('请在设置中填写火山引擎 AccessKey/SecretKey'));
      }
      if (!crypto || !crypto.subtle) {
        return Promise.reject(new Error('当前环境不支持 WebCrypto 签名（需安全上下文），火山引擎不可用'));
      }

      var region = cfg.region || 'cn-north-1';
      var host = cfg.host || 'open.volcengineapi.com';

      var bodyObj = { TextList: [text] };
      var src = mapSrc(from);
      if (src) bodyObj.SourceLanguage = src;
      var tgt = mapTgt(to);
      if (tgt) bodyObj.TargetLanguage = tgt;
      var bodyStr = JSON.stringify(bodyObj);

      var now = new Date();
      var xDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); // YYYYMMDDTHHMMSSZ
      var shortDate = xDate.slice(0, 8);
      var scope = shortDate + '/' + region + '/' + SERVICE + '/request';
      var query = 'Action=' + ACTION + '&Version=' + VERSION; // 已按字母序

      return sha256Hex(bodyStr).then(function (payloadHash) {
        /* 规范请求 */
        var canonicalReq = [
          'POST',
          '/',
          query,
          'host:' + host,
          'x-date:' + xDate,
          '',
          'host;x-date',
          payloadHash
        ].join('\n');
        return sha256Hex(canonicalReq).then(function (reqHash) {
          var stringToSign = ['HMAC-SHA256', xDate, scope, reqHash].join('\n');
          return deriveSigningKey(cfg.secretAccessKey, shortDate, region, SERVICE)
            .then(function (kSigning) { return hmac(kSigning, stringToSign); })
            .then(function (sigBuf) {
              var authorization = 'HMAC-SHA256 Credential=' + cfg.accessKeyId + '/' + scope +
                ', SignedHeaders=host;x-date, Signature=' + hex(sigBuf);
              return WTC.net.http('https://' + host + '/?' + query, {
                method: 'POST',
                headers: {
                  'Host': host,
                  'Content-Type': 'application/json; charset=UTF-8',
                  'X-Date': xDate,
                  'Authorization': authorization
                },
                body: bodyStr
              });
            });
        });
      }).then(function (r) {
        var data = JSON.parse(r.body);
        if (data.ResponseMetadata && data.ResponseMetadata.Error) {
          throw new Error('火山引擎：' + data.ResponseMetadata.Error.Message);
        }
        var list = data.Result && data.Result.TranslationList;
        if (!list || !list[0] || !list[0].Translation) {
          throw new Error('火山引擎返回格式异常');
        }
        return list[0].Translation;
      });
    }
  };
})();

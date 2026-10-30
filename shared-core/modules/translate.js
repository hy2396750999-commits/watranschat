/* =====================================================================
 * WATransChat shared-core · modules/translate.js
 * 翻译编排：统一入口 translate(text,from,to,engine)；带缓存、并发去重、
 * 失败重试、引擎降级、超长分段。引擎实现挂在 WTC.engines。
 * ===================================================================== */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var WTC = root.WTC = root.WTC || {};

  WTC.engines = WTC.engines || {};

  var cache = new Map();           // key -> 译文
  var inflight = new Map();        // key -> Promise
  var MAX_CACHE = 3000;
  var SEG_LEN = 1200;              // 超长文本分段长度（字符）

  function cacheKey(engine, from, to, text) {
    return engine + '|' + (from || 'auto') + '|' + to + '|' + text;
  }
  function putCache(k, v) {
    if (cache.size >= MAX_CACHE) {
      var firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(k, v);
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* 调用单个引擎，带重试 */
  function callEngine(engine, text, from, to, tries) {
    var impl = WTC.engines[engine];
    if (!impl) return Promise.reject(new Error('引擎不存在: ' + engine));
    var attempt = 0;
    function go() {
      return Promise.resolve()
        .then(function () { return impl.translate(text, from || 'auto', to, WTC.state); })
        .catch(function (err) {
          attempt++;
          if (attempt < tries) return sleep(200 * attempt).then(go);
          throw err;
        });
    }
    return go();
  }

  /* 分段 + 合并（按句尽量在标点处切，避免破坏语义） */
  function splitSegments(text) {
    if (text.length <= SEG_LEN) return [text];
    var segs = [], rest = text;
    while (rest.length > SEG_LEN) {
      var cut = rest.lastIndexOf('\n', SEG_LEN);
      if (cut < SEG_LEN * 0.5) cut = rest.lastIndexOf('. ', SEG_LEN);
      if (cut < SEG_LEN * 0.5) cut = rest.lastIndexOf('。', SEG_LEN);
      if (cut < SEG_LEN * 0.5) cut = SEG_LEN;
      segs.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    if (rest) segs.push(rest);
    return segs;
  }

  /* 带降级的单次翻译（不做分段） */
  function oneWithFallback(engine, text, from, to) {
    var order = [engine];
    if (engine !== 'google') order.push('google');
    if (engine !== 'bing') order.push('bing');
    var lastErr;
    return order.reduce(function (p, eng) {
      return p.catch(function (e) {
        lastErr = e;
        return callEngine(eng, text, from, to, 2);
      });
    }, Promise.reject(new Error('init'))).catch(function () {
      throw lastErr || new Error('所有引擎均失败');
    });
  }

  /* 核心：translate */
  function translate(text, from, to, engine) {
    text = String(text == null ? '' : text).trim();
    if (!text) return Promise.resolve('');
    if (!to) return Promise.resolve(text);
    var eng = engine || (WTC.state && WTC.state.engine) || 'google';
    var k = cacheKey(eng, from, to, text);
    if (cache.has(k)) return Promise.resolve(cache.get(k));
    if (inflight.has(k)) return inflight.get(k);

    var segs = splitSegments(text);
    var p = segs.reduce(function (chain, seg) {
      return chain.then(function (acc) {
        return oneWithFallback(eng, seg, from, to).then(function (tr) {
          return acc + tr;
        });
      });
    }, Promise.resolve(''))
      .then(function (result) {
        result = result.trim();
        putCache(k, result);
        inflight.delete(k);
        return result;
      })
      .catch(function (err) {
        inflight.delete(k);
        throw err;
      });

    inflight.set(k, p);
    return p;
  }

  /* 批量：串行处理一组 {text,from,to,engine}，返回等长结果数组 */
  function translateMany(items) {
    return items.reduce(function (chain, it) {
      return chain.then(function (acc) {
        return translate(it.text, it.from, it.to, it.engine)
          .then(function (r) { acc.push(r); return acc; })
          .catch(function () { acc.push(null); return acc; });
      });
    }, Promise.resolve([]));
  }

  WTC.translator = {
    translate: translate,
    translateMany: translateMany,
    clearCache: function () { cache.clear(); inflight.clear(); },
    cacheSize: function () { return cache.size; }
  };
})();

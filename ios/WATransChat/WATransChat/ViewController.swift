/* =====================================================================
 * WATransChat iOS · ViewController.swift
 * WKWebView 壳：加载 https://web.whatsapp.com，documentStart 注入
 * share/wtc.combined.js（page world），并通过 WKScriptMessageHandler
 * "wtcNative" 暴露 get / set / http 原生桥。
 * ===================================================================== */

import UIKit
import WebKit

final class ViewController: UIViewController {

    private var webView: WKWebView!
    private var toolbar: UIToolbar!
    private let callSpeech = CallSpeechManager.shared

    private static let homeURL = URL(string: "https://web.whatsapp.com")!

    // MARK: - 生命周期

    override func loadView() {
        view = UIView()
        view.backgroundColor = .systemBackground
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        setupToolbar()
        layout()
        webView.load(URLRequest(url: Self.homeURL))
    }

    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
        layout()
    }

    private func layout() {
        let topInset = view.safeAreaInsets.top
        let barHeight: CGFloat = 44
        toolbar.frame = CGRect(x: 0, y: topInset, width: view.bounds.width, height: barHeight)
        webView.frame = CGRect(x: 0, y: topInset + barHeight,
                               width: view.bounds.width,
                               height: view.bounds.height - topInset - barHeight)
    }

    // MARK: - 初始化

    private func setupWebView() {
        let config = WKWebViewConfiguration()

        let prefs = WKPreferences()
        prefs.javaScriptCanOpenWindowsAutomatically = true
        config.preferences = prefs
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = .default()

        // 注入合并脚本：documentStart、主框架与子框架都注入、page world
        if let scriptURL = Bundle.main.url(forResource: "wtc.combined", withExtension: "js"),
           let source = try? String(contentsOf: scriptURL, encoding: .utf8) {
            let userScript = WKUserScript(source: source,
                                          injectionTime: .atDocumentStart,
                                          forMainFrameOnly: false,
                                          in: .page)
            config.userContentController.addUserScript(userScript)
        } else {
            NSLog("[WTC] 警告：bundle 中未找到 wtc.combined.js")
        }

        // 原生桥：与 page world 中的 webkit.messageHandlers.wtcNative 对应
        config.userContentController.add(self, contentWorld: .page, name: "wtcNative")

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        view.addSubview(webView)
    }

    private func setupToolbar() {
        toolbar = UIToolbar()
        toolbar.tintColor = UIColor(red: 0/255, green: 168/255, blue: 132/255, alpha: 1)
        let refresh = UIBarButtonItem(barButtonSystemItem: .refresh,
                                      target: self,
                                      action: #selector(refreshTapped))
        let flexible = UIBarButtonItem(barButtonSystemItem: .flexibleSpace, target: nil, action: nil)
        let tabs = UIBarButtonItem(image: UIImage(systemName: "square.on.square"),
                                   style: .plain, target: self, action: #selector(tabsTapped))
        let settings = UIBarButtonItem(image: UIImage(systemName: "gearshape"),
                                       style: .plain, target: self, action: #selector(settingsTapped))
        toolbar.items = [refresh, flexible, tabs, settings]
        view.addSubview(toolbar)
    }

    // MARK: - 工具条动作

    @objc private func refreshTapped() {
        webView.reload()
    }

    @objc private func settingsTapped() {
        let vc = SettingsViewController()
        vc.onSaved = { [weak self] in self?.refreshInjectedState() }
        navigationController?.pushViewController(vc, animated: true)
    }

    /// 移动端多标签（尽力实现）：列出前进/后退历史条目，点击跳转
    @objc private func tabsTapped() {
        let list = webView.backForwardList
        var entries = list.backList + [list.currentItem].compactMap { $0 }
        if let forward = list.forwardList.last { entries.append(forward) }

        let alert = UIAlertController(title: "标签 / 历史", message: nil, preferredStyle: .actionSheet)
        for item in entries.suffix(12) {
            let title = (item.title?.isEmpty == false ? item.title! : item.url.absoluteString)
            alert.addAction(UIAlertAction(title: title, style: .default, handler: { [weak self] _ in
                self?.webView.load(item)
            }))
        }
        alert.addAction(UIAlertAction(title: "回到 WhatsApp", style: .default, handler: { [weak self] _ in
            self?.webView.load(URLRequest(url: Self.homeURL))
        }))
        alert.addAction(UIAlertAction(title: "取消", style: .cancel))
        if let pop = alert.popoverPresentationController {
            pop.barButtonItem = toolbar.items?[2]
        }
        present(alert, animated: true)
    }

    /// 原生设置保存后，把最新 state 推给注入层并广播 config-changed
    private func refreshInjectedState() {
        guard let state = ConfigStore.shared.get(ConfigStore.storeKey),
              let data = try? JSONSerialization.data(withJSONObject: state),
              let json = String(data: data, encoding: .utf8) else { return }
        let js = """
        if (window.WTC && window.WTC.state) {
          window.WTC.state = window.WTC.config.deepMerge(window.WTC.config.DEFAULTS, \(json));
          document.dispatchEvent(new CustomEvent('wtc:config-changed', { detail: window.WTC.state }));
        }
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    // MARK: - 原生桥回调

    private func jsArg(_ value: Any?) -> String {
        guard let v = value else { return "undefined" }
        if JSONSerialization.isValidJSONObject(v),
           let data = try? JSONSerialization.data(withJSONObject: v, options: []),
           let s = String(data: data, encoding: .utf8) {
            return s
        }
        if let s = v as? String,
           let data = try? JSONSerialization.data(withJSONObject: [s], options: []),
           let out = String(data: data, encoding: .utf8) {
            return out
        }
        if let n = v as? NSNumber { return n.stringValue }
        return "undefined"
    }

    private func callback(id: String, result: Any?, error: String?) {
        let js = "window.__wtcNativeCallback(\(jsArg(id)), \(jsArg(result)), \(jsArg(error)));"
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    private func handleGet(args: [String: Any], id: String) {
        let key = args["key"] as? String ?? ""
        callback(id: id, result: ConfigStore.shared.get(key), error: nil)
    }

    private func handleSet(args: [String: Any], id: String) {
        let key = args["key"] as? String ?? ""
        ConfigStore.shared.set(key, value: args["value"])
        callback(id: id, result: true, error: nil)
    }

    private func handleHttp(args: [String: Any], id: String) {
        guard let urlStr = args["url"] as? String, let url = URL(string: urlStr) else {
            callback(id: id, result: ["error": "无效的 url"], error: nil)
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = (args["method"] as? String) ?? "GET"
        if let headers = args["headers"] as? [String: String] {
            for (k, v) in headers { request.setValue(v, forHTTPHeaderField: k) }
        }
        if let body = args["body"] as? String, !body.isEmpty {
            request.httpBody = body.data(using: .utf8)
        } else if let body = args["body"] as? Data {
            request.httpBody = body
        }

        let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    self?.callback(id: id, result: ["error": error.localizedDescription], error: nil)
                    return
                }
                let http = response as? HTTPURLResponse
                let text = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
                let status = http?.statusCode ?? 0
                let headers = (http?.allHeaderFields as? [String: Any]) ?? [:]
                self?.callback(id: id, result: [
                    "ok": (status >= 200 && status < 300),
                    "status": status,
                    "body": text,
                    "headers": headers
                ], error: nil)
            }
        }
        task.resume()
    }

    // MARK: - 通话实时翻译：ASR / TTS 原生桥

    /// 把 [side, isFinal, text] 安全编码为 JSON 数组并 spread 进 window.__wtcCallASR
    private func emitCallASR(side: String, isFinal: Bool, text: String) {
        guard let data = try? JSONSerialization.data(withJSONObject: [side, isFinal, text] as [Any], options: []),
              let json = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript("window.__wtcCallASR && window.__wtcCallASR(...\(json));",
                                   completionHandler: nil)
    }

    /// 把 [where, message] 安全编码为 JSON 数组并 spread 进 window.__wtcCallError
    private func emitCallError(whereLoc: String, message: String) {
        guard let data = try? JSONSerialization.data(withJSONObject: [whereLoc, message], options: []),
              let json = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript("window.__wtcCallError && window.__wtcCallError(...\(json));",
                                   completionHandler: nil)
    }

    private func handleStartCallASR(args: [String: Any], id: String) {
        let myLang = args["myLang"] as? String ?? "zh-CN"
        let clientLang = args["clientLang"] as? String ?? "en"
        callSpeech.start(
            myLang: myLang,
            clientLang: clientLang,
            onResult: { [weak self] side, isFinal, text in
                self?.emitCallASR(side: side, isFinal: isFinal, text: text)
            },
            onError: { [weak self] whereLoc, message in
                self?.emitCallError(whereLoc: whereLoc, message: message)
            },
            completion: { [weak self] ok, err in
                self?.callback(id: id, result: ok ? true : nil, error: ok ? nil : (err ?? "启动识别失败"))
            })
    }

    private func handleStopCallASR(args: [String: Any], id: String) {
        callSpeech.stop()
        callback(id: id, result: true, error: nil)
    }

    private func handleSpeak(args: [String: Any], id: String) {
        let text = args["text"] as? String ?? ""
        let lang = args["lang"] as? String ?? "en"
        let gender = args["gender"] as? String ?? "female"
        callSpeech.speak(text: text, lang: lang, gender: gender)
        callback(id: id, result: true, error: nil)
    }

    private func handleStopSpeak(args: [String: Any], id: String) {
        callSpeech.stopSpeak()
        callback(id: id, result: true, error: nil)
    }

    private func handleSetMuted(args: [String: Any], id: String) {
        let muted = args["muted"] as? Bool ?? false
        callSpeech.setMuted(muted)
        callback(id: id, result: true, error: nil)
    }
}

// MARK: - WKScriptMessageHandler（page world）

extension ViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard message.name == "wtcNative",
              let body = message.body as? [String: Any],
              let id = body["id"] as? String,
              let action = body["action"] as? String,
              let args = body["args"] as? [String: Any] else { return }

        switch action {
        case "get":  handleGet(args: args, id: id)
        case "set":  handleSet(args: args, id: id)
        case "http": handleHttp(args: args, id: id)
        case "startCallASR": handleStartCallASR(args: args, id: id)
        case "stopCallASR":  handleStopCallASR(args: args, id: id)
        case "speak":        handleSpeak(args: args, id: id)
        case "stopSpeak":    handleStopSpeak(args: args, id: id)
        case "setMuted":     handleSetMuted(args: args, id: id)
        default:     callback(id: id, result: nil, error: "未知 action: \(action)")
        }
    }
}

// MARK: - 导航 / 媒体权限

extension ViewController: WKNavigationDelegate, WKUIDelegate {

    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(.allow)
    }

    /// 相机 / 麦克风权限（iOS 15+）：授予，实际系统弹窗由 Info.plist 描述驱动
    @available(iOS 15.0, *)
    func webView(_ webView: WKWebView,
                 requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo,
                 type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(.grant)
    }

    /// 打开新窗口（WhatsApp 偶发 target=_blank）在当前 webView 打开
    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            webView.load(URLRequest(url: url))
        }
        return nil
    }
}

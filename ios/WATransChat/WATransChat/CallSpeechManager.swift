/* =====================================================================
 * WATransChat iOS · CallSpeechManager.swift
 * 通话实时翻译的原生语音能力：
 *  - ASR：Speech 框架（SFSpeechRecognizer）+ AVAudioEngine 单路 tap，
 *    同一份 AVAudioPCMBuffer 分别喂给 myLang / clientLang 两个识别请求，
 *    实现「我」与「对方」双路实时转写。
 *  - TTS：AVSpeechSynthesizer 朗读，gender 用 pitchMultiplier 近似男女声。
 *  - 权限：SFSpeechRecognizer.requestAuthorization + 麦克风录音权限；
 *    音频会话 .playAndRecord / .voiceChat，支持扬声器与蓝牙。
 * 回调全部切到主线程，由 ViewController 用 JSON 数组安全注入 WKWebView。
 * ===================================================================== */

import Foundation
import AVFoundation
import Speech

final class CallSpeechManager {

    static let shared = CallSpeechManager()

    typealias ResultHandler = (_ side: String, _ isFinal: Bool, _ text: String) -> Void
    typealias ErrorHandler = (_ where: String, _ message: String) -> Void
    typealias StartCompletion = (_ ok: Bool, _ error: String?) -> Void

    private let audioEngine = AVAudioEngine()
    private let synthesizer = AVSpeechSynthesizer()

    private var myRecognizer: SFSpeechRecognizer?
    private var clientRecognizer: SFSpeechRecognizer?
    private var myRequest: SFSpeechAudioBufferRecognitionRequest?
    private var clientRequest: SFSpeechAudioBufferRecognitionRequest?
    private var myTask: SFSpeechRecognitionTask?
    private var clientTask: SFSpeechRecognitionTask?

    private var currentMyLang: String = "zh-CN"
    private var currentClientLang: String = "en"

    /// 每重建一次识别流水线就 +1，旧 task 回调据此丢弃，避免静音/重启后串音
    private var generation = 0

    private(set) var isRunning = false
    private(set) var muted = false

    var onResult: ResultHandler?
    var onError: ErrorHandler?

    private init() {}

    // MARK: - ASR：启动 / 停止

    /// 申请权限并启动双路识别。
    /// - Parameters:
    ///   - myLang: 我方语言 BCP-47，如 zh-CN
    ///   - clientLang: 对方语言，如 en
    ///   - onResult: 高频识别回调，side 为 "me"/"peer"，isFinal 为是否整句结束
    ///   - onError: 错误回调，where 为位置标记
    func start(myLang: String,
               clientLang: String,
               onResult: @escaping ResultHandler,
               onError: @escaping ErrorHandler,
               completion: @escaping StartCompletion) {
        self.onResult = onResult
        self.onError = onError
        currentMyLang = myLang
        currentClientLang = clientLang

        SFSpeechRecognizer.requestAuthorization { status in
            guard status == .authorized else {
                DispatchQueue.main.async {
                    onError("asr", "语音识别权限未授权（status=\(status.rawValue)）")
                    completion(false, "语音识别权限未授权，请在系统设置中允许「语音识别」。")
                }
                return
            }
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                guard granted else {
                    DispatchQueue.main.async {
                        onError("mic", "麦克风权限未授权")
                        completion(false, "麦克风权限未授权，请在系统设置中允许「麦克风」。")
                    }
                    return
                }
                self.beginRecognition(completion: completion)
            }
        }
    }

    /// 静音 / 取消静音：true 暂停采集，false 用当前语言重启采集
    func setMuted(_ muted: Bool) {
        self.muted = muted
        guard isRunning else { return }
        tearDownEngine()
        if muted {
            // 采集已停；旧 task 会因 endAudio 结束，回调被 generation 隔离丢弃
            stopRecognitionTasks()
        } else {
            restartRecognitionPipeline()
        }
    }

    /// 彻底停止识别并释放音频会话
    func stop() {
        guard isRunning else { return }
        isRunning = false
        tearDownEngine()
        stopRecognitionTasks()
        do {
            try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        } catch {
            NSLog("[WTC] 音频会话 deactivate 失败: \(error)")
        }
    }

    // MARK: - TTS：朗读 / 停止

    /// 朗读一段文本。gender == "male" 用低 pitch 近似男声，否则高 pitch 近似女声。
    func speak(text: String, lang: String, gender: String) {
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: lang)
        utterance.volume = 1.0
        if gender == "male" {
            utterance.pitchMultiplier = 0.65
            utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.95
        } else {
            utterance.pitchMultiplier = 1.15
            utterance.rate = AVSpeechUtteranceDefaultSpeechRate
        }
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .word)
        }
        synthesizer.speak(utterance)
    }

    func stopSpeak() {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
    }

    // MARK: - 内部：识别流水线

    private func beginRecognition(completion: @escaping StartCompletion) {
        do {
            try configureAudioSession()
        } catch {
            DispatchQueue.main.async {
                self.onError?("audio", "音频会话配置失败: \(error.localizedDescription)")
                completion(false, "音频会话配置失败")
            }
            return
        }

        stopRecognitionTasks()
        guard configureRecognizers() else {
            DispatchQueue.main.async {
                self.onError?("asr", "无法为当前语言创建语音识别器")
                completion(false, "无法为当前语言创建语音识别器，请检查语言是否受支持。")
            }
            return
        }

        installTapAndStartEngine { ok, err in
            DispatchQueue.main.async {
                if ok {
                    self.isRunning = true
                    completion(true, nil)
                } else {
                    self.onError?("audio", err ?? "音频引擎启动失败")
                    completion(false, err ?? "音频引擎启动失败")
                }
            }
        }
    }

    /// 用当前 currentMyLang / currentClientLang 重建 recognizer / request / task
    @discardableResult
    private func configureRecognizers() -> Bool {
        generation += 1
        let gen = generation

        guard let mr = SFSpeechRecognizer(locale: Locale(identifier: currentMyLang)), mr.isAvailable,
              let cr = SFSpeechRecognizer(locale: Locale(identifier: currentClientLang)), cr.isAvailable else {
            return false
        }
        myRecognizer = mr
        clientRecognizer = cr

        let myReq = SFSpeechAudioBufferRecognitionRequest()
        let clientReq = SFSpeechAudioBufferRecognitionRequest()
        myReq.shouldReportPartialResults = true
        clientReq.shouldReportPartialResults = true
        if #available(iOS 13.0, *) {
            myReq.requiresOnDeviceRecognition = false
            clientReq.requiresOnDeviceRecognition = false
        }
        myRequest = myReq
        clientRequest = clientReq

        myTask = mr.recognitionTask(with: myReq) { [weak self] result, error in
            guard gen == self?.generation else { return }
            self?.handleResult(side: "me", result: result, error: error)
        }
        clientTask = cr.recognitionTask(with: clientReq) { [weak self] result, error in
            guard gen == self?.generation else { return }
            self?.handleResult(side: "peer", result: result, error: error)
        }
        return true
    }

    private func installTapAndStartEngine(completion: @escaping (Bool, String?) -> Void) {
        let input = audioEngine.inputNode
        let format = input.outputFormat(forBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.myRequest?.append(buffer)
            self?.clientRequest?.append(buffer)
        }
        audioEngine.prepare()
        do {
            try audioEngine.start()
            completion(true, nil)
        } catch {
            input.removeTap(onBus: 0)
            completion(false, error.localizedDescription)
        }
    }

    /// 仅重启识别器与 tap（静音恢复时用），不动权限与会话
    private func restartRecognitionPipeline() {
        stopRecognitionTasks()
        do {
            try configureAudioSession()
        } catch {
            onError?("audio", "音频会话配置失败: \(error.localizedDescription)")
            return
        }
        guard configureRecognizers() else {
            onError?("asr", "无法为当前语言创建语音识别器")
            return
        }
        installTapAndStartEngine { ok, err in
            if !ok { self.onError?("audio", err ?? "音频引擎启动失败") }
        }
    }

    private func tearDownEngine() {
        if audioEngine.inputNode.inputFormat(forBus: 0).sampleRate > 0 || audioEngine.isRunning {
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        audioEngine.stop()
    }

    private func stopRecognitionTasks() {
        generation += 1
        myTask?.cancel()
        clientTask?.cancel()
        myTask = nil
        clientTask = nil
        myRequest?.endAudio()
        clientRequest?.endAudio()
        myRequest = nil
        clientRequest = nil
    }

    private func configureAudioSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord,
                                mode: .voiceChat,
                                options: [.defaultToSpeaker, .allowBluetoothHFP, .allowBluetoothA2DP])
        try session.setActive(true)
    }

    private func handleResult(side: String, result: SFSpeechRecognitionResult?, error: Error?) {
        if let result = result {
            let text = result.bestTranscription.formattedString
            let isFinal = result.isFinal
            DispatchQueue.main.async {
                self.onResult?(side, isFinal, text)
            }
        }
        if let error = error as NSError? {
            // 209 / 216 为正常结束/权限类，不向页面刷屏；其余作为错误上报
            if error.code != 209 && error.code != 216 {
                DispatchQueue.main.async {
                    self.onError?("asr-\(side)", error.localizedDescription)
                }
            }
        }
    }
}

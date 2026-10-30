/* =====================================================================
 * WATransChat iOS · ConfigStore.swift
 * 沙盒 KV 配置读写：与注入层（core/storage.js）共享同一份文件。
 * 文件：Documents/wtc_store.json，内容为 { "wtc_config_v1": { ...state } }。
 * 注入层通过原生桥 get/set 读写；原生设置页直接读写本类。
 * ===================================================================== */

import Foundation

final class ConfigStore {
    static let shared = ConfigStore()

    /// 与 shared-core/core/storage.js 的 STORE_KEY 保持一致
    static let storeKey = "wtc_config_v1"

    private let fileURL: URL
    private var kv: [String: Any] = [:]
    private let queue = DispatchQueue(label: "com.watranschat.config", attributes: .concurrent)

    private init() {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        fileURL = docs.appendingPathComponent("wtc_store.json")
        load()
    }

    private func load() {
        guard let data = try? Data(contentsOf: fileURL),
              let obj = try? JSONSerialization.jsonObject(with: data),
              let dict = obj as? [String: Any] else {
            kv = [:]
            return
        }
        kv = dict
    }

    private func persist() {
        do {
            let data = try JSONSerialization.data(withJSONObject: kv, options: [.prettyPrinted, .sortedKeys])
            try data.write(to: fileURL, options: [.atomic])
        } catch {
            NSLog("[WTC] 配置写入失败: \(error)")
        }
    }

    /// 读取任意 KV（线程安全）
    func get(_ key: String) -> Any? {
        queue.sync { kv[key] }
    }

    /// 写入任意 KV（value 为 nil 表示删除）
    func set(_ key: String, value: Any?) {
        queue.async(flags: .barrier) {
            if let v = value {
                self.kv[key] = v
            } else {
                self.kv.removeValue(forKey: key)
            }
            self.persist()
        }
    }

    /// 当前生效的 state 字典（wtc_config_v1）
    func stateDict() -> [String: Any] {
        (get(Self.storeKey) as? [String: Any]) ?? [:]
    }

    /// 整体保存 state
    func saveState(_ state: [String: Any]) {
        set(Self.storeKey, value: state)
    }
}

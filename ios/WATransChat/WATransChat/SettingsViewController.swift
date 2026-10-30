/* =====================================================================
 * WATransChat iOS · SettingsViewController.swift
 * 原生设置页（与浏览器扩展 options 对齐），读写同一份 wtc_config_v1 JSON。
 * 保存后通过 onSaved 回调通知 WKWebView 刷新注入层状态。
 * ===================================================================== */

import UIKit

final class SettingsViewController: UITableViewController {

    /// 保存完成回调（由 ViewController 注入，用于刷新 WTC.state）
    var onSaved: (() -> Void)?

    private var state: [String: Any] = [:]
    private var engines: [String: Any] = [:]
    private var callDict: [String: Any] = [:]

    // 与 core/config.js 的 LANGUAGES 对齐
    private let languages: [(code: String, name: String)] = [
        ("zh-CN", "中文（简体）"), ("zh-TW", "中文（繁体）"), ("en", "英语"),
        ("hu", "匈牙利语"), ("pl", "波兰语"), ("de", "德语"), ("fr", "法语"),
        ("es", "西班牙语"), ("pt", "葡萄牙语"), ("it", "意大利语"), ("ru", "俄语"),
        ("ar", "阿拉伯语"), ("tr", "土耳其语"), ("he", "希伯来语"), ("hi", "印地语"),
        ("id", "印尼语"), ("ja", "日语"), ("ko", "韩语"), ("th", "泰语"),
        ("vi", "越南语"), ("nl", "荷兰语"), ("cs", "捷克语"), ("sv", "瑞典语"),
        ("uk", "乌克兰语"), ("ro", "罗马尼亚语"), ("el", "希腊语"), ("fa", "波斯语"),
        ("ms", "马来语"), ("km", "高棉语"), ("ne", "尼泊尔语"), ("bn", "孟加拉语"),
        ("ur", "乌尔都语"), ("fil", "菲律宾语"), ("sw", "斯瓦希里语")
    ]

    private let enginesList: [(id: String, name: String)] = [
        ("google", "谷歌翻译（免费）"),
        ("bing", "微软翻译（免费）"),
        ("volcano", "火山引擎翻译"),
        ("deepl", "DeepL 翻译")
    ]

    // 与 core/config.js SCHEMA.colors 对齐
    private let palette: [String] = [
        "#2563eb", "#1d4ed8", "#38bdf8", "#22c55e", "#14b8a6", "#0ea5e9",
        "#f97316", "#dc2626", "#e11d48", "#ef4444", "#f87171", "#f472b6",
        "#bfdbfe", "#93c5fd", "#c4b5fd", "#f9a8d4", "#a5b4fc", "#e5e7eb",
        "#eab308", "#a855f7", "#f3f4f6", "#d1d5db", "#9ca3af", "#6b7280",
        "#111827", "#000000", "#1f2937", "#1e293b", "#374151", "#0f172a"
    ]

    // 段落与行索引
    private enum Section: Int {
        case general = 0, call, volcano, deepl, ai
    }
    private enum GeneralRow: Int {
        case myLanguage, engine, autoSend, translateColor
    }
    private enum CallRow: Int {
        case myLang, clientLang, autoSpeak
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "翻译设置"
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .save, target: self, action: #selector(saveTapped))

        state = ConfigStore.shared.stateDict()
        engines = (state["engines"] as? [String: Any]) ?? [:]
        callDict = (state["call"] as? [String: Any]) ?? [:]

        tableView.register(PickerCell.self, forCellReuseIdentifier: "PickerCell")
        tableView.register(SwitchCell.self, forCellReuseIdentifier: "SwitchCell")
        tableView.register(TextFieldCell.self, forCellReuseIdentifier: "TextFieldCell")
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "DefaultCell")
    }

    // MARK: - 数据源

    override func numberOfSections(in tableView: UITableView) -> Int { 5 }

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        switch Section(rawValue: section)! {
        case .general: return 4
        case .call: return 3
        case .volcano: return 3
        case .deepl: return 2
        case .ai: return 3
        }
    }

    override func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        switch Section(rawValue: section)! {
        case .general: return "通用"
        case .call: return "通话实时翻译"
        case .volcano: return "火山引擎（Volcengine）"
        case .deepl: return "DeepL"
        case .ai: return "AI 引擎"
        }
    }

    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        switch Section(rawValue: indexPath.section)! {
        case .general:
            return generalCell(row: GeneralRow(rawValue: indexPath.row)!, indexPath: indexPath)
        case .call:
            return callCell(row: CallRow(rawValue: indexPath.row)!, indexPath: indexPath)
        case .volcano:
            let keys = ["accessKeyId", "secretAccessKey", "region"]
            let placeholders = ["AccessKey ID", "SecretAccessKey", "region（默认 cn-north-1）"]
            return textFieldCell(section: .volcano, key: keys[indexPath.row],
                                 placeholder: placeholders[indexPath.row], indexPath: indexPath)
        case .deepl:
            if indexPath.row == 0 {
                return textFieldCell(section: .deepl, key: "apiKey",
                                     placeholder: "DeepL API Key", indexPath: indexPath)
            }
            let cell = tableView.dequeueReusableCell(withIdentifier: "SwitchCell", for: indexPath) as! SwitchCell
            cell.configure(title: "Free 版端点", on: deeplDict()["free"] as? Bool ?? true) { [weak self] on in
                var d = self?.deeplDict() ?? [:]
                d["free"] = on
                self?.engines["deepl"] = d
            }
            return cell
        case .ai:
            let keys = ["baseUrl", "apiKey", "model"]
            let placeholders = ["Base URL（如 https://api.openai.com/v1）", "API Key", "model（默认 gpt-4o-mini）"]
            return textFieldCell(section: .ai, key: keys[indexPath.row],
                                 placeholder: placeholders[indexPath.row], indexPath: indexPath)
        }
    }

    private func generalCell(row: GeneralRow, indexPath: IndexPath) -> UITableViewCell {
        switch row {
        case .myLanguage:
            let code = state["myLanguage"] as? String ?? "zh-CN"
            let name = languages.first { $0.code == code }?.name ?? code
            let cell = tableView.dequeueReusableCell(withIdentifier: "PickerCell", for: indexPath) as! PickerCell
            cell.configure(title: "您的语言", detail: name)
            return cell
        case .engine:
            let id = state["engine"] as? String ?? "google"
            let name = enginesList.first { $0.id == id }?.name ?? id
            let cell = tableView.dequeueReusableCell(withIdentifier: "PickerCell", for: indexPath) as! PickerCell
            cell.configure(title: "全局引擎", detail: name)
            return cell
        case .autoSend:
            let cell = tableView.dequeueReusableCell(withIdentifier: "SwitchCell", for: indexPath) as! SwitchCell
            cell.configure(title: "自动发送译文", on: state["autoSend"] as? Bool ?? true) { [weak self] on in
                self?.state["autoSend"] = on
            }
            return cell
        case .translateColor:
            let color = state["translateColor"] as? String ?? "#2563eb"
            let cell = tableView.dequeueReusableCell(withIdentifier: "PickerCell", for: indexPath) as! PickerCell
            cell.configure(title: "译文颜色", detail: color)
            return cell
        }
    }

    private func callCell(row: CallRow, indexPath: IndexPath) -> UITableViewCell {
        switch row {
        case .myLang:
            let code = callDict["myLang"] as? String ?? "zh-CN"
            let name = languages.first { $0.code == code }?.name ?? code
            let cell = tableView.dequeueReusableCell(withIdentifier: "PickerCell", for: indexPath) as! PickerCell
            cell.configure(title: "我的语言", detail: name)
            return cell
        case .clientLang:
            let code = callDict["clientLang"] as? String ?? "en"
            let name = languages.first { $0.code == code }?.name ?? code
            let cell = tableView.dequeueReusableCell(withIdentifier: "PickerCell", for: indexPath) as! PickerCell
            cell.configure(title: "客户语言", detail: name)
            return cell
        case .autoSpeak:
            let cell = tableView.dequeueReusableCell(withIdentifier: "SwitchCell", for: indexPath) as! SwitchCell
            cell.configure(title: "自动朗读译文", on: callDict["autoSpeak"] as? Bool ?? true) { [weak self] on in
                self?.callDict["autoSpeak"] = on
            }
            return cell
        }
    }

    private func textFieldCell(section: Section, key: String, placeholder: String,
                               indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "TextFieldCell", for: indexPath) as! TextFieldCell
        let dict: [String: Any]
        switch section {
        case .volcano: dict = volcanoDict()
        case .deepl: dict = deeplDict()
        case .ai: dict = aiDict()
        default: dict = [:]
        }
        cell.configure(placeholder: placeholder, text: dict[key] as? String) { [weak self] newValue in
            var d = dict
            d[key] = newValue
            switch section {
            case .volcano: self?.engines["volcano"] = d
            case .deepl: self?.engines["deepl"] = d
            case .ai: self?.engines["ai"] = d
            default: break
            }
        }
        return cell
    }

    // MARK: - 选择动作

    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        switch Section(rawValue: indexPath.section)! {
        case .general:
            switch GeneralRow(rawValue: indexPath.row)! {
            case .myLanguage: pickLanguage()
            case .engine: pickEngine()
            case .translateColor: pickColor()
            case .autoSend: break
            }
        case .call:
            switch CallRow(rawValue: indexPath.row)! {
            case .myLang: pickCallLang(key: "myLang")
            case .clientLang: pickCallLang(key: "clientLang")
            case .autoSpeak: break
            }
        default:
            break
        }
    }

    private func pickCallLang(key: String) {
        let title = (key == "myLang") ? "我的语言" : "客户语言"
        let alert = UIAlertController(title: title, message: nil, preferredStyle: .actionSheet)
        for item in languages {
            alert.addAction(UIAlertAction(title: item.name, style: .default) { [weak self] _ in
                self?.callDict[key] = item.code
                self?.tableView.reloadData()
            })
        }
        alert.addAction(UIAlertAction(title: "取消", style: .cancel))
        present(alert, animated: true)
    }

    private func pickLanguage() {
        let alert = UIAlertController(title: "您的语言", message: nil, preferredStyle: .actionSheet)
        for item in languages {
            alert.addAction(UIAlertAction(title: item.name, style: .default) { [weak self] _ in
                self?.state["myLanguage"] = item.code
                self?.tableView.reloadData()
            })
        }
        alert.addAction(UIAlertAction(title: "取消", style: .cancel))
        present(alert, animated: true)
    }

    private func pickEngine() {
        let alert = UIAlertController(title: "全局引擎", message: nil, preferredStyle: .actionSheet)
        for item in enginesList {
            alert.addAction(UIAlertAction(title: item.name, style: .default) { [weak self] _ in
                self?.state["engine"] = item.id
                self?.tableView.reloadData()
            })
        }
        alert.addAction(UIAlertAction(title: "取消", style: .cancel))
        present(alert, animated: true)
    }

    private func pickColor() {
        let alert = UIAlertController(title: "译文颜色", message: nil, preferredStyle: .actionSheet)
        for hex in palette {
            alert.addAction(UIAlertAction(title: hex, style: .default) { [weak self] _ in
                self?.state["translateColor"] = hex
                self?.tableView.reloadData()
            })
        }
        alert.addAction(UIAlertAction(title: "取消", style: .cancel))
        present(alert, animated: true)
    }

    // MARK: - 字典辅助

    private func volcanoDict() -> [String: Any] { engines["volcano"] as? [String: Any] ?? [:] }
    private func deeplDict() -> [String: Any] { engines["deepl"] as? [String: Any] ?? [:] }
    private func aiDict() -> [String: Any] { engines["ai"] as? [String: Any] ?? [:] }

    @objc private func saveTapped() {
        state["engines"] = engines
        state["call"] = callDict
        ConfigStore.shared.saveState(state)
        onSaved?()
        navigationController?.popViewController(animated: true)
    }
}

// MARK: - 单元格

final class PickerCell: UITableViewCell {
    private let detail = UILabel()
    func configure(title: String, detail: String) {
        textLabel?.text = title
        self.detail.text = detail
        self.detail.textColor = .secondaryLabel
        accessoryType = .disclosureIndicator
        if detail.superview == nil {
            contentView.addSubview(self.detail)
            self.detail.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                self.detail.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -36),
                self.detail.centerYAnchor.constraint(equalTo: contentView.centerYAnchor)
            ])
        }
    }
}

final class SwitchCell: UITableViewCell {
    private let switchControl = UISwitch()
    private var onChange: ((Bool) -> Void)?
    func configure(title: String, on: Bool, onChange: @escaping (Bool) -> Void) {
        textLabel?.text = title
        switchControl.isOn = on
        self.onChange = onChange
        accessoryView = switchControl
        switchControl.removeTarget(nil, action: nil, for: .valueChanged)
        switchControl.addTarget(self, action: #selector(changed(_:)), for: .valueChanged)
    }
    @objc private func changed(_ s: UISwitch) { onChange?(s.isOn) }
}

final class TextFieldCell: UITableViewCell {
    private let field = UITextField()
    private var onCommit: ((String) -> Void)?
    func configure(placeholder: String, text: String?, onCommit: @escaping (String) -> Void) {
        self.onCommit = onCommit
        field.placeholder = placeholder
        field.text = text
        field.font = .systemFont(ofSize: 15)
        field.clearButtonMode = .whileEditing
        if field.superview == nil {
            contentView.addSubview(field)
            field.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                field.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
                field.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
                field.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 10),
                field.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -10)
            ])
        }
        field.removeTarget(nil, action: nil, for: .editingChanged)
        field.addTarget(self, action: #selector(editingChanged), for: .editingChanged)
    }
    @objc private func editingChanged() { onCommit?(field.text ?? "") }
}

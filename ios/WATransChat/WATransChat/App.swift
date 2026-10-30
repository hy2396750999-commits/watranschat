/* =====================================================================
 * WATransChat iOS · App.swift
 * UIKit App Delegate 生命周期入口（@main），无 storyboard。
 * 场景由 SceneDelegate 程序化创建 window。
 * ===================================================================== */

import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        return true
    }

    // MARK: - UIScene 生命周期（Info.plist ApplicationSceneManifest 指向 SceneDelegate）

    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        let cfg = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
        cfg.delegateClass = SceneDelegate.self
        return cfg
    }
}

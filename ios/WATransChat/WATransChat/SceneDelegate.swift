/* =====================================================================
 * WATransChat iOS · SceneDelegate.swift
 * 程序化创建 window，根视图为 UINavigationController(ViewController)。
 * ===================================================================== */

import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let window = UIWindow(windowScene: windowScene)
        let webVC = ViewController()
        let nav = UINavigationController(rootViewController: webVC)
        nav.navigationBar.isHidden = true
        nav.setNavigationBarHidden(true, animated: false)
        window.rootViewController = nav
        window.makeKeyAndVisible()
        self.window = window
    }

    func sceneDidDisconnect(_ scene: UIScene) {}
    func sceneDidBecomeActive(_ scene: UIScene) {}
    func sceneWillResignActive(_ scene: UIScene) {}
    func sceneWillEnterForeground(_ scene: UIScene) {}
    func sceneDidEnterBackground(_ scene: UIScene) {}
}

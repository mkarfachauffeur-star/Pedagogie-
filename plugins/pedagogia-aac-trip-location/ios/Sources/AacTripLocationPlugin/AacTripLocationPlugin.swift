import Capacitor
import CoreLocation
import UIKit

/// Suivi GPS d’un trajet AAC uniquement.
/// CLLocationManager n’est démarré que par `start` et est arrêté par `stop`.
/// Le mode arrière-plan reste donc éteint tant qu’aucun trajet n’est en cours.
@objc(AacTripLocationPlugin)
public class AacTripLocationPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "AacTripLocationPlugin"
    public let jsName = "AacTripLocation"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCurrentPosition", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "drain", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise)
    ]

    private var manager: CLLocationManager?
    private let persistQueue = DispatchQueue(label: "fr.pedagogiadrive.aac-trip-location")
    private var tracking = false
    private var points: [[String: Any]] = []
    private var sequence = 1
    private var permissionCall: CAPPluginCall?
    private var singleFixCall: CAPPluginCall?
    private var askedAlwaysForThisRequest = false
    private var alwaysPromptSawInactive = false
    private var singleFixTimer: DispatchWorkItem?
    private var permissionTimer: DispatchWorkItem?
    private var activeObserver: NSObjectProtocol?
    private var inactiveObserver: NSObjectProtocol?
    private let maxPoints = 20000

    deinit {
        if let activeObserver {
            NotificationCenter.default.removeObserver(activeObserver)
        }
        if let inactiveObserver {
            NotificationCenter.default.removeObserver(inactiveObserver)
        }
    }

    override public func load() {
        if !Thread.isMainThread {
            DispatchQueue.main.async { [weak self] in self?.load() }
            return
        }
        ensureManager()
        observeAppActivity()
        logGps("AacTripLocationPlugin chargé main=\(Thread.isMainThread)")
    }

    private var gps: CLLocationManager {
        if let manager {
            return manager
        }
        ensureManager()
        return manager!
    }

    private func logGps(_ message: String) {
        NSLog("[AAC-GPS] %@", message)
    }

    private func authLabel(_ status: CLAuthorizationStatus) -> String {
        switch status {
        case .notDetermined: return "notDetermined"
        case .restricted: return "restricted"
        case .denied: return "denied"
        case .authorizedAlways: return "authorizedAlways"
        case .authorizedWhenInUse: return "authorizedWhenInUse"
        @unknown default: return "unknown(\(status.rawValue))"
        }
    }

    /// CLLocationManager n’est utilisé que sur le fil principal, celui qui l’a créé.
    private func onMain(_ work: @escaping () -> Void) {
        if Thread.isMainThread {
            work()
        } else {
            DispatchQueue.main.async(execute: work)
        }
    }

    private func ensureManager() {
        if manager != nil { return }
        let created = CLLocationManager()
        created.delegate = self
        created.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        created.distanceFilter = 10
        created.activityType = .automotiveNavigation
        created.pausesLocationUpdatesAutomatically = true
        created.allowsBackgroundLocationUpdates = false
        created.showsBackgroundLocationIndicator = true
        manager = created
        loadBuffer()
    }

    private func observeAppActivity() {
        if activeObserver == nil {
            activeObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.didBecomeActiveNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                self?.alwaysPromptDidReturnToForeground()
            }
        }
        if inactiveObserver == nil {
            inactiveObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.willResignActiveNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                guard let self, self.permissionCall != nil, self.askedAlwaysForThisRequest else { return }
                self.alwaysPromptSawInactive = true
            }
        }
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        onMain { [weak self] in
            guard let self else { return }
            call.resolve(self.permissionPayload())
        }
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        onMain { [weak self] in
            self?.requestPermissionsOnMain(call)
        }
    }

    @objc func getCurrentPosition(_ call: CAPPluginCall) {
        onMain { [weak self] in
            self?.getCurrentPositionOnMain(call)
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        onMain { [weak self] in
            self?.startOnMain(call)
        }
    }

    private func requestPermissionsOnMain(_ call: CAPPluginCall) {
        logGps("requestPermissions appelé main=\(Thread.isMainThread)")
        logGps("CLLocationAuthorizationStatus avant locationServicesEnabled")
        let servicesEnabled = CLLocationManager.locationServicesEnabled()
        logGps("locationServicesEnabled=\(servicesEnabled)")
        guard servicesEnabled else {
            call.resolve(permissionPayload())
            return
        }
        guard usageDescription("NSLocationWhenInUseUsageDescription") != nil else {
            call.reject("NSLocationWhenInUseUsageDescription est absent de Info.plist.", "MISSING_WHEN_IN_USE_USAGE")
            return
        }

        let statusBefore = gps.authorizationStatus
        logGps("CLLocationAuthorizationStatus avant demande=\(authLabel(statusBefore))")
        switch statusBefore {
        case .notDetermined:
            permissionCall?.reject("Une autre demande d’autorisation est déjà en cours.", "BUSY")
            permissionCall = call
            askedAlwaysForThisRequest = false
            alwaysPromptSawInactive = false
            armPermissionSafetyTimer()
            logGps("requestWhenInUseAuthorization appelé")
            gps.requestWhenInUseAuthorization()
            logGps("CLLocationAuthorizationStatus après requestWhenInUseAuthorization=\(authLabel(gps.authorizationStatus))")
        case .authorizedWhenInUse:
            permissionCall?.reject("Une autre demande d’autorisation est déjà en cours.", "BUSY")
            permissionCall = call
            armPermissionSafetyTimer()
            beginAlwaysUpgrade()
        case .authorizedAlways, .denied, .restricted:
            logGps("requestPermissions résolu immédiatement statut=\(authLabel(statusBefore))")
            call.resolve(permissionPayload())
        @unknown default:
            call.resolve(permissionPayload())
        }
    }

    private func getCurrentPositionOnMain(_ call: CAPPluginCall) {
        logGps("getCurrentPosition appelé main=\(Thread.isMainThread) timeoutMs=\(call.getInt("timeout", 20000))")
        guard CLLocationManager.locationServicesEnabled() else {
            logGps("getCurrentPosition reject services désactivés")
            call.reject("Le service de localisation est désactivé.", "OS-PLUG-GLOC-0007")
            return
        }
        guard isAuthorized else {
            logGps("getCurrentPosition reject non autorisé statut=\(authLabel(gps.authorizationStatus))")
            call.reject("L’autorisation de localisation est refusée.", "OS-PLUG-GLOC-0003")
            return
        }
        if singleFixCall != nil {
            failSingleFix(message: "Une autre demande de position est déjà en cours.", code: "BUSY")
        }
        singleFixCall = call
        let timeoutMs = max(call.getInt("timeout", 20000), 1000)
        armSingleFixTimer(seconds: TimeInterval(timeoutMs) / 1000)
        logGps("requestLocation appelé statut=\(authLabel(gps.authorizationStatus))")
        gps.requestLocation()
    }

    private func startOnMain(_ call: CAPPluginCall) {
        logGps("start appelé main=\(Thread.isMainThread) statut=\(authLabel(gps.authorizationStatus))")
        guard CLLocationManager.locationServicesEnabled() else {
            call.reject("Location services are not enabled.", "OS-PLUG-GLOC-0007")
            return
        }
        guard isAuthorized else {
            call.reject("Location permission request was denied.", "OS-PLUG-GLOC-0003")
            return
        }
        guard backgroundLocationEnabledInPlist() else {
            call.reject(
                "UIBackgroundModes location est absent de Info.plist. Relancez npm run ios:prepare.",
                "MISSING_BACKGROUND_MODE"
            )
            return
        }
        guard usageDescription("NSLocationAlwaysAndWhenInUseUsageDescription") != nil else {
            call.reject(
                "NSLocationAlwaysAndWhenInUseUsageDescription est absent de Info.plist.",
                "MISSING_ALWAYS_USAGE"
            )
            return
        }

        if call.getBool("reset", false) {
            clearBuffer()
        }
        if tracking {
            call.resolve(permissionPayload())
            return
        }

        tracking = true
        gps.allowsBackgroundLocationUpdates = true
        gps.pausesLocationUpdatesAutomatically = false
        gps.showsBackgroundLocationIndicator = true
        gps.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        gps.distanceFilter = 10
        gps.activityType = .automotiveNavigation
        logGps("startUpdatingLocation appelé allowsBackgroundLocationUpdates=true")
        gps.startUpdatingLocation()
        call.resolve(permissionPayload())
    }

    @objc func stop(_ call: CAPPluginCall) {
        onMain { [weak self] in
            guard let self else { return }
            self.logGps("stop appelé")
            self.endUpdates()
            call.resolve(self.permissionPayload())
        }
    }

    @objc func drain(_ call: CAPPluginCall) {
        let snapshot = points
        points = []
        persist()
        call.resolve(["points": snapshot])
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        onMain { [weak self] in
            guard let self else { return }
            call.resolve(self.permissionPayload())
        }
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        logGps("locationManagerDidChangeAuthorization statut=\(authLabel(status)) permissionEnCours=\(permissionCall != nil) alwaysDemandé=\(askedAlwaysForThisRequest)")
        if permissionCall != nil {
            switch status {
            case .authorizedWhenInUse:
                if !askedAlwaysForThisRequest {
                    beginAlwaysUpgrade()
                }
                // « Toujours » est demandé. On ne conclut pas tant que la feuille
                // système est ouverte : un statut inchangé n’est pas une réponse.
                return
            case .authorizedAlways, .denied, .restricted:
                finishPermissionRequest()
            case .notDetermined:
                return
            @unknown default:
                finishPermissionRequest()
            }
            return
        }
        if tracking && status != .authorizedAlways && status != .authorizedWhenInUse {
            endUpdates()
            notifyListeners("error", data: ["message": "Location permission request was denied.", "code": "OS-PLUG-GLOC-0003"])
        }
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        for location in locations {
            logGps(String(format: "didUpdateLocations lat=%.6f lng=%.6f accuracy=%.1f", location.coordinate.latitude, location.coordinate.longitude, location.horizontalAccuracy))
        }
        let valid = locations.filter { $0.horizontalAccuracy >= 0 }

        guard tracking else {
            if let fix = valid.last {
                succeedSingleFix(pointPayload(fix))
            }
            return
        }

        var lastStored: [String: Any]?
        for fix in valid {
            let point = pointPayload(fix)
            append(point)
            lastStored = point
        }
        if let lastStored {
            succeedSingleFix(lastStored)
        }
    }

    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        let nsError = error as NSError
        logGps("didFailWithError domain=\(nsError.domain) code=\(nsError.code) message=\(nsError.localizedDescription)")
        if let clError = error as? CLError, clError.code == .locationUnknown {
            // Erreur transitoire : iOS continue de chercher. Le délai armé par
            // getCurrentPosition rejette la promesse si aucun point n’arrive.
            return
        }
        let message = error.localizedDescription
        if singleFixCall != nil {
            failSingleFix(message: message, code: "OS-PLUG-GLOC-0002")
        }
        if tracking {
            notifyListeners("error", data: ["message": message])
        }
    }

    private var isAuthorized: Bool {
        switch gps.authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            return true
        default:
            return false
        }
    }

    private func beginAlwaysUpgrade() {
        askedAlwaysForThisRequest = true
        alwaysPromptSawInactive = false
        guard usageDescription("NSLocationAlwaysAndWhenInUseUsageDescription") != nil else {
            finishPermissionRequest()
            return
        }
        logGps("requestAlwaysAuthorization appelé statut=\(authLabel(gps.authorizationStatus))")
        gps.requestAlwaysAuthorization()
        logGps("CLLocationAuthorizationStatus après requestAlwaysAuthorization=\(authLabel(gps.authorizationStatus))")
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            guard let self, self.permissionCall != nil, self.askedAlwaysForThisRequest else { return }
            if self.alwaysPromptSawInactive || UIApplication.shared.applicationState != .active {
                return
            }
            // Aucune feuille système n’est apparue : l’élève a déjà répondu avant.
            self.finishPermissionRequest()
        }
    }

    private func alwaysPromptDidReturnToForeground() {
        guard permissionCall != nil, askedAlwaysForThisRequest else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
            guard let self, self.permissionCall != nil, self.askedAlwaysForThisRequest else { return }
            if UIApplication.shared.applicationState == .active {
                self.finishPermissionRequest()
            }
        }
    }

    private func armPermissionSafetyTimer() {
        permissionTimer?.cancel()
        let work = DispatchWorkItem { [weak self] in
            guard let self, self.permissionCall != nil else { return }
            if self.isAuthorized {
                self.finishPermissionRequest()
            } else {
                self.failPermission(
                    message: "La demande d’autorisation de localisation n’a pas abouti. Réessayez.",
                    code: "OS-PLUG-GLOC-0003"
                )
            }
        }
        permissionTimer = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 90, execute: work)
    }

    private func finishPermissionRequest() {
        permissionTimer?.cancel()
        permissionTimer = nil
        askedAlwaysForThisRequest = false
        alwaysPromptSawInactive = false
        guard let call = permissionCall else { return }
        permissionCall = nil
        call.resolve(permissionPayload())
    }

    private func failPermission(message: String, code: String) {
        permissionTimer?.cancel()
        permissionTimer = nil
        askedAlwaysForThisRequest = false
        alwaysPromptSawInactive = false
        guard let call = permissionCall else { return }
        permissionCall = nil
        call.reject(message, code)
    }

    private func armSingleFixTimer(seconds: TimeInterval) {
        singleFixTimer?.cancel()
        let work = DispatchWorkItem { [weak self] in
            self?.failSingleFix(
                message: "Le GPS n’a pas obtenu de position à temps. Placez-vous à l’extérieur, le ciel dégagé, puis réessayez.",
                code: "OS-PLUG-GLOC-0010"
            )
        }
        singleFixTimer = work
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: work)
    }

    private func succeedSingleFix(_ payload: [String: Any]) {
        singleFixTimer?.cancel()
        singleFixTimer = nil
        guard let call = singleFixCall else { return }
        singleFixCall = nil
        logGps("getCurrentPosition resolve")
        call.resolve(payload)
    }

    private func failSingleFix(message: String, code: String) {
        singleFixTimer?.cancel()
        singleFixTimer = nil
        guard let call = singleFixCall else { return }
        singleFixCall = nil
        if !tracking {
            gps.stopUpdatingLocation()
        }
        logGps("getCurrentPosition reject code=\(code) message=\(message)")
        call.reject(message, code)
    }

    private func endUpdates() {
        tracking = false
        gps.stopUpdatingLocation()
        gps.allowsBackgroundLocationUpdates = false
        gps.pausesLocationUpdatesAutomatically = true
    }

    private func pointPayload(_ location: CLLocation) -> [String: Any] {
        let sequenceNo = sequence
        sequence += 1
        return [
            "lat": location.coordinate.latitude,
            "lng": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "timestamp": location.timestamp.timeIntervalSince1970 * 1000,
            "sequenceNo": sequenceNo
        ]
    }

    private func append(_ point: [String: Any]) {
        points.append(point)
        if points.count > maxPoints {
            points.removeFirst(points.count - maxPoints)
        }
        notifyListeners("location", data: point)
        persist()
    }

    private func clearBuffer() {
        points = []
        sequence = 1
        persist()
    }

    private func permissionPayload() -> [String: Any] {
        if !CLLocationManager.locationServicesEnabled() {
            return ["location": "denied", "scope": "disabled", "background": false, "tracking": tracking]
        }
        let scope: String
        let granted: Bool
        switch gps.authorizationStatus {
        case .authorizedAlways:
            scope = "always"
            granted = true
        case .authorizedWhenInUse:
            scope = "whenInUse"
            granted = true
        case .denied:
            scope = "denied"
            granted = false
        case .restricted:
            scope = "restricted"
            granted = false
        default:
            scope = "prompt"
            granted = false
        }
        let background = tracking && backgroundLocationEnabledInPlist() && granted
        return [
            "location": granted ? "granted" : (scope == "prompt" ? "prompt" : "denied"),
            "scope": scope,
            "background": background,
            "tracking": tracking
        ]
    }

    private func backgroundLocationEnabledInPlist() -> Bool {
        guard let modes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String] else {
            return false
        }
        return modes.contains("location")
    }

    private func usageDescription(_ key: String) -> String? {
        Bundle.main.object(forInfoDictionaryKey: key) as? String
    }

    private var bufferURL: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: base, withIntermediateDirectories: true)
        return base.appendingPathComponent("aac-trip-location-buffer.json")
    }

    private func loadBuffer() {
        let url = bufferURL
        persistQueue.sync {
            guard let data = try? Data(contentsOf: url),
                  let decoded = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
                return
            }
            points = decoded
            let maxSequence = decoded.compactMap { ($0["sequenceNo"] as? NSNumber)?.intValue }.max() ?? 0
            sequence = max(sequence, maxSequence + 1)
        }
    }

    private func persist() {
        let snapshot = points
        let url = bufferURL
        persistQueue.async {
            guard let data = try? JSONSerialization.data(withJSONObject: snapshot) else { return }
            try? data.write(to: url, options: .atomic)
        }
    }
}

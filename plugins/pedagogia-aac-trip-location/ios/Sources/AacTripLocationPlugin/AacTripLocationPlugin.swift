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
    /// Dernière lecture de `locationServicesEnabled()`, faite hors du fil principal.
    /// Nil tant que cette lecture n’est pas revenue : on n’en déduit pas un refus.
    private var servicesEnabledCache: Bool?
    private let traceLock = NSLock()
    private var getStatusPending = false
    private var requestPermissionsPending = false
    private var currentPositionAwaitingFix = false
    private var startPending = false
    private var loggedFirstNativeFix = false

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
        refreshServicesEnabledCache()
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

    private func nativeLog(_ message: String) {
        NSLog("[AAC-GPS][NATIVE] %@", message)
    }

    private func setGetStatusPending(_ value: Bool) {
        traceLock.lock()
        getStatusPending = value
        traceLock.unlock()
    }

    private func isGetStatusPending() -> Bool {
        traceLock.lock()
        defer { traceLock.unlock() }
        return getStatusPending
    }

    private func setRequestPermissionsPending(_ value: Bool) {
        traceLock.lock()
        requestPermissionsPending = value
        traceLock.unlock()
    }

    private func isRequestPermissionsPending() -> Bool {
        traceLock.lock()
        defer { traceLock.unlock() }
        return requestPermissionsPending
    }

    private func setCurrentPositionAwaitingFix(_ value: Bool) {
        traceLock.lock()
        currentPositionAwaitingFix = value
        traceLock.unlock()
    }

    private func isCurrentPositionAwaitingFix() -> Bool {
        traceLock.lock()
        defer { traceLock.unlock() }
        return currentPositionAwaitingFix
    }

    private func setStartPending(_ value: Bool) {
        traceLock.lock()
        startPending = value
        traceLock.unlock()
    }

    private func isStartPending() -> Bool {
        traceLock.lock()
        defer { traceLock.unlock() }
        return startPending
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

    /// `locationServicesEnabled()` bloque le fil principal après le premier appel.
    /// Core Location attend alors une réponse livrée sur ce même fil : le `getStatus()`
    /// du clic ne revient jamais, `requestPermissions()` n’est pas atteint, et le
    /// bouton reste sur « Acquisition GPS… ». La lecture part donc hors du fil
    /// principal. L’instance `CLLocationManager` du plugin, elle, reste unique.
    private func refreshServicesEnabledCache() {
        DispatchQueue.global(qos: .utility).async { [weak self] in
            let enabled = CLLocationManager.locationServicesEnabled()
            DispatchQueue.main.async {
                self?.servicesEnabledCache = enabled
            }
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
                self?.refreshServicesEnabledCache()
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
            guard let self else {
                call.reject("Le plugin de localisation n’est plus disponible.", "UNAVAILABLE")
                return
            }
            self.ensureManager()
            call.resolve(self.permissionPayload())
        }
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        logGps("requestPermissions appelé")
        nativeLog("requestPermissions entrée")
        setRequestPermissionsPending(true)
        DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + 3) { [weak self] in
            guard let self, self.isRequestPermissionsPending() else { return }
            self.nativeLog("TIMEOUT requestPermissions")
        }
        onMain { [weak self] in
            guard let self else {
                call.reject("Le plugin de localisation n’est plus disponible.", "UNAVAILABLE")
                return
            }
            self.setRequestPermissionsPending(false)
            self.requestPermissionsOnMain(call)
        }
    }

    @objc func getCurrentPosition(_ call: CAPPluginCall) {
        nativeLog("getCurrentPosition entrée")
        setCurrentPositionAwaitingFix(true)
        DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + 3) { [weak self] in
            guard let self, self.isCurrentPositionAwaitingFix() else { return }
            self.nativeLog("TIMEOUT getCurrentPosition")
        }
        onMain { [weak self] in
            guard let self else {
                call.reject("Le plugin de localisation n’est plus disponible.", "UNAVAILABLE")
                return
            }
            self.getCurrentPositionOnMain(call)
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        nativeLog("start entrée")
        setStartPending(true)
        DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + 5) { [weak self] in
            guard let self, self.isStartPending() else { return }
            self.nativeLog("TIMEOUT start")
        }
        onMain { [weak self] in
            guard let self else {
                call.reject("Le plugin de localisation n’est plus disponible.", "UNAVAILABLE")
                return
            }
            self.startOnMain(call)
        }
    }

    private func requestPermissionsOnMain(_ call: CAPPluginCall) {
        let statusBefore = gps.authorizationStatus
        if servicesEnabledCache == false, statusBefore != .notDetermined {
            logGps("locationServicesEnabled=false")
            call.resolve(permissionPayload())
            return
        }
        guard usageDescription("NSLocationWhenInUseUsageDescription") != nil else {
            call.reject("NSLocationWhenInUseUsageDescription est absent de Info.plist.", "MISSING_WHEN_IN_USE_USAGE")
            return
        }

        logGps("CLLocationAuthorizationStatus avant demande=\(authLabel(statusBefore))")
        switch statusBefore {
        case .notDetermined:
            permissionCall?.reject("Une autre demande d’autorisation est déjà en cours.", "BUSY")
            permissionCall = call
            askedAlwaysForThisRequest = false
            alwaysPromptSawInactive = false
            armPermissionSafetyTimer()
            nativeLog("avant requestWhenInUseAuthorization")
            logGps("requestWhenInUseAuthorization appelé")
            gps.requestWhenInUseAuthorization()
            nativeLog("après requestWhenInUseAuthorization")
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
        defer { setCurrentPositionAwaitingFix(false) }
        logGps("getCurrentPosition appelé main=\(Thread.isMainThread) timeoutMs=\(call.getInt("timeout", 20000))")
        if servicesEnabledCache == false && !isAuthorized {
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
        nativeLog("avant requestLocation()")
        logGps("requestLocation appelé statut=\(authLabel(gps.authorizationStatus))")
        gps.requestLocation()
    }

    private func startOnMain(_ call: CAPPluginCall) {
        defer { setStartPending(false) }
        logGps("start appelé main=\(Thread.isMainThread) statut=\(authLabel(gps.authorizationStatus))")
        if servicesEnabledCache == false && !isAuthorized {
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
        loggedFirstNativeFix = false
        nativeLog("startUpdatingLocation appelé")
        logGps("startUpdatingLocation appelé allowsBackgroundLocationUpdates=true")
        gps.startUpdatingLocation()
        call.resolve(permissionPayload())
    }

    @objc func stop(_ call: CAPPluginCall) {
        onMain { [weak self] in
            guard let self else {
                call.reject("Le plugin de localisation n’est plus disponible.", "UNAVAILABLE")
                return
            }
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
        logGps("getStatus entrée")
        nativeLog("getStatus entrée")
        setGetStatusPending(true)
        let once = AacOnceFlag()
        let settle = { [weak self] in
            guard once.claim() else { return }
            guard let self else {
                NSLog("[AAC-GPS][NATIVE] %@", "getStatus rejet")
                call.reject("Le plugin de localisation n’est plus disponible.", "UNAVAILABLE")
                return
            }
            self.setGetStatusPending(false)
            self.ensureManager()
            let payload = self.permissionPayload()
            self.nativeLog("getStatus résolution")
            self.logGps("getStatus résolution")
            call.resolve(payload)
        }
        onMain(settle)
        DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + 2) { [weak self] in
            guard let self else { return }
            if self.isGetStatusPending() {
                self.nativeLog("TIMEOUT getStatus")
            }
            DispatchQueue.main.async(execute: settle)
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
            let line = String(format: "didUpdateLocations lat=%.6f lng=%.6f accuracy=%.1f", location.coordinate.latitude, location.coordinate.longitude, location.horizontalAccuracy)
            logGps(line)
            nativeLog(line)
            if !loggedFirstNativeFix && location.horizontalAccuracy >= 0 {
                loggedFirstNativeFix = true
                nativeLog("première position reçue")
            }
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
        let failLine = "didFailWithError domain=\(nsError.domain) code=\(nsError.code) message=\(nsError.localizedDescription)"
        logGps(failLine)
        nativeLog(failLine)
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
        nativeLog("avant requestAlwaysAuthorization")
        logGps("requestAlwaysAuthorization appelé statut=\(authLabel(gps.authorizationStatus))")
        gps.requestAlwaysAuthorization()
        nativeLog("après requestAlwaysAuthorization")
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
            self.nativeLog("TIMEOUT requestPermissions")
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
            self?.nativeLog("TIMEOUT getCurrentPosition")
            self?.setCurrentPositionAwaitingFix(false)
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
            nativeLog("stopUpdatingLocation")
            gps.stopUpdatingLocation()
        }
        logGps("getCurrentPosition reject code=\(code) message=\(message)")
        call.reject(message, code)
    }

    private func endUpdates() {
        tracking = false
        nativeLog("stopUpdatingLocation")
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
        let status = gps.authorizationStatus
        if servicesEnabledCache == false && status != .authorizedAlways && status != .authorizedWhenInUse && status != .notDetermined {
            return ["location": "denied", "scope": "disabled", "background": false, "tracking": tracking]
        }
        let scope: String
        let granted: Bool
        switch status {
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

/// Ferme une promesse Capacitor une seule fois, même si le délai de sécurité
/// et la lecture sur le fil principal se terminent tous les deux.
private final class AacOnceFlag {
    private let lock = NSLock()
    private var done = false

    func claim() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        if done { return false }
        done = true
        return true
    }
}
}

import Capacitor
import CoreLocation

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
    private let maxPoints = 20000

    override public func load() {
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

    private var gps: CLLocationManager {
        if let manager {
            return manager
        }
        load()
        return manager!
    }

    @objc func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(permissionPayload())
    }

    @objc func requestPermissions(_ call: CAPPluginCall) {
        guard CLLocationManager.locationServicesEnabled() else {
            call.resolve(permissionPayload())
            return
        }
        guard usageDescription("NSLocationWhenInUseUsageDescription") != nil else {
            call.reject("NSLocationWhenInUseUsageDescription est absent de Info.plist.", "MISSING_WHEN_IN_USE_USAGE")
            return
        }

        switch gps.authorizationStatus {
        case .notDetermined:
            permissionCall = call
            askedAlwaysForThisRequest = false
            gps.requestWhenInUseAuthorization()
        case .authorizedWhenInUse:
            permissionCall = call
            askedAlwaysForThisRequest = true
            requestAlwaysUpgrade()
            finishPermissionRequest()
        case .authorizedAlways, .denied, .restricted:
            call.resolve(permissionPayload())
        @unknown default:
            call.resolve(permissionPayload())
        }
    }

    @objc func getCurrentPosition(_ call: CAPPluginCall) {
        guard CLLocationManager.locationServicesEnabled() else {
            call.reject("Location services are not enabled.", "OS-PLUG-GLOC-0007")
            return
        }
        guard isAuthorized else {
            call.reject("Location permission request was denied.", "OS-PLUG-GLOC-0003")
            return
        }
        singleFixCall?.reject("Une autre demande de position est déjà en cours.", "BUSY")
        singleFixCall = call
        gps.requestLocation()
    }

    @objc func start(_ call: CAPPluginCall) {
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
        gps.startUpdatingLocation()
        call.resolve(permissionPayload())
    }

    @objc func stop(_ call: CAPPluginCall) {
        endUpdates()
        call.resolve(permissionPayload())
    }

    @objc func drain(_ call: CAPPluginCall) {
        let snapshot = points
        points = []
        persist()
        call.resolve(["points": snapshot])
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        call.resolve(permissionPayload())
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = gps.authorizationStatus
        if status == .authorizedWhenInUse, permissionCall != nil, !askedAlwaysForThisRequest {
            askedAlwaysForThisRequest = true
            requestAlwaysUpgrade()
            finishPermissionRequest()
            return
        }
        if permissionCall != nil {
            finishPermissionRequest()
        }
        if tracking, !isAuthorized {
            endUpdates()
            notifyListeners("error", data: ["message": "Location permission request was denied.", "code": "OS-PLUG-GLOC-0003"])
        }
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        let valid = locations.filter { $0.horizontalAccuracy >= 0 }
        let sample = valid.last ?? locations.last

        guard tracking else {
            if let call = singleFixCall, let sample {
                singleFixCall = nil
                call.resolve(pointPayload(sample))
            }
            return
        }

        var lastStored: [String: Any]?
        for fix in valid {
            let point = pointPayload(fix)
            append(point)
            lastStored = point
        }
        if let call = singleFixCall {
            singleFixCall = nil
            if let lastStored {
                call.resolve(lastStored)
            } else if let sample {
                call.resolve(pointPayload(sample))
            }
        }
    }

    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        if let clError = error as? CLError, clError.code == .locationUnknown {
            return
        }
        singleFixCall?.reject(error.localizedDescription, "OS-PLUG-GLOC-0002")
        singleFixCall = nil
        if tracking {
            notifyListeners("error", data: ["message": error.localizedDescription])
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

    private func requestAlwaysUpgrade() {
        guard usageDescription("NSLocationAlwaysAndWhenInUseUsageDescription") != nil else { return }
        gps.requestAlwaysAuthorization()
    }

    private func finishPermissionRequest() {
        guard let call = permissionCall else { return }
        permissionCall = nil
        call.resolve(permissionPayload())
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

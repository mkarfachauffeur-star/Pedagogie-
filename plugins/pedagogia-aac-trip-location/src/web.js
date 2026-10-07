import { WebPlugin } from '@capacitor/core'

export class AacTripLocationWeb extends WebPlugin {
  constructor() {
    super()
    this.tracking = false
    this.watchId = null
    this.points = []
    this.sequence = 1
  }

  async checkPermissions() {
    return this.readPermission()
  }

  async requestPermissions() {
    if (!navigator?.geolocation) {
      return { location: 'denied', scope: 'disabled', background: false, tracking: false }
    }
    return { location: 'prompt', scope: 'whenInUse', background: false, tracking: this.tracking }
  }

  async getCurrentPosition() {
    const position = await this.readBrowserPosition()
    return position
  }

  async start(options = {}) {
    if (!navigator?.geolocation) {
      throw new Error('La géolocalisation n’est pas disponible sur cet appareil.')
    }
    if (options.reset) this.clearBuffer()
    if (this.tracking) return this.snapshot()
    this.tracking = true
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.publish(position),
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 25000 },
    )
    return this.snapshot()
  }

  async stop() {
    this.tracking = false
    if (this.watchId != null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
    return this.snapshot()
  }

  async drain() {
    const points = this.points
    this.points = []
    return { points }
  }

  async getStatus() {
    return this.snapshot()
  }

  snapshot() {
    return {
      location: 'prompt',
      scope: 'whenInUse',
      background: false,
      tracking: this.tracking,
    }
  }

  async readPermission() {
    if (!navigator?.geolocation) {
      return { location: 'denied', scope: 'disabled', background: false, tracking: false }
    }
    try {
      const result = await navigator.permissions?.query?.({ name: 'geolocation' })
      if (result?.state === 'granted') {
        return { location: 'granted', scope: 'whenInUse', background: false, tracking: this.tracking }
      }
      if (result?.state === 'denied') {
        return { location: 'denied', scope: 'denied', background: false, tracking: false }
      }
    } catch {
      // Safari ne fournit pas toujours l’API Permissions.
    }
    return { location: 'prompt', scope: 'prompt', background: false, tracking: this.tracking }
  }

  readBrowserPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(this.toPoint(position)),
        (error) => reject(error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
      )
    })
  }

  publish(position) {
    const point = this.toPoint(position)
    this.points.push(point)
    this.notifyListeners('location', point)
  }

  toPoint(position) {
    const point = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
      timestamp: position.timestamp || Date.now(),
      sequenceNo: this.sequence,
    }
    this.sequence += 1
    return point
  }

  clearBuffer() {
    this.points = []
    this.sequence = 1
  }
}

import { registerPlugin } from '@capacitor/core'

export const AacTripLocation = registerPlugin('AacTripLocation', {
  web: () => import('./web.js').then((module) => new module.AacTripLocationWeb()),
})

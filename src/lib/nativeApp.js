import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Keyboard } from '@capacitor/keyboard'

export const isNativeApp = Capacitor.isNativePlatform()
export const isIOS = Capacitor.getPlatform() === 'ios'

export async function initNativeApp() {
  if (!isNativeApp) return

  document.documentElement.classList.add(`capacitor-${Capacitor.getPlatform()}`)

  if (isIOS) {
    await StatusBar.setStyle({ style: Style.Light })
    await StatusBar.setBackgroundColor({ color: '#2563eb' })
    await Keyboard.setScroll({ isDisabled: false })

    Keyboard.addListener('keyboardWillShow', () => {
      document.documentElement.classList.add('capacitor-keyboard-open')
    })
    Keyboard.addListener('keyboardWillHide', () => {
      document.documentElement.classList.remove('capacitor-keyboard-open')
    })
  }

  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) document.documentElement.classList.remove('capacitor-background')
    else document.documentElement.classList.add('capacitor-background')
  })

  window.addEventListener('load', () => {
    SplashScreen.hide().catch(() => {})
  })
}

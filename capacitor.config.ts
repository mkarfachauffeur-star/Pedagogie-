import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'fr.pedagogiadrive.app',
  appName: 'Pedagogia Drive',
  webDir: 'dist',
  ios: {
    // 'automatic' réduit la zone scrollable WKWebView (encoche / barre d’accueil)
    // et empêche d’atteindre le bas du contenu. Les safe areas sont gérées en CSS.
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scheme: 'Pedagogia Drive',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: '#2563eb',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#2563eb',
    },
    Keyboard: {
      resize: 'native',
    },
  },
}

export default config

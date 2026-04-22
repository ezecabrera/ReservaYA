import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor config — Un Toque (cliente/comensales).
 *
 * Estrategia: el WebView carga la PWA en producción (`server.url`).
 * Esto permite que toda la funcionalidad SSR + middleware + API routes de
 * Next.js siga corriendo normal en Vercel. Capacitor solo provee el shell
 * nativo (icon, splash, status bar) y plugins nativos (push, share, haptics).
 *
 * Para desarrollo local contra el dev server, editar temporalmente `server.url`
 * a `http://<TU-IP-LOCAL>:3000` (ej: http://192.168.1.33:3000).
 */
const config: CapacitorConfig = {
  appId: 'app.untoque.client',
  appName: 'Un Toque',
  webDir: 'www',

  // URL productiva: el WebView apunta a la PWA desplegada.
  // Comentá esto y usá `webDir` si querés bundle offline en el APK.
  server: {
    url: 'https://app.untoque.app',
    cleartext: false,
    androidScheme: 'https',
  },

  // iOS
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#FFFFFF',
    scheme: 'untoque',
  },

  // Android
  android: {
    backgroundColor: '#FFFFFF',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false, // true en dev
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#FF4757',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FF4757',
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config

import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor config — Un Toque Negocios (panel del restaurante).
 *
 * El WebView carga el panel en producción (panel.untoque.app). Capacitor
 * provee shell nativo + plugins. Por defecto incluye camera + barcode scanner
 * para permitir check-in escaneando el QR del comensal desde la tablet del local.
 *
 * Para dev local: ver README de este package.
 */
const config: CapacitorConfig = {
  appId: 'app.untoque.business',
  appName: 'Un Toque Negocios',
  webDir: 'www',

  server: {
    url: 'https://panel.untoque.app',
    cleartext: false,
    androidScheme: 'https',
  },

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#FFFFFF',
    scheme: 'untoque-business',
  },

  android: {
    backgroundColor: '#FFFFFF',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0F3460', // navy del panel
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0F3460',
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      // Para check-in QR desde el panel del restaurante
      quality: 80,
      allowEditing: false,
      resultType: 'base64',
    },
  },
}

export default config

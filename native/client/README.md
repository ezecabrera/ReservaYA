# @untoque/native-client

Wrapper nativo de la **PWA cliente** (`apps/app/`) vía Capacitor. Genera el
`.apk` (Android) y `.ipa` (iOS) que se publican en Play Store y App Store como
**"Un Toque"** (comensales).

## Cómo funciona

El WebView nativo carga `https://app.untoque.app` — la misma PWA que los
usuarios ven en navegador. Capacitor solo provee:

- Icon + splash screen nativos
- Status bar con tema coral
- Plugins nativos: push notifications, share sheet, haptic feedback, deep links
- Update automático del contenido sin pasar por la store (el WebView siempre
  carga la última versión de la web)

## Requisitos previos

| Para | Necesitás |
|---|---|
| Generar APK | JDK 17+ + Android Studio (o Android SDK CLI) |
| Generar IPA | Mac con Xcode |
| Firmar APK | Un keystore Android (se genera 1 sola vez) |
| Publicar en stores | Cuenta Google Play Developer ($25) + Apple Developer ($99/año) |

Ver `docs/mobile-setup.md` del repo raíz para instrucciones paso a paso.

## Uso — primera vez

```bash
# Desde el root del monorepo
cd native/client

# 1. Agregar plataformas nativas (solo 1ra vez)
pnpm cap:add:android
pnpm cap:add:ios           # solo en Mac

# 2. Sincronizar la config (cada vez que tocás capacitor.config.ts)
pnpm cap:sync

# 3. Abrir en Android Studio o Xcode
pnpm cap:open:android
pnpm cap:open:ios          # solo en Mac

# 4. Build desde el IDE (ver docs/mobile-setup.md)
```

## Desarrollo local

Por defecto `capacitor.config.ts` apunta a `https://app.untoque.app` (producción).

Para testear cambios locales, editar `server.url` temporalmente:

```ts
server: {
  url: 'http://192.168.1.33:3000',  // IP local de la compu donde corre `pnpm --filter @untoque/app dev`
  cleartext: true,                   // solo dev
  androidScheme: 'http',
},
```

Después correr:
```bash
pnpm cap:sync android
pnpm cap:run android
```

> **Nunca** commitear el config con `url: http://...` y `cleartext: true`. Volver a `https://app.untoque.app` antes del PR.

## Release

Ver [`docs/mobile-setup.md`](../../docs/mobile-setup.md) para el flujo completo
de firma + publicación.

## Archivos generados (no commitear)

`cap add` crea las carpetas `android/` y `ios/` con proyectos nativos completos.
Estos NO se versionan — se regeneran con `pnpm cap:sync`. Ver `.gitignore`.

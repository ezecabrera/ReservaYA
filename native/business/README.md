# @untoque/native-business

Wrapper nativo del **panel del negocio** (`apps/panel/`). Se publica en Play
Store y App Store como **"Un Toque Negocios"**.

## Audiencia

Dueños y staff del restaurante — gestión operativa desde tablet o celular.
Ciclo de actualización lento (estabilidad > features nuevas) porque se usa
durante el servicio.

## Plugins nativos específicos

Además de los plugins base (splash, status bar, push, haptics, app):

- **Camera** — para tomar fotos del venue (galería del tab "Tu local") y, combinada con una librería JS como `jsqr`, escanear el QR del comensal en `/check-in`
- **Haptics** — feedback al confirmar reservas, check-ins, etc.

> El plugin `@capacitor/barcode-scanner` requiere Capacitor 7 (beta al momento
> de escribir). Hasta migrar, el check-in puede hacerse con Camera + `jsqr` en
> el cliente web, o con el input de token manual que ya existe.

## Uso

Idéntico al `native/client`. Desde `native/business/`:

```bash
pnpm cap:add:android       # 1ra vez
pnpm cap:add:ios           # 1ra vez, solo Mac
pnpm cap:sync              # cada vez que tocás capacitor.config.ts
pnpm cap:open:android      # abre Android Studio
pnpm cap:open:ios          # abre Xcode
```

## Desarrollo local

Editar `server.url` en `capacitor.config.ts`:

```ts
server: {
  url: 'http://192.168.1.33:3001',   // panel corre en :3001
  cleartext: true,
  androidScheme: 'http',
},
```

Después `pnpm cap:sync && pnpm cap:run android`.

## Permisos específicos

Antes de publicar, el `AndroidManifest.xml` y `Info.plist` deben declarar:

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

**iOS** (`ios/App/App/Info.plist`):
```xml
<key>NSCameraUsageDescription</key>
<string>Para escanear el QR del cliente al hacer check-in</string>
```

`cap add` los deja con permisos por defecto — hay que revisarlos antes del release.

## Archivos generados

Mismo patrón que `native/client`: `android/` y `ios/` se generan con `cap add`
y no se versionan.

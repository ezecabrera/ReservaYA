# Setup — Imágenes del local (`venue-photos`)

Esta guía deja la base de datos y el bucket de Storage listos para que el panel
pueda subir logo, cover y galería del venue.

## 1. Aplicar la migration `016_venue_images.sql`

1. Abrí Supabase Studio → **SQL Editor**.
2. Pegá el contenido de `supabase/migrations/016_venue_images.sql`.
3. Run. Debería crear:
   - tabla `venue_images`
   - índices únicos parciales (`venue_images_one_logo`, `venue_images_one_cover`)
   - trigger `trg_venue_images_gallery_max` (límite de 12 imágenes en galería)
   - función helper `venue_image_can_modify(image_id uuid)`
   - políticas RLS (`venue_images_select_public`, `venue_images_staff_*`)

> Si usás CI / `supabase db push` la migration se aplica sola.

## 2. Crear bucket `venue-photos` y RLS de Storage

El esquema `storage` de Supabase no se versiona como una migration normal. Por
eso el bucket y sus policies viven en un script separado:

1. Abrí **SQL Editor** otra vez.
2. Pegá `scripts/supabase-setup-storage.sql`.
3. Run.

Es **idempotente**: usa `ON CONFLICT` y `DROP POLICY IF EXISTS`, así que se puede
re-correr sin romper nada.

Configura:

- bucket `venue-photos` público
- `file_size_limit = 5MB`
- `allowed_mime_types = image/jpeg, image/png, image/webp`
- policies de read público + insert/update/delete restringido al staff del venue
  cuyo `id` aparece como primer segmento del `name` del objeto.

## 3. Verificar el bucket

Storage → Buckets → debería aparecer `venue-photos` con el badge `Public`.
Subí un archivo de prueba bajo `<algún_venue_id>/logo/test.jpg` y comprobá que
la URL pública responde 200.

## 4. Path pattern

Toda key dentro del bucket sigue este patrón:

```
{venue_id}/{kind}/{uuid}.{ext}
```

Ejemplo: `9b2c3d4e-…/gallery/4f5a-….webp`

El primer segmento (venue_id) es lo que las RLS de `storage.objects` usan para
permitir/denegar uploads.

## 5. Transformaciones on-the-fly

Supabase Storage soporta transforms en URL via query string. Para thumbnails
de la galería en el panel/app, sumá:

```
?width=400&quality=80
```

Otros parámetros útiles:

- `?height=300`
- `?resize=cover` o `?resize=contain`
- `?format=webp` (auto downgrade si el browser no soporta)

Ejemplo:

```
https://<project>.supabase.co/storage/v1/render/image/public/venue-photos/{venue_id}/cover/foo.jpg?width=1600&quality=85
```

## 6. Cardinalidad (recordatorio)

| kind     | máximo por venue |
|----------|------------------|
| logo     | 1                |
| cover    | 1                |
| gallery  | 12               |

Logo/cover se garantizan vía índices únicos parciales. Gallery se valida con un
trigger `BEFORE INSERT` que rechaza el row si ya hay 12 con `kind = 'gallery'`
para ese venue. La app debe atrapar ese error y mostrarlo como mensaje claro.

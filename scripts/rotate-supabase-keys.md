# Rotación del `SUPABASE_SERVICE_ROLE_KEY`

> **Por qué.** El service-role key estuvo committeado en `.env.example` antes
> del sanitizado. Aunque hoy el archivo tiene placeholders, la key sigue siendo
> válida y aparece en historia de Git. Hay que rotarla **antes de abrir prod**.
>
> **Riesgo si no se rota:** cualquiera con acceso al repo puede bypassear RLS
> y leer/escribir cualquier tabla.

## Checklist (no saltear pasos)

1. **Login en Supabase Studio** → proyecto `nmrvoonkxekogxrhlays` →
   `Project Settings` → `API`.

2. En la sección **Project API keys**, click **`Generate new service_role key`**.
   Confirmá el modal (te pide tipear el nombre del proyecto).

3. **Copiá el nuevo key inmediatamente** al portapapeles.
   ⚠ **NO cierres la pestaña** hasta haber pegado el valor en Vercel —
   Supabase no muestra el secreto dos veces.

4. En otra terminal, remové el key viejo de los 3 environments de Vercel:

   ```bash
   vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes
   vercel env rm SUPABASE_SERVICE_ROLE_KEY preview --yes
   vercel env rm SUPABASE_SERVICE_ROLE_KEY development --yes
   ```

5. Agregá el nuevo key en los 3 environments:

   ```bash
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY preview
   vercel env add SUPABASE_SERVICE_ROLE_KEY development
   ```

   (Pegá el valor cuando lo pida.)

6. **Redeploy a producción:**

   ```bash
   vercel --prod
   ```

7. **Smoke test post-deploy:**
   - Abrí `https://panel.deuntoque.com/dashboard` y verificá login.
   - Crear un test reservation desde `https://app.deuntoque.com/{venueId}`.
   - Confirmá que el webhook MP responde 200 OK desde el dashboard de MP.

8. Volvé a la pestaña de Supabase Studio (paso 1) y click **`Revoke old key`**.
   A partir de acá la key vieja deja de funcionar.

9. **Sanitizar `.env.example`** — confirmar que las 3 copias tengan placeholders:

   ```bash
   grep -nE 'SUPABASE_SERVICE_ROLE_KEY=' .env.example app/.env.example panel/.env.example
   ```

   Esperado: las 3 deben mostrar `XXXX_ROTATE_BEFORE_PROD` o
   `XXXX_REPLACE_WITH_SERVICE_ROLE_KEY`. Si alguna trae el JWT real
   (`eyJ...`), reemplazala manualmente.

10. **Commit del sanitizado:**

    ```bash
    git add .env.example app/.env.example panel/.env.example
    git commit -m "chore(security): rotate service_role + sanitize env example"
    ```

## Rollback

Si algo se rompe entre paso 6 y 8, **no revocaste todavía la key vieja**, así
que podés volver atrás:

```bash
vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes
# ...y agregar de nuevo la vieja
```

Una vez ejecutado el paso 8 ya no hay vuelta — habría que generar otra key
nueva.

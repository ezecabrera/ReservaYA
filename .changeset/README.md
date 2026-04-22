# Changesets

Los cambios que impactan a usuarios finales (features nuevas, bug fixes, cambios visibles) deben incluir un **changeset**.

## Cómo agregar un changeset

Cuando hacés un cambio que merece aparecer en el CHANGELOG, corré:

```bash
pnpm changeset
```

La CLI te pregunta:
1. **Qué packages impacta** (app, panel, ambos, etc.)
2. **Tipo de cambio**: major / minor / patch (semver)
   - `major`: breaking change (raro en MVP)
   - `minor`: feature nueva (`feat:`)
   - `patch`: bug fix (`fix:`)
3. **Descripción** para el changelog — **en español, orientada al usuario**

Genera un archivo en `.changeset/<nombre-random>.md`. Lo commiteás con el resto del PR.

## Cómo se aplican

Cuando mergés a `main`, otro PR automático ("Version packages") agrupa los changesets pendientes, actualiza las versiones y regenera `docs/CHANGELOG.md`. Mergeando ese PR dispara la release.

## Cuándo NO hace falta

- Refactors internos que no cambian comportamiento
- Cambios de docs
- Ajustes de CI / tooling
- Actualización de deps sin impacto de funcionalidad

Para esos casos usá solo commits `chore:` o `docs:`.

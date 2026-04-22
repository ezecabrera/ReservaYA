<!--
  Gracias por contribuir a Un Toque.
  Completá cada sección. Si alguna no aplica, dejá "N/A" — no la borres.
-->

## 🎯 Qué cambia

<!-- Descripción breve (1-3 líneas). El "qué" y el "por qué". -->



## 🧪 Cómo probarlo

<!-- Pasos concretos para que el reviewer valide el cambio. -->

1.
2.
3.

## 📸 Screenshots / Videos

<!-- Obligatorio si hay cambios visuales. Mobile + desktop si aplica. -->

| Antes | Después |
|---|---|
|       |         |

## ✅ Checklist

- [ ] CI verde (type-check + lint + build)
- [ ] Probado en mobile (<1024px) y desktop (≥1024px) si aplica
- [ ] No rompe pantallas existentes
- [ ] Commits siguen Conventional Commits (`feat:`, `fix:`, `chore:`...)
- [ ] Si agrega feature o fix relevante: incluye un **changeset** (`pnpm changeset`)
- [ ] Si cambia la DB: nueva migración en `supabase/migrations/` y `APPLY_PILOT.sql` regenerado
- [ ] Si cambia env vars: actualicé `.env.example` y `docs/`
- [ ] Si afecta apps nativas: testeé en `native/client` o `native/business` con `cap sync`

## 🔗 Contexto

<!-- Linear / issue relacionado, discusión previa, link al diseño. -->

Closes #

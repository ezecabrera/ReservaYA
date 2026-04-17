# Credenciales — entorno de testing

Generado: 2026-04-17T02:54:04.244Z

> Todas las cuentas son ficticias. Dominio `@demo.reservaya.test` no enruta.


## 🎯 Cuenta tester (login rápido en la PWA)

- **Email:** `test@reservaya.test`
- **Password:** `Test1234!`
- **Nombre:** Tester ReservaYA
- **Uso:** Login en http://localhost:3010/login para probar reservas


## 🏪 Negocios — cuentas staff (owner)

| # | Negocio | Cocina | Email | Password | Dirección |
|---|---------|--------|-------|----------|-----------|
| 1 | Trattoria Sentori | pastas | `owner-01@demo.reservaya.test` | `Demo1234!` | Thames 1845, Palermo, CABA |
| 2 | Pasta Madre | pastas | `owner-02@demo.reservaya.test` | `Demo1234!` | Murillo 770, Villa Crespo, CABA |
| 3 | Nonna Beatrice | pastas | `owner-03@demo.reservaya.test` | `Demo1234!` | Defensa 980, San Telmo, CABA |
| 4 | Fuoco & Farina | pastas | `owner-04@demo.reservaya.test` | `Demo1234!` | Av. Forest 1124, Colegiales, CABA |
| 5 | El Fogón del Sur | carnes | `owner-05@demo.reservaya.test` | `Demo1234!` | Av. Callao 1345, Recoleta, CABA |
| 6 | Bodegón Los Álamos | carnes | `owner-06@demo.reservaya.test` | `Demo1234!` | Av. Boedo 876, Boedo, CABA |
| 7 | Cortes del 9 | carnes | `owner-07@demo.reservaya.test` | `Demo1234!` | Olga Cossettini 1551, Puerto Madero, CABA |
| 8 | Asador Don Ramiro | carnes | `owner-08@demo.reservaya.test` | `Demo1234!` | Cabildo 2345, Belgrano, CABA |
| 9 | La Pizzería de Almagro | pizza | `owner-09@demo.reservaya.test` | `Demo1234!` | Av. Medrano 820, Almagro, CABA |
| 10 | Napoli Forno | pizza | `owner-10@demo.reservaya.test` | `Demo1234!` | Av. Triunvirato 3980, Villa Urquiza, CABA |
| 11 | Piedra Viva | pizza | `owner-11@demo.reservaya.test` | `Demo1234!` | Av. Rivadavia 4890, Caballito, CABA |
| 12 | Fugazzeta Reina | pizza | `owner-12@demo.reservaya.test` | `Demo1234!` | Av. Álvarez Thomas 1220, Chacarita, CABA |
| 13 | Verde de Mercado | vegano | `owner-13@demo.reservaya.test` | `Demo1234!` | Honduras 5530, Palermo Soho, CABA |
| 14 | Bowl Verde | vegano | `owner-14@demo.reservaya.test` | `Demo1234!` | Scalabrini Ortiz 1055, Villa Crespo, CABA |
| 15 | Raíz Vegana | vegano | `owner-15@demo.reservaya.test` | `Demo1234!` | Congreso 3220, Coghlan, CABA |
| 16 | Crudo y Wok | vegano | `owner-16@demo.reservaya.test` | `Demo1234!` | Av. Cabildo 3890, Núñez, CABA |
| 17 | Niko Sushi Bar | sushi | `owner-17@demo.reservaya.test` | `Demo1234!` | Gorriti 5680, Palermo Hollywood, CABA |
| 18 | Omakase Kintaro | sushi | `owner-18@demo.reservaya.test` | `Demo1234!` | Guido 1820, Recoleta, CABA |
| 19 | Rolls Fusión Cabildo | sushi | `owner-19@demo.reservaya.test` | `Demo1234!` | Av. Cabildo 2680, Belgrano, CABA |
| 20 | Sushi & Ramen Ao | sushi | `owner-20@demo.reservaya.test` | `Demo1234!` | Av. Acoyte 340, Caballito, CABA |

> Login del panel: http://localhost:3011/login


## 👥 Usuarios cliente (login en PWA)

| # | Nombre | Email | Password | Teléfono |
|---|--------|-------|----------|----------|
| 1 | Martina Álvarez | `cliente-01@demo.reservaya.test` | `Demo1234!` | +54 11 4100-1000 |
| 2 | Joaquín Pereyra | `cliente-02@demo.reservaya.test` | `Demo1234!` | +54 11 4101-1001 |
| 3 | Sofía Ledesma | `cliente-03@demo.reservaya.test` | `Demo1234!` | +54 11 4102-1002 |
| 4 | Lucas Bermúdez | `cliente-04@demo.reservaya.test` | `Demo1234!` | +54 11 4103-1003 |
| 5 | Camila Ibáñez | `cliente-05@demo.reservaya.test` | `Demo1234!` | +54 11 4104-1004 |
| 6 | Nicolás Ferraro | `cliente-06@demo.reservaya.test` | `Demo1234!` | +54 11 4105-1005 |
| 7 | Valentina Ruíz | `cliente-07@demo.reservaya.test` | `Demo1234!` | +54 11 4106-1006 |
| 8 | Matías Quintana | `cliente-08@demo.reservaya.test` | `Demo1234!` | +54 11 4107-1007 |
| 9 | Julieta Soriano | `cliente-09@demo.reservaya.test` | `Demo1234!` | +54 11 4108-1008 |
| 10 | Tomás Espinosa | `cliente-10@demo.reservaya.test` | `Demo1234!` | +54 11 4109-1009 |

## 🔁 Cómo resetear

```bash
pnpm seed:demo:reset
```

Esto borra todos los datos con UUID `dec0...` y cuentas `@demo.reservaya.test` + la cuenta tester. No toca La Cantina ni datos productivos.

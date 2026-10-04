<div align="center">

# FINTÚ & CO.

[![CI](https://github.com/SebastianLima-PE/Fintu-Co/actions/workflows/ci.yml/badge.svg)](https://github.com/SebastianLima-PE/Fintu-Co/actions/workflows/ci.yml)

**No pagues intereses de más.**
Gestiona la deuda, los ciclos de facturación y los pagos de tus tarjetas de crédito, sin conectar tu banco.

<a href="https://fintu-co.pages.dev/"><img src="https://img.shields.io/badge/Ver_en_vivo-fintu--co.pages.dev-d4af37?style=for-the-badge&labelColor=0a0a0a"/></a>

<img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=0a0a0a"/>
<img src="https://img.shields.io/badge/Vite_7-646CFF?style=flat-square&logo=vite&logoColor=white"/>
<img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white"/>
<img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white"/>
<img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white"/>
<img src="https://img.shields.io/badge/PayPal-00457C?style=flat-square&logo=paypal&logoColor=white"/>
<img src="https://img.shields.io/badge/Vitest-29_tests-6E9F18?style=flat-square&logo=vitest&logoColor=white"/>
<img src="https://img.shields.io/badge/Cloudflare_Pages-F38020?style=flat-square&logo=cloudflare&logoColor=white"/>

<br/><br/>

<img src="./docs/landing.png" width="100%" alt="Landing de Fintú & Co."/>

</div>

## ¿Qué es?

Fintú es una aplicación web para personas en el **Perú** que usan tarjetas de crédito y no quieren pagar intereses por despiste. Registras tus tarjetas y movimientos, y la app te muestra en qué punto del ciclo estás, cuánto debes, cuándo pagar y cómo va tu salud financiera. **No pide credenciales bancarias**: todo lo ingresa el usuario.

## Funcionalidades

- 💳 **Tarjetas**: registro por banco, línea de crédito, fechas de corte y de pago, deuda actual.
- 🧾 **Movimientos**: consumos y pagos por tarjeta y por rango de fechas, con limpieza automática programada.
- 📊 **Analítica**: gráficos de uso por tarjeta, análisis del ciclo de facturación y el **Fintú Score** (0–100).
- 🎯 **Metas de ahorro y pago**, con seguimiento de progreso.
- 🎓 **Sección educativa** para quien recién empieza con tarjetas: un recorrido paso a paso y un comparador con/sin garantía.
- 🔐 **Cuentas**: registro, login con JWT, cambio y recuperación de contraseña por correo.
- 💰 **Pago único con PayPal**: el backend confirma la orden con PayPal antes de activar la cuenta.

## Arquitectura

Monorepo con dos paquetes que se despliegan por separado:

```
CreditSmart-PE/
├── creditsmart-frontend/   React 19 + Vite · SPA en Cloudflare Pages
│   └── src/modules/        landing · auth · cards · movements · analytics · goals · education
└── creditsmart-backend/    Node.js + Express 5 · API REST
    └── src/modules/        auth · cards · movements · analytics · goals
        └── <módulo>/       domain · application · infrastructure · interfaces
```

El backend está organizado **por módulos de dominio (DDD)**. Cada módulo separa:

- **domain**: entidades y reglas del negocio.
- **application**: casos de uso, por ejemplo `ForgotPassword`.
- **infrastructure**: repositorios MySQL.
- **interfaces**: rutas y controladores HTTP.

| Recurso | Endpoints principales |
|---|---|
| `/api/auth` | `register`, `register-with-payment`, `login`, `forgot-password`, `reset-password`, `change-password`, `profile` |
| `/api/cards` | crear, actualizar, eliminar, `bancos`, `update-deuda`, `sentinel` |
| `/api/movements` | por tarjeta, por rango, por ciclo, `cleanup` |
| `/api/analytics` | `stats`, `chart`, `chart-detailed`, `usage-analysis` |
| `/api/goals` | crear, `progreso`, `completar` |

**Seguridad:** las contraseñas se guardan con bcrypt y las rutas privadas exigen un JWT. El *secret* de PayPal vive solo en el backend, y CORS está restringido a la URL del frontend.

## Correrlo en local

Necesitas **Node 22+** y **MySQL 8**.

```bash
# Backend: crea la base y las tablas al arrancar
cd creditsmart-backend
cp .env.example .env      # completa DB_PASSWORD, JWT_SECRET y las credenciales sandbox de PayPal
npm install
npm run dev               # http://localhost:5000

# Frontend
cd ../creditsmart-frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Tests del backend (Vitest, 29 casos): `npm test`.

Sin SMTP configurado, el código de recuperación de contraseña se imprime en la consola del backend.

## Despliegue

- **CI**: GitHub Actions corre los tests del backend y el build del frontend en cada push y PR a `master`.
- **Frontend**: Cloudflare Pages, con despliegue automático en cada push a `master`.
- **Backend**: preparado para Railway + MySQL (ver [DEPLOY.md](./DEPLOY.md)). No va en serverless porque usa un pool de conexiones persistente y una tarea programada diaria.

---

<div align="center">
Hecho por <a href="https://github.com/SebastianLima-PE"><b>Sebastian Pariachi</b></a> · Ing. de Software, UPC · Lima, Perú
</div>

# Despliegue — CreditSmart PE

Monorepo con dos paquetes que se despliegan por separado:

| Paquete | Dónde | Por qué |
|---|---|---|
| `creditsmart-backend` | Railway | Necesita proceso persistente |
| `creditsmart-frontend` | Vercel | SPA estática |

> **El backend no puede ir en serverless.** Usa un pool de MySQL con `keepAlive`
> y un `setInterval` diario (limpieza de movimientos). En serverless el pool se
> recrea en cada invocación y el scheduler nunca llega a correr.

El orden importa: **primero el backend**, porque el frontend necesita su URL.

---

## 1. Backend en Railway

### 1.1 Base de datos

En el proyecto de Railway: **New → Database → MySQL**. Railway expone las
variables de conexión; no hace falta cargar `schema.sql` a mano, porque
`initDatabase.js` crea la base y las tablas al arrancar si no existen.

### 1.2 Servicio

**New → GitHub Repo** y selecciona el repo. Como es un monorepo, en
*Settings → Root Directory* pon:

```
creditsmart-backend
```

Railway detecta Node y usa `npm start` (que ya apunta a `src/server.js`).

### 1.3 Variables de entorno

En *Variables*. Las de MySQL se enlazan a la base con la sintaxis `${{...}}`:

```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_PORT=${{MySQL.MYSQLPORT}}

JWT_SECRET=            # genera uno largo y aleatorio, distinto al de desarrollo
FRONTEND_URL=          # se rellena en el paso 3

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=             # contraseña de aplicación, no la de tu cuenta
SMTP_FROM=

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_API_BASE=https://api-m.paypal.com    # producción (sandbox: api-m.sandbox.paypal.com)
PAYPAL_EXPECTED_USD=4.00
```

No definas `PORT`: Railway la inyecta y `server.js` ya la lee.

### 1.4 Verificar

Genera el dominio en *Settings → Networking → Generate Domain* y abre la raíz:

```json
{ "message": "CreditSmart PE API funcionando correctamente" }
```

Anota esa URL para el paso 2.

---

## 2. Frontend en Vercel

**Add New → Project**, importa el repo, y en *Root Directory*:

```
creditsmart-frontend
```

Vercel detecta Vite solo. Variables de entorno:

```
VITE_API_URL=https://tu-backend.up.railway.app     # sin barra final
VITE_PAYPAL_CLIENT_ID=
```

> `VITE_API_URL` se inyecta **en build**, no en runtime. Si la cambias después,
> hay que redesplegar para que tenga efecto.

---

## 3. Cerrar el círculo (CORS)

Vuelve a Railway y pon `FRONTEND_URL` con el dominio exacto de Vercel:

```
FRONTEND_URL=https://tu-app.vercel.app
```

Exacto quiere decir: **con `https://` y sin barra final**. `server.js` lo pasa
tal cual como `origin` de CORS; si no coincide carácter por carácter, el
navegador bloquea cada petición.

**Gotcha de los previews:** Vercel genera una URL distinta por cada rama y cada
PR (`tu-app-git-rama.vercel.app`). Como `FRONTEND_URL` admite un solo origen,
los previews quedan bloqueados por CORS. Si los necesitas, hay que cambiar
`corsOptions.origin` en `server.js` por una función que valide contra una lista
o un patrón.

---

## 4. Comprobación post-despliegue

1. Registro y login (valida JWT + SMTP si usas recuperación de contraseña)
2. Crear una tarjeta y registrar un movimiento **con fecha atrasada** — debe
   caer en el estado de cuenta del ciclo correspondiente, no en el vigente
3. Exportar el PDF — el rango del encabezado debe coincidir con los movimientos
   listados
4. Abrir el calendario de ciclo en una tarjeta con cierre 30 o 31
5. Revisar los logs de Railway: debe aparecer
   `⏰ Tareas programadas activas (limpieza de movimientos: cada 24 h)`

---

## Antes de cada despliegue

```bash
cd creditsmart-backend  && npm test
cd creditsmart-frontend && npm test && npm run build
```

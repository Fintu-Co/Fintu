# fintu-landing

Landing pública de Fintú & Co. (React 19 + Vite), desplegada en Cloudflare Pages.
Los botones de "Iniciar sesión" y "Comenzar" llevan a la app (`fintu-app`), cuya URL se define en `VITE_APP_URL`.

La documentación del proyecto está en el [README principal](../README.md) y el despliegue en [DEPLOY.md](../DEPLOY.md).

```bash
cp .env.example .env
npm install
npm run dev     # http://localhost:5174
npm run build
```

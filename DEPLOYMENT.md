# 🚀 Guía de Despliegue - Detramites

Esta guía te ayudará a desplegar el frontend en Vercel y el backend en Railway.

## 📋 Pre-requisitos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Railway](https://railway.app)
- Base de datos PostgreSQL (Railway incluye una gratis)
- Repositorio Git (GitHub, GitLab o Bitbucket)

---

## 🔧 Backend en Railway

### 1. Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway a acceder a tu repositorio
5. Selecciona el repositorio `plataforma`

### 2. Agregar Base de Datos PostgreSQL

1. En tu proyecto de Railway, click en "+ New"
2. Selecciona "Database" → "PostgreSQL"
3. Railway creará automáticamente la base de datos
4. La variable `DATABASE_URL` se agregará automáticamente

### 3. Configurar Variables de Entorno

En la pestaña "Variables" de tu servicio backend, agrega:

```env
DATABASE_URL=postgresql://... (se agrega automáticamente)
JWT_SECRET=tu_secreto_super_seguro_aqui_cambialo
JWT_EXPIRES_IN=24h
PORT=4000
NODE_ENV=production
```

**⚠️ IMPORTANTE:** Genera un JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Configurar Build Settings

Railway detectará automáticamente que es un proyecto Node.js. Asegúrate de:

1. Root Directory: `/backend`
2. Build Command: `npm install && npx prisma generate && npm run build`
3. Start Command: `npx prisma migrate deploy && npm run seed:production && node dist/index.js`

### 5. Desplegar

1. Railway desplegará automáticamente cuando hagas push al repositorio
2. La primera vez ejecutará las migraciones y creará el superadmin master
3. Toma nota de la URL generada (ej: `https://tu-proyecto.up.railway.app`)

### 6. Credenciales Iniciales

Después del primer despliegue:
- **Usuario:** `admin_master`
- **Contraseña:** `Admin2025!`

**⚠️ CAMBIA LA CONTRASEÑA INMEDIATAMENTE DESPUÉS DEL PRIMER LOGIN**

---

## 🎨 Frontend en Vercel

### 1. Preparar el Proyecto

Asegúrate de que el archivo `.env.local` en la raíz del proyecto tenga:

```env
NEXT_PUBLIC_API_URL=https://tu-proyecto.up.railway.app
```

### 2. Desplegar en Vercel

#### Opción A: CLI de Vercel

```bash
cd /home/wal/plataforma
npm install -g vercel
vercel login
vercel
```

Sigue las instrucciones:
- Setup and deploy: Yes
- Which scope: tu cuenta
- Link to existing project: No
- Project name: detramites (o el que prefieras)
- Directory: `./` (raíz)
- Override settings: No

#### Opción B: Dashboard de Vercel

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click en "Add New" → "Project"
3. Importa tu repositorio de Git
4. Configura el proyecto:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (raíz del proyecto)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### 3. Configurar Variables de Entorno

En el dashboard de Vercel, ve a "Settings" → "Environment Variables" y agrega:

```
NEXT_PUBLIC_API_URL = https://tu-proyecto.up.railway.app
```

**⚠️ IMPORTANTE:** Usa la URL de Railway (sin barra al final)

### 4. Redesplegar

Si ya desplegaste antes de agregar las variables:
- Ve a "Deployments"
- Click en los 3 puntos del último deployment
- Click en "Redeploy"

---

## 🔒 Configurar Firewall en Vercel

### Opción 1: Vercel Firewall (Requiere plan Pro)

1. Ve a tu proyecto en Vercel
2. Settings → Firewall
3. Habilita las siguientes protecciones:
   - **DDoS Protection:** ON
   - **Rate Limiting:** ON (configura límites apropiados)
   - **IP Blocking:** Agrega IPs sospechosas si es necesario
   - **Geographic Restrictions:** Opcional (limita a países específicos)

### Opción 2: Cloudflare (Gratis)

1. Crea cuenta en [Cloudflare](https://cloudflare.com)
2. Agrega tu dominio
3. Configura los nameservers según Cloudflare indique
4. En Vercel, ve a Settings → Domains y agrega tu dominio de Cloudflare
5. En Cloudflare:
   - **SSL/TLS:** Full
   - **Firewall Rules:** Crea reglas personalizadas
   - **Rate Limiting:** Configura límites
   - **WAF:** Habilita protección contra ataques

---

## 🧪 Verificar Despliegue

### Backend

```bash
curl https://tu-proyecto.up.railway.app/health
```

Deberías recibir:
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T...",
  "uptime": 123.45
}
```

### Frontend

1. Abre tu URL de Vercel en el navegador
2. Deberías ver la página de login
3. Inicia sesión con:
   - Usuario: `admin_master`
   - Contraseña: `Admin2025!`

---

## 📊 Monitoreo

### Railway

- **Logs:** Railway → Tu Servicio → Logs
- **Métricas:** Railway → Tu Servicio → Metrics
- **Base de Datos:** Railway → PostgreSQL → Metrics

### Vercel

- **Analytics:** Vercel → Tu Proyecto → Analytics
- **Logs:** Vercel → Tu Proyecto → Deployments → View Logs
- **Speed Insights:** Vercel → Tu Proyecto → Speed Insights

---

## 🔄 Actualizar Aplicación

### Método Automático (Recomendado)

1. Haz cambios en tu código
2. Commit y push a tu repositorio:
```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```
3. Railway y Vercel desplegarán automáticamente

### Método Manual

#### Railway:
```bash
cd backend
railway up
```

#### Vercel:
```bash
vercel --prod
```

---

## 🆘 Troubleshooting

### Error: "Database connection failed"

1. Verifica que la variable `DATABASE_URL` esté configurada en Railway
2. Asegúrate de que el servicio PostgreSQL esté running
3. Revisa los logs: `railway logs`

### Error: "CORS policy"

1. Ve a `backend/src/index.ts`
2. Actualiza la configuración de CORS con tu dominio de Vercel:
```typescript
app.use(cors({
  origin: ['https://tu-dominio.vercel.app'],
  credentials: true
}));
```

### Frontend no conecta al backend

1. Verifica que `NEXT_PUBLIC_API_URL` esté configurada en Vercel
2. Asegúrate de que la URL no tenga barra al final
3. Redesplegar en Vercel después de cambiar variables

---

## 📝 Notas Importantes

1. **Seguridad:**
   - Cambia la contraseña del superadmin inmediatamente
   - Usa contraseñas fuertes para todos los usuarios
   - Habilita 2FA en Railway y Vercel si está disponible

2. **Créditos Infinitos:**
   - Los superadmins (MASTER y SECONDARY) tienen créditos infinitos
   - No necesitan que se les asignen créditos

3. **Base de Datos:**
   - Railway ofrece 5GB gratis de PostgreSQL
   - Considera hacer backups regulares
   - Usa `railway run npx prisma studio` para administrar datos

4. **Costos:**
   - Vercel: Plan Hobby es gratis (límites generosos)
   - Railway: $5/mes de crédito gratis, luego pay-as-you-go
   - Estima ~$10-20/mes para tráfico moderado

---

## 🎉 ¡Listo!

Tu aplicación está desplegada y lista para producción. Recuerda:

✅ Cambiar contraseña del admin
✅ Crear usuarios adicionales desde el panel
✅ Monitorear logs regularmente
✅ Hacer backups de la base de datos
✅ Actualizar dependencias periódicamente

**¿Problemas?** Revisa los logs de Railway y Vercel para más detalles.

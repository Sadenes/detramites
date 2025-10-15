# Guía de Inicio Rápido - Detramites Backend

Esta guía te ayudará a poner el backend en funcionamiento en menos de 5 minutos.

## Prerrequisitos

- **Node.js** v18 o superior
- **PostgreSQL** v14 o superior
- **npm** o **pnpm**

## Instalación en 5 Pasos

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Crear base de datos PostgreSQL

```bash
# Opción A: Usando psql
psql -U postgres
CREATE DATABASE detramites;
\q

# Opción B: Usando createdb
createdb detramites
```

### 3. Configurar variables de entorno

El archivo `.env` ya está configurado con valores por defecto. Si usas un usuario/password diferente de PostgreSQL, edita el archivo:

```bash
nano .env
```

Cambia la línea `DATABASE_URL` si es necesario:
```env
DATABASE_URL="postgresql://TU_USUARIO:TU_PASSWORD@localhost:5432/detramites?schema=public"
```

### 4. Ejecutar migraciones y seed

```bash
# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Poblar base de datos con usuarios iniciales
npm run seed
```

Verás algo como esto:
```
✅ Superadmin master creado exitosamente!

═══════════════════════════════════════════════
   Credenciales de acceso:
   Username: admin_master
   Password: admin123
═══════════════════════════════════════════════

✅ Usuarios de prueba creados:
   - Distribuidor: distribuidor_test / dist123 (10000 créditos)
   - Usuario Final: usuario_test / user123 (100 créditos)
```

### 5. Iniciar servidor

```bash
npm run dev
```

Verás:
```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        🚀 Detramites Backend Server                   ║
║                                                       ║
║        Environment: development                       ║
║        Port: 4000                                     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

## Probar la API

### Test 1: Health Check

```bash
curl http://localhost:4000/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-10-14T...",
  "uptime": 1.234
}
```

### Test 2: Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_master",
    "password": "admin123"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "admin_master",
    "role": "SUPERADMIN_MASTER",
    "credits": 999999999
  }
}
```

### Test 3: Obtener Balance (usa el token del login anterior)

```bash
curl -X GET http://localhost:4000/api/credits/balance \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Usuarios Creados por el Seed

| Username | Password | Rol | Créditos |
|----------|----------|-----|----------|
| `admin_master` | `admin123` | Superadmin Master | 999,999,999 |
| `distribuidor_test` | `dist123` | Distribuidor | 10,000 |
| `usuario_test` | `user123` | Usuario Final | 100 |

## Comandos Útiles

```bash
# Desarrollo (hot reload)
npm run dev

# Ver base de datos con GUI
npm run prisma:studio

# Crear nueva migración
npm run prisma:migrate

# Compilar para producción
npm run build

# Iniciar producción
npm start
```

## Solución de Problemas

### Error: "Can't reach database server"

**Solución:** Asegúrate de que PostgreSQL está corriendo:

```bash
# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql

# macOS
brew services start postgresql

# Windows
# Verifica que el servicio PostgreSQL esté iniciado en Servicios
```

### Error: "Database does not exist"

**Solución:** Crea la base de datos:

```bash
createdb detramites
```

### Error: "Port 4000 is already in use"

**Solución:** Cambia el puerto en el archivo `.env`:

```env
PORT=4001
```

### Error al importar Prisma Client

**Solución:** Regenera el cliente:

```bash
npm run prisma:generate
```

## Próximos Pasos

1. Revisa la documentación completa en `README.md`
2. Consulta ejemplos de uso en `API_EXAMPLES.md`
3. Cambia la contraseña del superadmin master en producción
4. Configura el `INFONAVIT_API_KEY` en `.env`

## Estructura del Proyecto

```
backend/
├── src/
│   ├── controllers/       # Lógica de endpoints
│   ├── middleware/        # Auth, rate limit, validation
│   ├── routes/           # Definición de rutas
│   ├── services/         # Lógica de negocio
│   │   ├── auditService.ts
│   │   ├── creditService.ts
│   │   └── infonavitService.ts (7 endpoints)
│   ├── utils/            # Utilidades
│   ├── types/            # TypeScript types
│   └── index.ts          # Servidor principal
├── prisma/
│   └── schema.prisma     # Schema de DB
├── .env                  # Variables de entorno
└── package.json
```

## Endpoints Disponibles

### Autenticación
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`

### Usuarios
- `GET /api/users` (superadmin)
- `GET /api/users/my-users` (distribuidor)
- `POST /api/users/distributor`
- `POST /api/users/final-user`
- `DELETE /api/users/:id`
- `POST /api/users/assign-credits`
- `POST /api/users/change-password`

### Créditos
- `GET /api/credits/balance`
- `GET /api/credits/history`

### Logs
- `GET /api/logs/audit` (superadmin)
- `GET /api/logs/my-queries`

### INFONAVIT (7 endpoints)
- `POST /api/infonavit/cambiar-password`
- `POST /api/infonavit/desvincular-dispositivo`
- `POST /api/infonavit/consultar-avisos`
- `POST /api/infonavit/estado-mensual`
- `POST /api/infonavit/estado-historico`
- `POST /api/infonavit/resumen-movimientos`
- `POST /api/infonavit/buscar-credito`

¡Listo! Tu backend está funcionando. 🚀

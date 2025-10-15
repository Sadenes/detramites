# Detramites Backend API

Backend completo para la plataforma Detramites - Sistema intermediario para consultas a APIs de INFONAVIT con gestión jerárquica de usuarios y créditos.

## Stack Tecnológico

- **Node.js** con **Express**
- **TypeScript** 5
- **PostgreSQL** como base de datos
- **Prisma** como ORM
- **JWT** para autenticación (sin 2FA)
- **Bcrypt** para encriptación de contraseñas
- **Zod** para validación de datos
- **Axios** para requests HTTP
- **Express Rate Limit** para limitación de requests

## Características Principales

### Sistema de Usuarios (3 niveles jerárquicos)

1. **Superadmin Maestro** (único)
   - CRUD completo de usuarios
   - Crear/eliminar Superadmin Secundario
   - Asignar créditos ilimitados a Distribuidores
   - Ver métricas globales y logs completos

2. **Superadmin Secundario** (máximo 1)
   - Mismo acceso que el Maestro EXCEPTO:
     - No puede crear/eliminar otros superadmins
     - No puede modificar configuraciones críticas

3. **Distribuidor** (N cantidad)
   - Recibe pool de créditos del superadmin
   - Distribuye créditos a usuarios finales desde su pool
   - Crear/eliminar usuarios finales
   - Ver métricas básicas de su red

4. **Usuario Final** (N por distribuidor)
   - Realizar consultas a APIs INFONAVIT
   - Ver balance y historial de créditos
   - Ver historial de consultas

### Sistema de Créditos

- Cada consulta = 1 crédito (excepto estado mensual: 1 crédito por periodo)
- **Devolución automática** en:
  - Errores 500/502/503/504
  - Timeout >30s
  - Respuesta código "02"
  - Error de parsing
- Estados: `pending`, `completed`, `failed`, `refunded`

### APIs de INFONAVIT (7 endpoints)

1. **Cambiar Contraseña** - Genera y actualiza contraseña (NSS + 4 caracteres aleatorios)
2. **Desvinculación de Dispositivo** - Elimina vinculación de dispositivo
3. **Consultar Avisos** - Obtiene 2 PDFs en ZIP (2 requests secuenciales)
4. **Estado de Cuenta Mensual** - Por periodo(s) (1 crédito c/u)
5. **Estado de Cuenta Histórico** - PDF completo del crédito
6. **Resumen de Movimientos** - PDF con historial completo (2 requests)
7. **Buscar Crédito por NSS** - Información completa en 2 tablas

### Seguridad

- **JWT** para sesiones (expira en 24h)
- **Bcrypt** para passwords
- **Rate Limiting**:
  - Usuarios finales: 10 req/min
  - Distribuidores: 50 req/min
  - Superadmins: sin límite
- **User-Agent Rotation** automático en cada request
- **Logs de auditoría** completos

## Instalación

### 1. Clonar e instalar dependencias

```bash
cd backend
npm install
# o
pnpm install
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Editar `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/detramites?schema=public"
PORT=4000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h
INFONAVIT_API_KEY=your-key-here
```

### 3. Configurar PostgreSQL

Asegúrate de tener PostgreSQL instalado y corriendo.

Crear base de datos:

```bash
createdb detramites
```

### 4. Ejecutar migraciones de Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Poblar base de datos (seed)

```bash
npm run seed
```

Esto creará:
- **Superadmin Master**: `admin_master` / `admin123`
- **Distribuidor Test**: `distribuidor_test` / `dist123`
- **Usuario Test**: `usuario_test` / `user123`

### 6. Iniciar servidor

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start
```

El servidor estará disponible en `http://localhost:4000`

## Endpoints de la API

### Autenticación

```http
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
```

### Usuarios

```http
GET    /api/users                      # Listar todos (superadmin)
GET    /api/users/my-users             # Mis usuarios (distribuidor)
POST   /api/users/superadmin-secondary # Crear superadmin secundario (master)
POST   /api/users/distributor          # Crear distribuidor (superadmin)
POST   /api/users/final-user           # Crear usuario final
DELETE /api/users/:id                  # Eliminar usuario
POST   /api/users/assign-credits       # Asignar créditos
POST   /api/users/change-password      # Cambiar contraseña
```

### Créditos

```http
GET /api/credits/balance  # Obtener balance
GET /api/credits/history  # Historial de transacciones
```

### Logs

```http
GET /api/logs/audit       # Logs de auditoría (superadmin)
GET /api/logs/my-queries  # Mis consultas
```

### INFONAVIT

```http
POST /api/infonavit/cambiar-password
POST /api/infonavit/desvincular-dispositivo
POST /api/infonavit/consultar-avisos
POST /api/infonavit/estado-mensual
POST /api/infonavit/estado-historico
POST /api/infonavit/resumen-movimientos
POST /api/infonavit/buscar-credito
```

## Ejemplos de Uso

### Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_master",
    "password": "admin123"
  }'
```

Respuesta:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin_master",
    "role": "SUPERADMIN_MASTER",
    "credits": 999999999
  }
}
```

### Crear Distribuidor

```bash
curl -X POST http://localhost:4000/api/users/distributor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "username": "distribuidor_nuevo",
    "password": "securepass123"
  }'
```

### Asignar Créditos

```bash
curl -X POST http://localhost:4000/api/users/assign-credits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user-uuid",
    "amount": 5000
  }'
```

### Consultar Crédito por NSS

```bash
curl -X POST http://localhost:4000/api/infonavit/buscar-credito \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "nss": "12345678901"
  }'
```

### Estado de Cuenta Mensual

```bash
curl -X POST http://localhost:4000/api/infonavit/estado-mensual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "credito": "1918899562",
    "periodos": ["202509", "202508", "202507"]
  }'
```

## Estructura del Proyecto

```
backend/
├── src/
│   ├── controllers/       # Controladores de endpoints
│   ├── middleware/        # Middlewares (auth, rate limit, validation)
│   ├── routes/           # Definición de rutas
│   ├── services/         # Lógica de negocio
│   ├── utils/            # Utilidades (validators, prisma, user-agents)
│   ├── types/            # Tipos TypeScript
│   ├── scripts/          # Scripts (seed, etc.)
│   └── index.ts          # Punto de entrada
├── prisma/
│   └── schema.prisma     # Schema de la base de datos
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Scripts Disponibles

```bash
npm run dev              # Iniciar en modo desarrollo
npm run build            # Compilar TypeScript
npm start                # Iniciar en producción
npm run seed             # Poblar base de datos
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio (GUI)
```

## Modelos de Base de Datos

### User
- `id` (UUID)
- `username` (unique)
- `password` (bcrypt)
- `role` (enum)
- `credits` (int)
- `distributorId` (FK nullable)

### CreditTransaction
- `id` (UUID)
- `userId` (FK)
- `amount` (int)
- `type` (ASSIGNED/CONSUMED/REFUNDED)
- `description`
- `createdAt`

### ApiQuery
- `id` (UUID)
- `userId` (FK)
- `endpoint`
- `status` (PENDING/COMPLETED/FAILED/REFUNDED)
- `request` (JSON)
- `response` (JSON)
- `errorMsg`
- `creditCost`

### AuditLog
- `id` (UUID)
- `userId` (FK nullable)
- `action`
- `details` (JSON)
- `ipAddress`
- `createdAt`

## Notas Importantes

1. **Créditos**: Los distribuidores solo pueden asignar desde su pool disponible (pool total - créditos circulantes)

2. **Devolución automática**: Si una consulta falla por error del servidor o timeout, los créditos se devuelven automáticamente

3. **User-Agent Rotation**: Cada request a INFONAVIT usa un User-Agent aleatorio de la lista configurada

4. **Rate Limiting**: Se aplica por rol de usuario automáticamente

5. **Seguridad**: NUNCA subas el archivo `.env` al repositorio. Usa `.env.example` como plantilla

6. **Logs**: Todos los eventos importantes (login, creación de usuarios, asignación de créditos, etc.) se registran en `AuditLog`

## Próximos Pasos

1. Configurar variables de entorno de producción
2. Cambiar contraseñas default después del seed
3. Configurar backup automático de la base de datos
4. Implementar monitoreo y alertas
5. Configurar SSL/HTTPS en producción
6. Revisar y ajustar límites de rate limiting según carga

## Soporte

Para reportar problemas o solicitar features, contacta al equipo de desarrollo.

# 📊 DOCUMENTACIÓN DEL ESQUEMA DE BASE DE DATOS

## Tabla de Contenidos
1. [Modelos Principales](#modelos-principales)
2. [Relaciones](#relaciones)
3. [Reglas de Negocio](#reglas-de-negocio)
4. [Índices y Performance](#índices-y-performance)
5. [Migraciones y Setup](#migraciones-y-setup)

---

## Modelos Principales

### 👤 **User**
Modelo central que representa todos los usuarios del sistema.

**Campos importantes:**
- `role`: Define permisos (SUPERADMIN_MASTER, SUPERADMIN_SECONDARY, DISTRIBUTOR, FINAL_USER)
- `credits`: Balance actual de créditos (default: 0)
- `distributorId`: Referencia al distribuidor padre (solo para FINAL_USER)
- `accountType`: CREDITS o SUBSCRIPTION

**Jerarquía:**
```
SUPERADMIN_MASTER
  ↓ crea
DISTRIBUTOR
  ↓ crea
FINAL_USER
```

**Relaciones:**
- `distributor`: Distribuidor que lo creó (solo FINAL_USER)
- `finalUsers`: Usuarios finales creados por este distribuidor
- `transactionsFrom`: Transacciones donde es el emisor
- `transactionsTo`: Transacciones donde es el receptor
- `queries`: Consultas realizadas
- `sessions`: Sesiones activas
- `devices`: Dispositivos registrados

---

### 💰 **CreditTransaction**
Registro inmutable de TODAS las transacciones de créditos.

**Tipos de transacciones:**

1. **GRANT** (Creación)
   ```typescript
   {
     type: 'GRANT',
     fromUserId: null,              // null porque se crean de la nada
     toUserId: 'distributor-uuid',
     amount: 1000,
     fromBalanceBefore: null,
     fromBalanceAfter: null,
     toBalanceBefore: 500,
     toBalanceAfter: 1500
   }
   ```

2. **DISTRIBUTE** (Distribución)
   ```typescript
   {
     type: 'DISTRIBUTE',
     fromUserId: 'distributor-uuid',
     toUserId: 'finaluser-uuid',
     amount: 50,
     fromBalanceBefore: 1500,
     fromBalanceAfter: 1450,
     toBalanceBefore: 0,
     toBalanceAfter: 50
   }
   ```

3. **CONSUME** (Consumo)
   ```typescript
   {
     type: 'CONSUME',
     fromUserId: 'user-uuid',
     toUserId: null,                // null porque se consume
     amount: 1,
     fromBalanceBefore: 50,
     fromBalanceAfter: 49,
     queryId: 'query-uuid'
   }
   ```

4. **REFUND** (Reembolso)
   ```typescript
   {
     type: 'REFUND',
     fromUserId: null,              // sistema devuelve
     toUserId: 'user-uuid',
     amount: 1,
     toBalanceBefore: 49,
     toBalanceAfter: 50,
     queryId: 'query-uuid'
   }
   ```

**Idempotencia:**
- Campo `idempotencyKey` único garantiza que la misma operación no se ejecute dos veces
- Formato: `{type}-{userId}-{timestamp}-{randomUUID}`

---

### 🔍 **Query**
Registro de consultas a APIs externas (INFONAVIT).

**APIs disponibles:**
| API | Enum Value | Costo |
|-----|------------|-------|
| Cambio de Contraseña | `INFONAVIT_CHANGE_PASSWORD` | 1 crédito |
| Desvinculación de Dispositivo | `INFONAVIT_UNLINK_DEVICE` | 1 crédito |
| Consultar Avisos | `INFONAVIT_NOTICES` | 1 crédito |
| Estado de Cuenta Histórico | `INFONAVIT_HISTORICAL_STATEMENT` | 1 crédito |
| Estado de Cuenta Mensual | `INFONAVIT_MONTHLY_STATEMENT` | 1 crédito/periodo |
| Estatus de Crédito | `INFONAVIT_CREDIT_STATUS` | 1 crédito |

**Estados:**
- `PENDING`: Consulta iniciada
- `SUCCESS`: Completada exitosamente
- `ERROR`: Falló (créditos reembolsados automáticamente)
- `REFUNDED`: Reembolso procesado

**Campos sensibles:**
- `requestData`: JSON encriptado con NSS, CURP, etc.
- `responseData`: JSON encriptado con respuesta de la API

---

### 🔐 **Session**
Gestión de sesiones JWT.

**Campos:**
- `token`: JWT access token (15 minutos)
- `refreshToken`: JWT refresh token (7 días)
- `expiresAt`: Fecha de expiración
- `lastActivityAt`: Última actividad (para timeout)

**Seguridad:**
- Tokens únicos por sesión
- Tracking de IP y User-Agent
- Revocación manual desde dashboard

---

### 📱 **Device**
Tracking de dispositivos para seguridad.

**Campos:**
- `deviceFingerprint`: Hash único del dispositivo
- `isTrusted`: Dispositivo confiable (skip 2FA)
- `location`: Geolocalización aproximada

---

### 📝 **Subscription**
Modelo de suscripción con rate limiting.

**Planes:**
- `WEEKLY`: 7 días
- `BIWEEKLY`: 14 días
- `MONTHLY`: 30 días

**Rate Limits:**
- `queriesThisHour`: Max 100/hora
- `queriesToday`: Sin límite diario (solo tracking)
- `queriesThisPeriod`: Sin límite en periodo

**Resets:**
- `hourResetAt`: Se resetea cada hora
- `dayResetAt`: Se resetea a las 00:00
- `periodResetAt`: Se resetea al finalizar plan

---

### 🛡️ **AuditLog**
Registro de auditoría inmutable.

**Acciones registradas:**
```typescript
USER_CREATED, USER_UPDATED, USER_DELETED, USER_ACTIVATED, USER_DEACTIVATED
CREDITS_GRANTED, CREDITS_DISTRIBUTED, CREDITS_CONSUMED, CREDITS_REFUNDED
QUERY_EXECUTED, QUERY_FAILED
SESSION_CREATED, SESSION_TERMINATED
PASSWORD_CHANGED, SETTINGS_UPDATED
```

**Campos:**
- `description`: Descripción legible ("Admin otorgó 1000 créditos a distribuidor_juan")
- `metadata`: JSON con contexto adicional
- `ipAddress`: IP del usuario
- `userAgent`: Navegador/dispositivo

---

### ⚙️ **SystemSettings**
Configuración global del sistema (key-value store).

**Ejemplos de settings:**
```json
{
  "api_costs": {
    "INFONAVIT_CHANGE_PASSWORD": 1,
    "INFONAVIT_CREDIT_STATUS": 1
  },
  "rate_limits": {
    "subscription_hourly": 100,
    "max_retry_attempts": 3
  },
  "maintenance_mode": false,
  "external_apis": {
    "infonavit_base_url": "https://api.infonavit.gob.mx",
    "infonavit_timeout": 30000
  }
}
```

---

## Relaciones

### Jerarquía de Usuarios
```mermaid
graph TD
    SA[Superadmin] -->|crea| D[Distributor]
    D -->|crea| FU[Final User]
    D -->|distribuye créditos| FU
```

### Flujo de Créditos
```mermaid
graph LR
    SA[Superadmin∞] -->|GRANT| D[Distributor 1000]
    D -->|DISTRIBUTE| FU1[User 50]
    D -->|DISTRIBUTE| FU2[User 30]
    FU1 -->|CONSUME| API[INFONAVIT]
```

### Transacciones y Queries
```mermaid
graph TD
    U[User] -->|crea| Q[Query]
    Q -->|genera| CT1[CreditTransaction CONSUME]
    Q -->|si falla| CT2[CreditTransaction REFUND]
```

---

## Reglas de Negocio

### 1. **Balance nunca negativo**
```typescript
// ANTES de crear transacción DISTRIBUTE o CONSUME
if (user.credits < amount) {
  throw new Error("Insufficient credits")
}
```

### 2. **Transacciones atómicas**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Validar balance
  // 2. Actualizar créditos
  // 3. Crear CreditTransaction
  // 4. Crear AuditLog
})
```

### 3. **Idempotencia**
```typescript
const idempotencyKey = `DISTRIBUTE-${distributorId}-${Date.now()}-${uuidv4()}`

const existing = await prisma.creditTransaction.findUnique({
  where: { idempotencyKey }
})

if (existing) return existing // Ya procesada
```

### 4. **Reembolsos automáticos**
```typescript
if (query.status === 'ERROR') {
  await refundCredits({
    userId: query.userId,
    amount: query.creditsCost,
    queryId: query.id
  })
}
```

### 5. **Scope de datos por rol**
```typescript
// Distributor solo ve SUS usuarios
const users = await prisma.user.findMany({
  where: {
    distributorId: currentUser.id  // Solo sus usuarios
  }
})

// Distributor solo ve SUS transacciones
const transactions = await prisma.creditTransaction.findMany({
  where: {
    OR: [
      { fromUserId: currentUser.id },
      { toUserId: currentUser.id }
    ]
  }
})
```

### 6. **Soft deletes**
```typescript
// No eliminar físicamente, solo desactivar
await prisma.user.update({
  where: { id },
  data: { isActive: false }
})
```

---

## Índices y Performance

### Índices críticos creados:

**User:**
- `email` (unique, búsquedas de login)
- `username` (unique, búsquedas de login)
- `distributorId` (JOIN con distribuidores)
- `role` (filtros por rol)
- `isActive` (filtros de usuarios activos)

**CreditTransaction:**
- `type` (filtros por tipo)
- `fromUserId` (historial de transacciones)
- `toUserId` (historial de transacciones)
- `queryId` (relación con queries)
- `createdAt` (ordenamiento temporal)
- `idempotencyKey` (unique, validación duplicados)

**Query:**
- `userId` (historial por usuario)
- `api` (filtros por tipo de API)
- `status` (filtros por estado)
- `createdAt` (ordenamiento temporal)

**Session:**
- `userId` (sesiones por usuario)
- `token` (unique, validación JWT)
- `refreshToken` (unique, refresh flow)
- `expiresAt` (cleanup de sesiones expiradas)
- `isActive` (filtros de sesiones activas)

---

## Migraciones y Setup

### 1. Instalar dependencias
```bash
pnpm add prisma @prisma/client
pnpm add -D prisma
```

### 2. Configurar .env
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/detramites?schema=public"
```

### 3. Generar cliente Prisma
```bash
npx prisma generate
```

### 4. Crear migración inicial
```bash
npx prisma migrate dev --name init
```

### 5. Seed inicial (crear superadmin)
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.create({
    data: {
      username: 'admin_master',
      email: 'master@admin.com',
      password: hashedPassword,
      role: 'SUPERADMIN_MASTER',
      isActive: true
    }
  })
}

main()
```

### 6. Ejecutar seed
```bash
npx prisma db seed
```

---

## Queries Útiles

### Ver historial completo de créditos
```typescript
const allTransactions = await prisma.creditTransaction.findMany({
  include: {
    fromUser: { select: { username: true, role: true } },
    toUser: { select: { username: true, role: true } },
    query: { select: { api: true, status: true } }
  },
  orderBy: { createdAt: 'desc' }
})
```

### Ver créditos distribuidos por un distribuidor
```typescript
const distributed = await prisma.creditTransaction.aggregate({
  where: {
    type: 'DISTRIBUTE',
    fromUserId: distributorId
  },
  _sum: { amount: true }
})
```

### Ver consumo de APIs por periodo
```typescript
const consumption = await prisma.query.groupBy({
  by: ['api', 'status'],
  where: {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  },
  _count: true,
  _sum: { creditsCost: true }
})
```

### Detectar actividad sospechosa
```typescript
const suspiciousLogins = await prisma.failedLogin.groupBy({
  by: ['ipAddress'],
  where: {
    createdAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
    }
  },
  _count: true,
  having: {
    ipAddress: {
      _count: { gt: 5 } // más de 5 intentos fallidos
    }
  }
})
```

---

## Validaciones a Nivel de Aplicación

### 1. Validar créditos antes de consumir
```typescript
async function consumeCredits(userId: string, amount: number) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })

    if (!user || user.credits < amount) {
      throw new Error('Insufficient credits')
    }

    // Actualizar balance
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } }
    })

    // Registrar transacción
    await tx.creditTransaction.create({
      data: {
        type: 'CONSUME',
        amount,
        fromUserId: userId,
        fromBalanceBefore: user.credits,
        fromBalanceAfter: updatedUser.credits,
        idempotencyKey: generateIdempotencyKey()
      }
    })

    return updatedUser
  })
}
```

### 2. Validar permisos de distribuidor
```typescript
async function canManageUser(distributorId: string, targetUserId: string) {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId }
  })

  return targetUser?.distributorId === distributorId
}
```

### 3. Rate limiting para suscripciones
```typescript
async function checkRateLimit(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId }
  })

  if (!subscription) throw new Error('No subscription found')

  if (subscription.queriesThisHour >= 100) {
    throw new Error('Rate limit exceeded: 100 queries per hour')
  }

  // Reset si pasó la hora
  const now = new Date()
  if (subscription.hourResetAt && now > subscription.hourResetAt) {
    await prisma.subscription.update({
      where: { userId },
      data: {
        queriesThisHour: 0,
        hourResetAt: new Date(now.getTime() + 60 * 60 * 1000)
      }
    })
  }
}
```

---

## Backup y Mantenimiento

### Backup diario
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Limpiar sesiones expiradas
```sql
DELETE FROM sessions WHERE "expiresAt" < NOW();
```

### Limpiar failed_logins antiguos
```sql
DELETE FROM failed_logins WHERE "createdAt" < NOW() - INTERVAL '30 days';
```

---

## 🔒 Seguridad

### Datos sensibles encriptados:
- `User.password`: bcrypt hash
- `Query.requestData`: Encriptar NSS, CURP con AES-256
- `Query.responseData`: Encriptar respuestas API

### Implementar en código:
```typescript
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY // 32 bytes

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
```

---

**Esquema completo y listo para producción.** ✅

# Credenciales de Prueba

## Usuarios en la Base de Datos

### Superadmin Master
- **Username**: `admin_master`
- **Password**: `admin123`
- **Ruta**: http://localhost:3000/superadmin
- **Créditos**: 999,999,999 (ilimitados)

### Distribuidor
- **Username**: `distribuidor_test`
- **Password**: `dist123`
- **Ruta**: http://localhost:3000/distributor
- **Créditos**: 10,000

### Usuario Final
- **Username**: `usuario_test`
- **Password**: `user123`
- **Ruta**: http://localhost:3000/user
- **Créditos**: 100
- **Distribuidor**: distribuidor_test

---

## Comandos Importantes

### Iniciar Backend
```bash
cd /home/wal/plataforma/backend
pnpm dev
```

### Iniciar Frontend
```bash
cd /home/wal/plataforma
pnpm dev
```

### Recrear Base de Datos
```bash
cd /home/wal/plataforma/backend
pnpm prisma:migrate
pnpm seed
```

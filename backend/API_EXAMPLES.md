# Ejemplos de Peticiones a la API

Este documento contiene ejemplos de cómo usar todos los endpoints de la API.

## Variables de Entorno

```bash
BASE_URL="http://localhost:4000"
TOKEN="your-jwt-token-here"
```

---

## 1. Autenticación

### 1.1 Login

```bash
curl -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_master",
    "password": "admin123"
  }'
```

**Respuesta:**
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

### 1.2 Logout

```bash
curl -X POST ${BASE_URL}/api/auth/logout \
  -H "Authorization: Bearer ${TOKEN}"
```

### 1.3 Refresh Token

```bash
curl -X POST ${BASE_URL}/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'${TOKEN}'"
  }'
```

---

## 2. Gestión de Usuarios

### 2.1 Listar Todos los Usuarios (Superadmin)

```bash
curl -X GET ${BASE_URL}/api/users \
  -H "Authorization: Bearer ${TOKEN}"
```

### 2.2 Listar Mis Usuarios (Distribuidor)

```bash
curl -X GET ${BASE_URL}/api/users/my-users \
  -H "Authorization: Bearer ${TOKEN}"
```

### 2.3 Crear Superadmin Secundario (Solo Master)

```bash
curl -X POST ${BASE_URL}/api/users/superadmin-secondary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "username": "admin_secundario",
    "password": "securepass123",
    "role": "SUPERADMIN_SECONDARY"
  }'
```

### 2.4 Crear Distribuidor (Superadmin)

```bash
curl -X POST ${BASE_URL}/api/users/distributor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "username": "distribuidor_juan",
    "password": "dist123456",
    "role": "DISTRIBUTOR"
  }'
```

### 2.5 Crear Usuario Final

```bash
curl -X POST ${BASE_URL}/api/users/final-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "username": "usuario_carlos",
    "password": "user123456",
    "role": "FINAL_USER"
  }'
```

### 2.6 Eliminar Usuario

```bash
curl -X DELETE ${BASE_URL}/api/users/{user-id} \
  -H "Authorization: Bearer ${TOKEN}"
```

### 2.7 Asignar Créditos

```bash
curl -X POST ${BASE_URL}/api/users/assign-credits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "userId": "user-uuid-here",
    "amount": 5000
  }'
```

### 2.8 Cambiar Contraseña

```bash
curl -X POST ${BASE_URL}/api/users/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "currentPassword": "admin123",
    "newPassword": "newsecurepass456"
  }'
```

---

## 3. Créditos

### 3.1 Obtener Balance

```bash
curl -X GET ${BASE_URL}/api/credits/balance \
  -H "Authorization: Bearer ${TOKEN}"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "balance": 5000
  }
}
```

### 3.2 Historial de Transacciones

```bash
curl -X GET ${BASE_URL}/api/credits/history \
  -H "Authorization: Bearer ${TOKEN}"
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 5000,
      "type": "ASSIGNED",
      "description": "Créditos asignados",
      "createdAt": "2025-10-14T00:00:00.000Z"
    },
    {
      "id": "uuid",
      "amount": -1,
      "type": "CONSUMED",
      "description": "Cambiar contraseña INFONAVIT",
      "createdAt": "2025-10-14T01:00:00.000Z"
    }
  ]
}
```

---

## 4. Logs

### 4.1 Logs de Auditoría (Superadmin)

```bash
curl -X GET "${BASE_URL}/api/logs/audit?limit=50&offset=0" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 4.2 Mis Consultas

```bash
curl -X GET "${BASE_URL}/api/logs/my-queries?limit=50&offset=0" \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## 5. APIs INFONAVIT

### 5.1 Cambiar Contraseña

```bash
curl -X POST ${BASE_URL}/api/infonavit/cambiar-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "nss": "12345678901"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "newPassword": "12345678901AbCd",
  "message": "Contraseña actualizada correctamente",
  "response": {
    "code": 0,
    "message": "Actualización correcta"
  }
}
```

### 5.2 Desvincular Dispositivo

```bash
curl -X POST ${BASE_URL}/api/infonavit/desvincular-dispositivo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "nss": "12345678901"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Dispositivo desvinculado correctamente",
  "response": {
    "code": "0",
    "message": "Actualización correcta"
  }
}
```

### 5.3 Consultar Avisos

```bash
curl -X POST ${BASE_URL}/api/infonavit/consultar-avisos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "credito": "1918899562"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "pdfs": [
    {
      "filename": "aviso1.pdf",
      "data": "base64-encoded-pdf-data"
    },
    {
      "filename": "aviso2.pdf",
      "data": "base64-encoded-pdf-data"
    }
  ]
}
```

### 5.4 Estado de Cuenta Mensual

```bash
curl -X POST ${BASE_URL}/api/infonavit/estado-mensual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "credito": "1918899562",
    "periodos": ["202509", "202508", "202507"]
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "pdfs": [
    {
      "periodo": "202509",
      "filename": "estado_mensual_1918899562_202509.pdf",
      "data": "base64-encoded-pdf"
    },
    {
      "periodo": "202508",
      "filename": "estado_mensual_1918899562_202508.pdf",
      "data": "base64-encoded-pdf"
    }
  ],
  "errors": [
    {
      "periodo": "202507",
      "message": "Este crédito no tiene información para este periodo"
    }
  ]
}
```

**Nota:** Este endpoint cobra 1 crédito por cada periodo solicitado. Si un periodo no tiene información, se devuelve automáticamente 1 crédito.

### 5.5 Estado de Cuenta Histórico

```bash
curl -X POST ${BASE_URL}/api/infonavit/estado-historico \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "credito": "1911555819"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "pdf": {
    "filename": "historico_1911555819.pdf",
    "data": "base64-encoded-pdf-data"
  },
  "response": {
    "reporte": "base64-pdf",
    "StatusServicio": {
      "codigo": "00",
      "mensaje": "EXITO"
    }
  }
}
```

### 5.6 Resumen de Movimientos

```bash
curl -X POST ${BASE_URL}/api/infonavit/resumen-movimientos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "nss": "02230301760"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "pdf": {
    "filename": "02230301760_resumen_movs.pdf",
    "data": "base64-encoded-pdf-data"
  },
  "response": {
    "codeOp": "00",
    "pdf": "base64-pdf",
    "message": "Entrega de resumen de movimientos satisfactorio"
  }
}
```

### 5.7 Buscar Crédito por NSS

```bash
curl -X POST ${BASE_URL}/api/infonavit/buscar-credito \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "nss": "47937648609"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "tabla1": {
      "nss": "47937648609",
      "numeroCredito": "1234567890",
      "tipoCredito": "Individual",
      "producto": "Tradicional",
      "estatusCredito": "Vigente",
      "situacionCredito": "Al corriente",
      "mesesOmisos": 0,
      "regimen": "IMSS",
      "moneda": "Pesos",
      "fechaOrigen": "2020-01-15",
      "marcaFallecido": "N",
      "marcaProrroga": "N",
      "marcaCierre": "N"
    },
    "tabla2": {
      "nombreCompleto": "Juan Pérez García",
      "rfc": "PEGJ800101ABC",
      "curp": "PEGJ800101HDFRNN09",
      "telefonoCelular": "5512345678",
      "emailPersonal": "juan.perez@email.com"
    },
    "raw": { /* datos completos del API */ }
  }
}
```

---

## Códigos de Error

### Errores de Autenticación
- `401 Unauthorized` - Token no proporcionado o inválido
- `403 Forbidden` - No tiene permisos para esta acción

### Errores de Validación
- `400 Bad Request` - Datos inválidos o faltantes

### Errores de Créditos
- `400 Bad Request` - Créditos insuficientes

### Errores del Servidor
- `500 Internal Server Error` - Error en el servidor
- `502/503/504` - Error en servicio externo (INFONAVIT) - **Créditos devueltos automáticamente**

---

## Notas sobre PDFs

Los PDFs se devuelven en formato **base64**. Para usarlos:

### JavaScript/Node.js
```javascript
const pdfBuffer = Buffer.from(response.pdf.data, 'base64');
fs.writeFileSync('documento.pdf', pdfBuffer);
```

### Python
```python
import base64

pdf_data = base64.b64decode(response['pdf']['data'])
with open('documento.pdf', 'wb') as f:
    f.write(pdf_data)
```

### Navegador (descarga directa)
```javascript
const downloadPdf = (base64Data, filename) => {
  const blob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))],
    { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};
```

---

## Rate Limiting

Ten en cuenta los límites por rol:

- **Usuario Final**: 10 requests/minuto
- **Distribuidor**: 50 requests/minuto
- **Superadmin**: Sin límite

Si excedes el límite, recibirás:

```json
{
  "success": false,
  "error": "Demasiadas solicitudes. Por favor intente más tarde."
}
```

---

## Validaciones

### NSS
- Debe tener exactamente 11 dígitos
- Solo números

### Número de Crédito
- Debe tener exactamente 10 dígitos
- Solo números

### Periodo
- Formato: `YYYYMM`
- Ejemplo: `202509` (Septiembre 2025)

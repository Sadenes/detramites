import prisma from '../utils/prisma';
import { convertToIPv4 } from '../utils/ipHelper';

/**
 * Script para migrar todas las IPs de IPv6 a IPv4 en la base de datos
 */
async function migrateIPs() {
  console.log('🔄 Iniciando migración de IPv6 a IPv4...');

  try {
    // Actualizar UserSession
    const sessions = await prisma.userSession.findMany({
      select: {
        id: true,
        ipAddress: true,
      },
    });

    console.log(`📊 Encontradas ${sessions.length} sesiones para actualizar`);

    let updatedSessions = 0;
    for (const session of sessions) {
      const newIP = convertToIPv4(session.ipAddress);
      if (newIP !== session.ipAddress) {
        await prisma.userSession.update({
          where: { id: session.id },
          data: { ipAddress: newIP },
        });
        updatedSessions++;
        console.log(`  ✓ Sesión ${session.id}: ${session.ipAddress} → ${newIP}`);
      }
    }

    console.log(`✅ Sesiones actualizadas: ${updatedSessions}/${sessions.length}`);

    // Actualizar FailedLoginAttempt
    const failedAttempts = await prisma.failedLoginAttempt.findMany({
      select: {
        id: true,
        ipAddress: true,
      },
    });

    console.log(`📊 Encontrados ${failedAttempts.length} intentos fallidos para actualizar`);

    let updatedAttempts = 0;
    for (const attempt of failedAttempts) {
      const newIP = convertToIPv4(attempt.ipAddress);
      if (newIP !== attempt.ipAddress) {
        await prisma.failedLoginAttempt.update({
          where: { id: attempt.id },
          data: { ipAddress: newIP },
        });
        updatedAttempts++;
        console.log(`  ✓ Intento fallido ${attempt.id}: ${attempt.ipAddress} → ${newIP}`);
      }
    }

    console.log(`✅ Intentos fallidos actualizados: ${updatedAttempts}/${failedAttempts.length}`);

    // Actualizar AuditLog
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        ipAddress: {
          not: null,
        },
      },
      select: {
        id: true,
        ipAddress: true,
      },
    });

    console.log(`📊 Encontrados ${auditLogs.length} logs de auditoría para actualizar`);

    let updatedLogs = 0;
    for (const log of auditLogs) {
      if (log.ipAddress) {
        const newIP = convertToIPv4(log.ipAddress);
        if (newIP !== log.ipAddress) {
          await prisma.auditLog.update({
            where: { id: log.id },
            data: { ipAddress: newIP },
          });
          updatedLogs++;
          console.log(`  ✓ Audit log ${log.id}: ${log.ipAddress} → ${newIP}`);
        }
      }
    }

    console.log(`✅ Logs de auditoría actualizados: ${updatedLogs}/${auditLogs.length}`);

    console.log('🎉 Migración completada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateIPs();

import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { UserRole } from '@prisma/client';

async function seed() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Verificar si ya existe un superadmin master
    const existingMaster = await prisma.user.findFirst({
      where: { role: UserRole.SUPERADMIN_MASTER },
    });

    if (existingMaster) {
      console.log('⚠️  Ya existe un superadmin master. Saltando creación...');
      console.log(`   Username: ${existingMaster.username}`);
      return;
    }

    // Crear superadmin master
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const masterAdmin = await prisma.user.create({
      data: {
        username: 'admin_master',
        password: hashedPassword,
        role: UserRole.SUPERADMIN_MASTER,
        credits: 999999999, // Créditos ilimitados (representado con número muy alto)
      },
    });

    console.log('✅ Superadmin master creado exitosamente!');
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('   Credenciales de acceso:');
    console.log('   Username: admin_master');
    console.log('   Password: admin123');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('');

    // Crear algunos usuarios de prueba (opcional)
    console.log('📝 Creando usuarios de prueba...');

    const distributor1 = await prisma.user.create({
      data: {
        username: 'distribuidor_test',
        password: await bcrypt.hash('dist123', 10),
        role: UserRole.DISTRIBUTOR,
        credits: 10000,
      },
    });

    const finalUser1 = await prisma.user.create({
      data: {
        username: 'usuario_test',
        password: await bcrypt.hash('user123', 10),
        role: UserRole.FINAL_USER,
        credits: 100,
        distributorId: distributor1.id,
      },
    });

    console.log('✅ Usuarios de prueba creados:');
    console.log(`   - Distribuidor: distribuidor_test / dist123 (${distributor1.credits} créditos)`);
    console.log(
      `   - Usuario Final: usuario_test / user123 (${finalUser1.credits} créditos)`
    );
    console.log('');

    console.log('✨ Seed completado exitosamente!');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import prisma from '../utils/prisma';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

async function seedProduction() {
  try {
    console.log('🌱 Iniciando seed de producción...');

    // Verificar si ya existe el superadmin master
    const existingMaster = await prisma.user.findFirst({
      where: { role: UserRole.SUPERADMIN_MASTER },
    });

    if (existingMaster) {
      console.log('⚠️  Ya existe un superadmin master. No se creará uno nuevo.');
      console.log(`   Usuario: ${existingMaster.username}`);
      return;
    }

    // Crear superadmin master
    const hashedPassword = await bcrypt.hash('Admin2025!', 10);

    const superadmin = await prisma.user.create({
      data: {
        username: 'admin_master',
        password: hashedPassword,
        role: UserRole.SUPERADMIN_MASTER,
        credits: 0, // Los superadmins tienen créditos infinitos
        canCreateUsers: true,
      },
    });

    console.log('✅ Superadmin Master creado exitosamente:');
    console.log(`   Username: ${superadmin.username}`);
    console.log(`   Password: Admin2025!`);
    console.log(`   ID: ${superadmin.id}`);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login!');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProduction()
  .then(() => {
    console.log('\n🎉 Seed completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

import prisma from '../utils/prisma';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const checkMark = '✅';
const crossMark = '❌';
const warningMark = '⚠️';

async function checkSetup() {
  console.log('\n🔍 Verificando configuración del backend...\n');

  let allGood = true;

  // 1. Verificar archivo .env
  console.log('1. Verificando archivo .env...');
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    console.log(`   ${checkMark} Archivo .env existe`);

    const envContent = fs.readFileSync(envPath, 'utf-8');

    if (envContent.includes('DATABASE_URL')) {
      console.log(`   ${checkMark} DATABASE_URL configurado`);
    } else {
      console.log(`   ${crossMark} DATABASE_URL no encontrado`);
      allGood = false;
    }

    if (envContent.includes('JWT_SECRET')) {
      console.log(`   ${checkMark} JWT_SECRET configurado`);
    } else {
      console.log(`   ${crossMark} JWT_SECRET no encontrado`);
      allGood = false;
    }
  } else {
    console.log(`   ${crossMark} Archivo .env no existe`);
    allGood = false;
  }

  // 2. Verificar conexión a la base de datos
  console.log('\n2. Verificando conexión a PostgreSQL...');
  try {
    await prisma.$connect();
    console.log(`   ${checkMark} Conexión exitosa a PostgreSQL`);
  } catch (error: any) {
    console.log(`   ${crossMark} Error al conectar a PostgreSQL`);
    console.log(`   Error: ${error.message}`);
    allGood = false;
  }

  // 3. Verificar si existen las tablas
  console.log('\n3. Verificando esquema de base de datos...');
  try {
    const userCount = await prisma.user.count();
    console.log(`   ${checkMark} Tabla User existe (${userCount} usuarios)`);

    const creditCount = await prisma.creditTransaction.count();
    console.log(`   ${checkMark} Tabla CreditTransaction existe (${creditCount} transacciones)`);

    const queryCount = await prisma.apiQuery.count();
    console.log(`   ${checkMark} Tabla ApiQuery existe (${queryCount} consultas)`);

    const logCount = await prisma.auditLog.count();
    console.log(`   ${checkMark} Tabla AuditLog existe (${logCount} logs)`);
  } catch (error: any) {
    console.log(`   ${crossMark} Error al verificar tablas`);
    console.log(`   Error: ${error.message}`);
    console.log(`   ${warningMark} ¿Ejecutaste 'npm run prisma:migrate'?`);
    allGood = false;
  }

  // 4. Verificar si existe superadmin master
  console.log('\n4. Verificando usuario superadmin master...');
  try {
    const masterAdmin = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN_MASTER' },
    });

    if (masterAdmin) {
      console.log(`   ${checkMark} Superadmin master existe: ${masterAdmin.username}`);
    } else {
      console.log(`   ${warningMark} No existe superadmin master`);
      console.log(`   ${warningMark} Ejecuta 'npm run seed' para crear usuarios iniciales`);
    }
  } catch (error) {
    console.log(`   ${crossMark} Error al verificar superadmin`);
  }

  // 5. Verificar estructura de directorios
  console.log('\n5. Verificando estructura de directorios...');
  const requiredDirs = [
    'src/controllers',
    'src/middleware',
    'src/routes',
    'src/services',
    'src/utils',
    'src/types',
    'prisma',
  ];

  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, '../..', dir);
    if (fs.existsSync(dirPath)) {
      console.log(`   ${checkMark} ${dir}/`);
    } else {
      console.log(`   ${crossMark} ${dir}/ no existe`);
      allGood = false;
    }
  }

  // 6. Verificar archivos críticos
  console.log('\n6. Verificando archivos críticos...');
  const requiredFiles = [
    'src/index.ts',
    'src/controllers/authController.ts',
    'src/controllers/infonavitController.ts',
    'src/services/infonavitService.ts',
    'src/middleware/auth.ts',
    'prisma/schema.prisma',
    'package.json',
    'tsconfig.json',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '../..', file);
    if (fs.existsSync(filePath)) {
      console.log(`   ${checkMark} ${file}`);
    } else {
      console.log(`   ${crossMark} ${file} no existe`);
      allGood = false;
    }
  }

  // Resumen final
  console.log('\n' + '═'.repeat(60));
  if (allGood) {
    console.log(`${checkMark} ¡Todo está configurado correctamente!`);
    console.log('\nPuedes iniciar el servidor con:');
    console.log('  npm run dev');
  } else {
    console.log(`${crossMark} Hay problemas con la configuración`);
    console.log('\nSigue estos pasos:');
    console.log('  1. Verifica que PostgreSQL esté corriendo');
    console.log('  2. Configura el archivo .env correctamente');
    console.log('  3. Ejecuta: npm run prisma:generate');
    console.log('  4. Ejecuta: npm run prisma:migrate');
    console.log('  5. Ejecuta: npm run seed');
  }
  console.log('═'.repeat(60) + '\n');

  await prisma.$disconnect();
  process.exit(allGood ? 0 : 1);
}

checkSetup().catch((error) => {
  console.error('Error durante verificación:', error);
  process.exit(1);
});

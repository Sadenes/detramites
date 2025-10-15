import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import creditRoutes from './routes/creditRoutes';
import logRoutes from './routes/logRoutes';
import infonavitRoutes from './routes/infonavitRoutes';
import monitoringRoutes from './routes/monitoringRoutes';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log de requests (desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/infonavit', infonavitRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Ruta no encontrada
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
  });
});

// Error handler global
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        🚀 Detramites Backend Server                   ║
║                                                       ║
║        Environment: ${process.env.NODE_ENV || 'development'}                          ║
║        Port: ${PORT}                                       ║
║        Time: ${new Date().toISOString()}  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  console.log('Available endpoints:');
  console.log('  POST   /api/auth/login');
  console.log('  POST   /api/auth/logout');
  console.log('  POST   /api/auth/refresh');
  console.log('');
  console.log('  GET    /api/users');
  console.log('  GET    /api/users/my-users');
  console.log('  POST   /api/users/distributor');
  console.log('  POST   /api/users/final-user');
  console.log('  DELETE /api/users/:id');
  console.log('  POST   /api/users/assign-credits');
  console.log('  POST   /api/users/change-password');
  console.log('');
  console.log('  GET    /api/credits/balance');
  console.log('  GET    /api/credits/history');
  console.log('');
  console.log('  GET    /api/logs/audit');
  console.log('  GET    /api/logs/my-queries');
  console.log('');
  console.log('  POST   /api/infonavit/cambiar-password');
  console.log('  POST   /api/infonavit/desvincular-dispositivo');
  console.log('  POST   /api/infonavit/consultar-avisos');
  console.log('  POST   /api/infonavit/estado-mensual');
  console.log('  POST   /api/infonavit/estado-historico');
  console.log('  POST   /api/infonavit/resumen-movimientos');
  console.log('  POST   /api/infonavit/buscar-credito');
  console.log('');
  console.log('  GET    /api/monitoring/sessions');
  console.log('  GET    /api/monitoring/failed-logins');
  console.log('');
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;

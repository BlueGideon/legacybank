import express from 'express';
import cors from 'cors';
import db from './db.js'; // Asegúrate que db.js también exporte con `export default`

// Importar rutas
import loginRoutes from './routes/login.js';
import fondosRoutes from './routes/fondos.js';
import participantesRoutes from './routes/participantes.js';
import pagosAhorrosRoutes from './routes/pagos_ahorros.js';
import prestamosRoutes from './routes/prestamos.js';
import pagosPrestamosRoutes from './routes/pagos_prestamos.js';
import pagosMoraAhorrosRoutes from './routes/pagos_mora_ahorros.js';
import pagosMoraPrestamosRoutes from './routes/pagos_mora_prestamos.js';
import informesPrestamosRoutes from './routes/informes_prestamos.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Usar rutas
app.use('/api/login', loginRoutes);
app.use('/api/fondos', fondosRoutes);
app.use('/api/participantes', participantesRoutes);
app.use('/api/pagos-ahorros', pagosAhorrosRoutes);
app.use('/api/prestamos', prestamosRoutes);
app.use('/api/pagos-prestamos', pagosPrestamosRoutes);
app.use('/api/pagos-mora-ahorros', pagosMoraAhorrosRoutes);
app.use('/api/pagos-mora-prestamos', pagosMoraPrestamosRoutes);
app.use('/api/informes-prestamos', informesPrestamosRoutes);


// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor backend funcionando correctamente');
});

// Iniciar el servidor
app.listen(3000, '0.0.0.0', () => {
    console.log('Servidor corriendo en http://0.0.0.0:3000');
});


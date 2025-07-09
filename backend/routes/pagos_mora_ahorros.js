// routes/pagos_mora_ahorros.js
import express from 'express';
const router = express.Router();
import db from '../db.js';

// Crear nuevo pago de mora (ahorro)
router.post('/', (req, res) => {
    const { nombre, fecha_pago, concepto, detalle, valor } = req.body;

    const sql = `
        INSERT INTO pagos_mora_ahorros (nombre, fecha_pago, concepto, detalle, valor)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [nombre, fecha_pago, concepto, detalle, valor], (err, result) => {
        if (err) {
            console.error('Error al guardar pago de mora:', err);
            return res.status(500).json({ mensaje: 'Error al guardar el pago de mora' });
        }

        res.json({ mensaje: 'Pago de mora registrado exitosamente' });
    });
});

// Obtener todos los pagos de mora (opcional)
router.get('/', (req, res) => {
    const sql = `SELECT * FROM pagos_mora_ahorros`;

    db.query(sql, (err, resultados) => {
        if (err) {
            console.error('Error al obtener pagos de mora:', err);
            return res.status(500).json({ mensaje: 'Error al obtener pagos de mora' });
        }

        res.json(resultados);
    });
});

export default router;

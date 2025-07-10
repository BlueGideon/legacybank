import express from 'express';
const router = express.Router();
import db from '../db.js';

// Registrar nuevo pago de mora
router.post('/', async (req, res) => {
    try {
        const { nombre, fecha_pago, concepto, detalle, valor, id_pago_ahorro } = req.body;

        const sql = `
            INSERT INTO pagos_mora_ahorros 
            (nombre, fecha_pago, concepto, detalle, valor, id_pago_ahorro)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [nombre, fecha_pago, concepto, detalle, valor, id_pago_ahorro]);

        res.json({ mensaje: 'Pago de mora registrado exitosamente', id: result.insertId });
    } catch (err) {
        console.error('Error al guardar pago de mora:', err);
        res.status(500).json({ mensaje: 'Error al guardar el pago de mora' });
    }
});

// Consultar total abonado por ID de pago ahorro
router.get('/abonados/:id', async (req, res) => {
    try {
        const idPago = req.params.id;

        const sql = `SELECT SUM(valor) AS total_abonado FROM pagos_mora_ahorros WHERE id_pago_ahorro = ?`;
        const [resultados] = await db.query(sql, [idPago]);

        res.json(resultados[0]);
    } catch (err) {
        console.error('Error al obtener abonos:', err);
        res.status(500).json({ mensaje: 'Error al obtener abonos' });
    }
});

// Obtener todos los pagos de mora por ahorros
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM pagos_mora_ahorros');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener pagos de mora:', err);
        res.status(500).json({ mensaje: 'Error al obtener los pagos de mora' });
    }
});

// Eliminar un pago de mora
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM pagos_mora_ahorros WHERE id = ?', [id]);
        res.sendStatus(204); // Sin contenido
    } catch (err) {
        console.error('Error al eliminar pago de mora:', err);
        res.status(500).json({ mensaje: 'Error al eliminar el pago de mora' });
    }
});

export default router;


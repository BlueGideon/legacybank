import express from 'express';
import db from '../db.js';

const router = express.Router();

// Obtener pagos mora por préstamo
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM pagos_mora_prestamos');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pagos de mora de préstamos' });
    }
});

// Obtener total abonado por ID de pago préstamo
router.get('/abonados/:idPago', async (req, res) => {
    const { idPago } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT SUM(valor) AS total_abonado FROM pagos_mora_prestamos WHERE id_pago_prestamo = ?',
            [idPago]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener abonos de mora' });
    }
});

// Crear nuevo pago mora
router.post('/', async (req, res) => {
    const { solicitante, fecha_pago, concepto, detalle, valor, id_pago_prestamo } = req.body;
    try {
        await db.query(
            'INSERT INTO pagos_mora_prestamos (solicitante, fecha_pago, concepto, detalle, valor, id_pago_prestamo) VALUES (?, ?, ?, ?, ?, ?)',
            [solicitante, fecha_pago, concepto, detalle, valor, id_pago_prestamo]
        );
        res.status(201).json({ mensaje: 'Pago de mora registrado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar pago de mora' });
    }
});

// Actualizar un pago mora
router.put('/:id', async (req, res) => {
    const { solicitante, fecha_pago, concepto, detalle, valor } = req.body;
    const { id } = req.params;

    try {
        await db.query(
            'UPDATE pagos_mora_prestamos SET solicitante = ?, fecha_pago = ?, concepto = ?, detalle = ?, valor = ? WHERE id = ?',
            [solicitante, fecha_pago, concepto, detalle, valor, id]
        );
        res.json({ mensaje: 'Pago de mora actualizado' });
    } catch (err) {
        console.error('Error en backend:', err); // 👈 log importante
        res.status(500).json({ error: 'Error al actualizar pago de mora' });
    }
});


// Obtener un pago mora por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM pagos_mora_prestamos WHERE id = ?', [id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pago de mora' });
    }
});

// Eliminar un pago mora por ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM pagos_mora_prestamos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No se encontró el pago de mora' });
        }
        res.json({ mensaje: 'Pago de mora eliminado correctamente' });
    } catch (err) {
        console.error('Error al eliminar pago de mora:', err);
        res.status(500).json({ error: 'Error al eliminar el pago de mora' });
    }
});


export default router;

import express from 'express';
const router = express.Router();
import db from '../db.js';

// Obtener pagos por solicitante
router.get('/por-solicitante/:nombre', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM pagos_prestamos WHERE solicitante = ?', [req.params.nombre]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener todos los pagos
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM pagos_prestamos');
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear nuevo pago
router.post('/', async (req, res) => {
    try {
        const { solicitante, fpago, flpago, vpago, cuotaAPagar } = req.body;
        const sql = 'INSERT INTO pagos_prestamos (solicitante, fpago, flpago, vpago, cuotaAPagar) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [solicitante, fpago, flpago, vpago, cuotaAPagar]);
        res.json({ message: 'Pago guardado correctamente', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar pago existente
router.put('/:id', async (req, res) => {
    try {
        const { solicitante, fpago, flpago, vpago, cuotaAPagar } = req.body;
        const sql = 'UPDATE pagos_prestamos SET solicitante = ?, fpago = ?, flpago = ?, vpago = ?, cuotaAPagar = ? WHERE id = ?';
        await db.query(sql, [solicitante, fpago, flpago, vpago, cuotaAPagar, req.params.id]);
        res.json({ message: 'Pago actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar pago
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM pagos_prestamos WHERE id = ?', [req.params.id]);
        res.json({ message: 'Pago eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

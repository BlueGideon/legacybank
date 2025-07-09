import express from 'express';
const router = express.Router();
import db from '../db.js';

router.get('/por-solicitante/:nombre', (req, res) => {
    const nombre = req.params.nombre;
    const sql = 'SELECT * FROM pagos_prestamos WHERE solicitante = ?';
    db.query(sql, [nombre], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});


// Obtener todos los pagos
router.get('/', (req, res) => {
    db.query('SELECT * FROM pagos_prestamos', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Crear nuevo pago
router.post('/', (req, res) => {
    const { solicitante, fpago, flpago, vpago, cuotaAPagar } = req.body;
    const sql = 'INSERT INTO pagos_prestamos (solicitante, fpago, flpago, vpago, cuotaAPagar) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [solicitante, fpago, flpago, vpago, cuotaAPagar], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Pago guardado correctamente', id: result.insertId });
    });
});

// Actualizar pago existente
router.put('/:id', (req, res) => {
    const { solicitante, fpago, flpago, vpago, cuotaAPagar } = req.body;
    const sql = 'UPDATE pagos_prestamos SET solicitante = ?, fpago = ?, flpago = ?, vpago = ?, cuotaAPagar = ? WHERE id = ?';
    db.query(sql, [solicitante, fpago, flpago, vpago, cuotaAPagar, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Pago actualizado correctamente' });
    });
});

// elimnar datos
router.delete('/:id', (req, res) => {
    const sql = 'DELETE FROM pagos_prestamos WHERE id = ?';
    db.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Pago eliminado correctamente' });
    });
});


export default router;

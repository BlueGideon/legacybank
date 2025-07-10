import express from 'express';
const router = express.Router();
import db from '../db.js';

// Obtener prestamos por solicitante
router.get('/por-solicitante/:nombre', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM prestamos WHERE solicitante = ?', [req.params.nombre]);
        if (results.length === 0) return res.status(404).json({ message: 'Préstamo no encontrado' });
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear nuevo préstamo
router.post('/', async (req, res) => {
    try {
        const {
            fprestamo, nombre, solicitante, vprestamo,
            selecciontasa, ncuotas, valorInteres,
            valorCuota, ganancia, valorTotalPagar
        } = req.body;

        const sql = `
            INSERT INTO prestamos 
            (fprestamo, nombre, solicitante, vprestamo, selecciontasa, ncuotas, valorInteres, valorCuota, ganancia, valorTotalPagar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [
            fprestamo, nombre, solicitante, vprestamo,
            selecciontasa, ncuotas, valorInteres,
            valorCuota, ganancia, valorTotalPagar
        ]);

        res.status(201).json({ mensaje: 'Préstamo guardado con éxito', id: result.insertId });
    } catch (err) {
        console.error('❌ Error al guardar préstamo:', err);
        res.status(500).json({ mensaje: 'Error al guardar el préstamo' });
    }
});

// Obtener todos los préstamos
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM prestamos ORDER BY id DESC');
        res.json(results);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener préstamos' });
    }
});

// Obtener préstamo por ID
router.get('/:id', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM prestamos WHERE id = ?', [req.params.id]);
        if (results.length === 0) return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// Actualizar préstamo por ID
router.put('/:id', async (req, res) => {
    try {
        const {
            fprestamo, nombre, solicitante, vprestamo,
            selecciontasa, ncuotas, valorInteres,
            valorCuota, ganancia, valorTotalPagar
        } = req.body;

        const sql = `
            UPDATE prestamos SET 
            fprestamo = ?, nombre = ?, solicitante = ?, vprestamo = ?, 
            selecciontasa = ?, ncuotas = ?, valorInteres = ?, 
            valorCuota = ?, ganancia = ?, valorTotalPagar = ?
            WHERE id = ?
        `;

        const [result] = await db.query(sql, [
            fprestamo, nombre, solicitante, vprestamo,
            selecciontasa, ncuotas, valorInteres,
            valorCuota, ganancia, valorTotalPagar,
            req.params.id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        }

        res.json({ mensaje: 'Préstamo actualizado correctamente' });
    } catch (err) {
        console.error('❌ Error al actualizar préstamo:', err);
        res.status(500).json({ mensaje: 'Error al actualizar el préstamo' });
    }
});

// Eliminar préstamo por ID
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM prestamos WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        res.json({ mensaje: 'Préstamo eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al eliminar' });
    }
});

export default router;

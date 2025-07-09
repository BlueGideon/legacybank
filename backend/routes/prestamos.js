import express from 'express';
const router = express.Router();
import db from '../db.js';

// Obtener prestamos por solicitante
router.get('/por-solicitante/:nombre', (req, res) => {
    const nombre = req.params.nombre;
    const sql = 'SELECT * FROM prestamos WHERE solicitante = ?';
    db.query(sql, [nombre], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Préstamo no encontrado' });
        res.json(results[0]);
    });
});


// 👉 Crear nuevo préstamo
router.post('/', (req, res) => {
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

    db.query(sql, [
        fprestamo, nombre, solicitante, vprestamo,
        selecciontasa, ncuotas, valorInteres,
        valorCuota, ganancia, valorTotalPagar
    ], (err, result) => {
        if (err) {
            console.error('❌ Error al guardar préstamo:', err);
            return res.status(500).json({ mensaje: 'Error al guardar el préstamo' });
        }

        res.status(201).json({ mensaje: 'Préstamo guardado con éxito', id: result.insertId });
    });
});

// 👉 Obtener todos los préstamos
router.get('/', (req, res) => {
    const sql = `SELECT * FROM prestamos ORDER BY id DESC`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener préstamos:', err);
            return res.status(500).json({ mensaje: 'Error al obtener préstamos' });
        }
        res.json(results);
    });
});

// 👉 Obtener un préstamo por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM prestamos WHERE id = ?';
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener préstamo:', err);
            return res.status(500).json({ mensaje: 'Error del servidor' });
        }
        if (results.length === 0) {
            return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        }
        res.json(results[0]);
    });
});

// 👉 Actualizar préstamo por ID
router.put('/:id', (req, res) => {
    const { id } = req.params;
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

    db.query(sql, [
        fprestamo, nombre, solicitante, vprestamo,
        selecciontasa, ncuotas, valorInteres,
        valorCuota, ganancia, valorTotalPagar,
        id
    ], (err, result) => {
        if (err) {
            console.error('❌ Error al actualizar préstamo:', err);
            return res.status(500).json({ mensaje: 'Error al actualizar el préstamo' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        }

        res.json({ mensaje: 'Préstamo actualizado correctamente' });
    });
});

// 👉 Eliminar préstamo por ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM prestamos WHERE id = ?`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar préstamo:', err);
            return res.status(500).json({ mensaje: 'Error al eliminar' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        }

        res.json({ mensaje: 'Préstamo eliminado correctamente' });
    });
});

export default router;

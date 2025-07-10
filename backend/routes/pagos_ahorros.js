import express from 'express';
const router = express.Router();
import db from '../db.js';

// Obtener pagos por nombre (para informes)
router.get('/por-nombre/:nombre', async (req, res) => {
    try {
        const [resultados] = await db.query('SELECT * FROM pagos_ahorros WHERE nombre = ?', [req.params.nombre]);
        res.json(resultados);
    } catch (err) {
        console.error('Error al obtener pagos por nombre:', err);
        res.status(500).json({ mensaje: 'Error al obtener pagos por nombre' });
    }
});

// Crear nuevo pago de ahorro
router.post('/', async (req, res) => {
    try {
        const { nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora } = req.body;
        const sql = `
            INSERT INTO pagos_ahorros (nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora]);
        res.json({ mensaje: 'Pago de ahorro guardado exitosamente' });
    } catch (err) {
        console.error('Error al guardar pago de ahorro:', err);
        res.status(500).json({ mensaje: 'Error al guardar pago de ahorro' });
    }
});

// Obtener todos los pagos de ahorro
router.get('/', async (req, res) => {
    try {
        const [resultados] = await db.query('SELECT * FROM pagos_ahorros');
        res.json(resultados);
    } catch (err) {
        console.error('Error al obtener pagos de ahorro:', err);
        res.status(500).json({ mensaje: 'Error al obtener pagos de ahorro' });
    }
});

// Obtener un solo pago por ID
router.get('/:id', async (req, res) => {
    try {
        const [resultados] = await db.query('SELECT * FROM pagos_ahorros WHERE id = ?', [req.params.id]);
        res.json(resultados[0]);
    } catch (err) {
        console.error('Error al obtener pago:', err);
        res.status(500).json({ mensaje: 'Error al obtener pago' });
    }
});

// Actualizar un pago por ID
router.put('/:id', async (req, res) => {
    try {
        const { nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora } = req.body;
        const sql = `
            UPDATE pagos_ahorros 
            SET nombre = ?, puesto = ?, valor = ?, fecha_pago = ?, fecha_limite_pago = ?, mes = ?, dias_mora = ?
            WHERE id = ?
        `;
        await db.query(sql, [nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora, req.params.id]);
        res.json({ mensaje: 'Pago actualizado con éxito' });
    } catch (err) {
        console.error('Error al actualizar pago:', err);
        res.status(500).json({ mensaje: 'Error al actualizar pago' });
    }
});

// Eliminar un pago por ID
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM pagos_ahorros WHERE id = ?', [req.params.id]);
        res.json({ mensaje: 'Pago eliminado con éxito' });
    } catch (err) {
        console.error('Error al eliminar pago:', err);
        res.status(500).json({ mensaje: 'Error al eliminar pago' });
    }
});

export default router;

import express from 'express';
const router = express.Router();
import db from '../db.js';

// ✅ Obtener pagos por nombre SOLO del fondo actual
router.get('/por-nombre/:nombre', async (req, res) => {
    try {
        // Obtener el fondo actual
        const [fondoActual] = await db.query(`SELECT id FROM fondos WHERE esActual = 'Si' LIMIT 1`);
        if (!fondoActual.length) {
            return res.status(400).json({ mensaje: "No hay fondo actual establecido" });
        }
        const fondoId = fondoActual[0].id;

        const [resultados] = await db.query(
            `SELECT pa.*, pa.fondo_id AS id_fondo
             FROM pagos_ahorros pa
             WHERE pa.nombre = ? AND pa.fondo_id = ?`,
            [req.params.nombre, fondoId]
        );
        res.json(resultados);
    } catch (err) {
        console.error('❌ Error al obtener pagos por nombre:', err);
        res.status(500).json({ mensaje: 'Error al obtener pagos por nombre' });
    }
});

// ✅ Obtener pagos con mora del fondo actual
router.get('/moras', async (req, res) => {
    try {
        // 1. Fondo actual
        const [fondoActual] = await db.query(`SELECT id FROM fondos WHERE esActual = 'Si' LIMIT 1`);
        if (!fondoActual.length) {
            return res.status(400).json({ mensaje: "No hay fondo actual establecido" });
        }
        const fondoId = fondoActual[0].id;

        // 2. Solo pagos con mora > 0 en este fondo
        const [pagosConMora] = await db.query(
            `SELECT pa.*, pa.fondo_id AS id_fondo
             FROM pagos_ahorros pa
             WHERE pa.fondo_id = ? AND pa.dias_mora > 0`,
            [fondoId]
        );

        res.json(pagosConMora);

    } catch (err) {
        console.error('❌ Error al obtener pagos con mora:', err);
        res.status(500).json({ mensaje: 'Error al obtener pagos con mora' });
    }
});


// Crear nuevo pago de ahorro con fondo_id
router.post('/', async (req, res) => {
    try {
        const { nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora } = req.body;

        // ✅ Obtener el fondo actual
        const [fondoActual] = await db.query(`SELECT id FROM fondos WHERE esActual = 'Si' LIMIT 1`);
        if (!fondoActual.length) {
            return res.status(400).json({ mensaje: "No hay fondo actual establecido" });
        }
        const fondoId = fondoActual[0].id;

        const sql = `
            INSERT INTO pagos_ahorros 
            (nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora, fondo_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora, fondoId]);

        res.json({ mensaje: 'Pago de ahorro guardado exitosamente' });
    } catch (err) {
        console.error('Error al guardar pago de ahorro:', err);
        res.status(500).json({ mensaje: 'Error al guardar pago de ahorro' });
    }
});


// Obtener todos los pagos de ahorro
router.get('/', async (req, res) => {
    try {
        const [resultados] = await db.query(`
            SELECT pa.*, f.nombre AS fondo
            FROM pagos_ahorros pa
            JOIN fondos f ON pa.fondo_id = f.id
        `);
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

import express from 'express';
import db from '../db.js';

const router = express.Router();

// ✅ Pagos solo del fondo actual
router.get('/fondo-actual', async (req, res) => {
    try {
        const [fondoRes] = await db.query(`SELECT id FROM fondos WHERE esActual = 'Si' LIMIT 1`);
        if (!fondoRes.length) return res.status(400).json({ mensaje: "No hay fondo actual establecido" });

        const idFondo = fondoRes[0].id;
        const [rows] = await db.query(
            `SELECT pma.*, f.nombre AS fondo 
             FROM pagos_mora_ahorros pma
             LEFT JOIN fondos f ON pma.id_fondo = f.id
             WHERE pma.id_fondo = ?`,
            [idFondo]
        );

        res.json(rows);
    } catch (err) {
        console.error('Error al obtener pagos de mora (fondo actual):', err);
        res.status(500).json({ mensaje: 'Error al obtener pagos de mora' });
    }
});


// ✅ Obtener todos los pagos de mora por ahorros (ya con nombre del fondo)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT pma.*, f.nombre AS fondo
            FROM pagos_mora_ahorros pma
            LEFT JOIN fondos f ON pma.id_fondo = f.id
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener pagos de mora:', err);
        res.status(500).json({ mensaje: 'Error al obtener los pagos de mora' });
    }
});

// Obtener el pago original de ahorro (para reconstruir mora, abonado, restante)
router.get('/original/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM pagos_ahorros WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Pago original no encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener pago original:', err);
        res.status(500).json({ mensaje: 'Error al obtener el pago original' });
    }
});

// Consultar total abonado por ID de pago ahorro
router.get('/abonados/:id', async (req, res) => {
    try {
        const idPago = req.params.id;

        const sql = `SELECT SUM(valor) AS total_abonado FROM pagos_mora_ahorros WHERE id_pago_ahorro = ?`;
        const [resultados] = await db.query(sql, [idPago]);

        const total = resultados[0]?.total_abonado ?? 0;
        res.json({ total_abonado: total });
    } catch (err) {
        console.error('Error al obtener abonos:', err);
        res.status(500).json({ mensaje: 'Error al obtener abonos' });
    }
});

// Registrar nuevo pago de mora
router.post('/', async (req, res) => {
    try {
        const { nombre, fecha_pago, concepto, detalle, valor, id_pago_ahorro, id_fondo } = req.body;

        const sql = `
            INSERT INTO pagos_mora_ahorros 
            (nombre, fecha_pago, concepto, detalle, valor, id_pago_ahorro, id_fondo)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [nombre, fecha_pago, concepto, detalle, valor, id_pago_ahorro, id_fondo]);

        res.json({ mensaje: 'Pago de mora registrado exitosamente', id: result.insertId });
    } catch (err) {
        console.error('Error al guardar pago de mora:', err);
        res.status(500).json({ mensaje: 'Error al guardar el pago de mora' });
    }
});

// Eliminar un pago de mora
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM pagos_mora_ahorros WHERE id = ?', [id]);
        res.sendStatus(204);
    } catch (err) {
        console.error('Error al eliminar pago de mora:', err);
        res.status(500).json({ mensaje: 'Error al eliminar el pago de mora' });
    }
});

// Actualizar un pago de mora
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, fecha_pago, concepto, detalle, valor, id_pago_ahorro } = req.body;

        const sql = `
            UPDATE pagos_mora_ahorros
            SET nombre = ?, fecha_pago = ?, concepto = ?, detalle = ?, valor = ?, id_pago_ahorro = ?
            WHERE id = ?
        `;

        await db.query(sql, [nombre, fecha_pago, concepto, detalle, valor, id_pago_ahorro, id]);
        res.json({ mensaje: 'Pago de mora actualizado correctamente' });
    } catch (err) {
        console.error('Error al actualizar pago de mora:', err);
        res.status(500).json({ mensaje: 'Error al actualizar el pago de mora' });
    }
});

// Obtener un pago de mora por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM pagos_mora_ahorros WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Pago de mora no encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener pago de mora por ID:', err);
        res.status(500).json({ mensaje: 'Error al obtener el pago de mora' });
    }
});

export default router;

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
            `SELECT pmp.*, f.nombre AS fondo 
             FROM pagos_mora_prestamos pmp
             LEFT JOIN fondos f ON pmp.id_fondo = f.id
             WHERE pmp.id_fondo = ?`,
            [idFondo]
        );

        res.json(rows);
    } catch (err) {
        console.error('Error al obtener pagos mora préstamos (fondo actual):', err);
        res.status(500).json({ mensaje: 'Error al obtener pagos de mora de préstamos' });
    }
});

// ✅ Obtener pagos mora por préstamo (ya con nombre del fondo)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT pmp.*, f.nombre AS fondo
            FROM pagos_mora_prestamos pmp
            LEFT JOIN fondos f ON pmp.id_fondo = f.id
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener pagos de mora de préstamos:', err);
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
    let { solicitante, fecha_pago, concepto, detalle, valor, id_pago_prestamo, id_fondo } = req.body;

    try {
        // ✅ Si no viene el id_fondo, buscamos el fondo actual automáticamente
        if (!id_fondo) {
            const [fondoRes] = await db.query(`SELECT id FROM fondos WHERE esActual = 'Si' LIMIT 1`);
            if (!fondoRes.length) return res.status(400).json({ mensaje: "No hay fondo actual establecido" });
            id_fondo = fondoRes[0].id;
        }

        await db.query(
            `INSERT INTO pagos_mora_prestamos 
            (solicitante, fecha_pago, concepto, detalle, valor, id_pago_prestamo, id_fondo) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [solicitante, fecha_pago, concepto, detalle, valor, id_pago_prestamo, id_fondo]
        );
        res.status(201).json({ mensaje: 'Pago de mora registrado' });

    } catch (err) {
        console.error("❌ Error al insertar pago mora prestamos:", err);
        res.status(500).json({ error: err.message });
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
        console.error('Error en backend:', err);
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

import express from 'express';
const router = express.Router();
import db from '../db.js';

// ✅ Obtener pagos por solicitante (fondo actual)
router.get('/por-solicitante/:nombre', async (req, res) => {
    try {
        let { fondo_id } = req.query;

        // 🔥 Si no envían fondo_id, buscamos el fondo actual
        if (!fondo_id) {
            const [fondoActual] = await db.query(`SELECT id FROM fondos WHERE esActual = 'Si' LIMIT 1`);
            if (!fondoActual.length) {
                return res.status(400).json({ mensaje: "No hay fondo actual establecido" });
            }
            fondo_id = fondoActual[0].id;
        }

        const sql = `
            SELECT pp.*, p.solicitante, p.fondo_id
            FROM pagos_prestamos pp
            JOIN prestamos p ON pp.idPrestamo = p.id
            WHERE p.solicitante = ? AND p.fondo_id = ?
            ORDER BY pp.fpago DESC
        `;

        const [results] = await db.query(sql, [req.params.nombre, fondo_id]);
        res.json(results);
    } catch (err) {
        console.error('❌ Error al obtener pagos por solicitante:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Obtener pagos por ID de préstamo (sin cambio, ya es específico)
router.get('/por-prestamo/:idPrestamo', async (req, res) => {
    try {
        const [results] = await db.query(
            'SELECT * FROM pagos_prestamos WHERE idPrestamo = ?',
            [req.params.idPrestamo]
        );
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Obtener todos los pagos (fondo actual por defecto)
router.get('/', async (req, res) => {
    try {
        let { fondo_id } = req.query;

        if (!fondo_id) {
            const [fondoActual] = await db.query(`SELECT id FROM fondos WHERE esActual = 'Si' LIMIT 1`);
            if (!fondoActual.length) {
                return res.status(400).json({ mensaje: "No hay fondo actual establecido" });
            }
            fondo_id = fondoActual[0].id;
        }

        const sql = `
            SELECT pp.*, p.solicitante, f.nombre AS fondo
            FROM pagos_prestamos pp
            JOIN prestamos p ON pp.idPrestamo = p.id
            JOIN fondos f ON p.fondo_id = f.id
            WHERE p.fondo_id = ?
            ORDER BY pp.fpago DESC
        `;

        const [results] = await db.query(sql, [fondo_id]);
        res.json(results);
    } catch (err) {
        console.error('❌ Error al obtener pagos:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ Crear nuevo pago
router.post('/', async (req, res) => {
    try {
        const { solicitante, fpago, flpago, vpago, cuotaAPagar, idPrestamo } = req.body;

        // ✅ Obtener el fondo actual
        const [fondoActual] = await db.query(`SELECT id FROM fondos WHERE esActual = 'Si' LIMIT 1`);
        if (!fondoActual.length) {
            return res.status(400).json({ mensaje: "No hay fondo actual establecido" });
        }
        const fondoId = fondoActual[0].id;

        const sql = `
            INSERT INTO pagos_prestamos 
            (solicitante, fpago, flpago, vpago, cuotaAPagar, idPrestamo, fondo_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [solicitante, fpago, flpago, vpago, cuotaAPagar, idPrestamo, fondoId]);

        res.json({ message: 'Pago guardado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Actualizar pago existente
router.put('/:id', async (req, res) => {
    try {
        const { solicitante, fpago, flpago, vpago, cuotaAPagar, idPrestamo } = req.body;
        const sql = `
            UPDATE pagos_prestamos 
            SET solicitante = ?, fpago = ?, flpago = ?, vpago = ?, cuotaAPagar = ?, idPrestamo = ?
            WHERE id = ?
        `;
        await db.query(sql, [solicitante, fpago, flpago, vpago, cuotaAPagar, idPrestamo, req.params.id]);
        res.json({ message: 'Pago actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Eliminar pago
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM pagos_prestamos WHERE id = ?', [req.params.id]);
        res.json({ message: 'Pago eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

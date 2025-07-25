import express from 'express';
const router = express.Router();
import db from '../db.js';

// Obtener prestamos por solicitante
router.get('/por-solicitante/:nombre', async (req, res) => {
    try {
        const [results] = await db.query(
            'SELECT * FROM prestamos WHERE solicitante = ?',
            [req.params.nombre]
        );

        if (results.length === 0) {
            return res.json([]); // ✅ Devolvemos array vacío en lugar de 404
        }

        res.json(results); // ✅ Devolvemos SIEMPRE un array
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Total de ganancias acumuladas de préstamos SOLO para el fondo actual (corrigiendo fórmula)
router.get("/total-ganancias", async (req, res) => {
    try {
        let { fondo_id } = req.query;

        // ✅ Si no envían fondo_id, tomamos el fondo actual
        if (!fondo_id) {
            const [fondoActual] = await db.query(`SELECT id FROM fondos WHERE esActual = 'Si' LIMIT 1`);
            if (!fondoActual.length) {
                return res.status(400).json({ mensaje: 'No hay fondo actual establecido' });
            }
            fondo_id = fondoActual[0].id;
        }

        const [pagos] = await db.query(`
            SELECT pp.vpago, pr.valorInteres, pr.ncuotas, pr.selecciontasa
            FROM pagos_prestamos pp
            JOIN prestamos pr ON pp.idPrestamo = pr.id
            WHERE pr.fondo_id = ?
        `, [fondo_id]);

        let totalGanancias = 0;

        pagos.forEach(p => {
            const valorPago = parseFloat(p.vpago) || 0;      // M20, P20...
            const valorInteres = parseFloat(p.valorInteres) || 0; // H20
            const tasa = p.selecciontasa
                ? parseFloat(p.selecciontasa.replace("%", "")) / 100
                : 0; // 2% → 0.02
            const ncuotas = parseInt(p.ncuotas) || 0;        // G20

            // ✅ Fórmula EXACTA: ((M20 - H20) + (P20 - H20)) * 2% * G20
            // Como cada registro es un pago, se aplica (valorPago - valorInteres) * tasa * ncuotas
            totalGanancias += ((valorPago - valorInteres) * tasa * ncuotas);
        });

        res.json({ totalGanancias });
    } catch (error) {
        console.error("Error calculando total de ganancias:", error);
        res.status(500).json({ error: "Error en el cálculo de ganancias" });
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

        // ✅ Obtener el fondo actual
        const [fondoActual] = await db.query(`SELECT id FROM fondos WHERE esActual = 'Si' LIMIT 1`);
        if (!fondoActual.length) {
            return res.status(400).json({ mensaje: "No hay fondo actual establecido" });
        }
        const fondoId = fondoActual[0].id;

        const sql = `
            INSERT INTO prestamos 
            (fprestamo, nombre, solicitante, vprestamo, selecciontasa, ncuotas, valorInteres, valorCuota, ganancia, valorTotalPagar, fondo_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(sql, [
            fprestamo, nombre, solicitante, vprestamo,
            selecciontasa, ncuotas, valorInteres,
            valorCuota, ganancia, valorTotalPagar,
            fondoId
        ]);

        res.status(201).json({ mensaje: 'Préstamo guardado con éxito' });
    } catch (err) {
        console.error('❌ Error al guardar préstamo:', err);
        res.status(500).json({ mensaje: 'Error al guardar el préstamo' });
    }
});


// ✅ Obtener préstamos del fondo actual si no se envía fondo_id
router.get('/', async (req, res) => {
    try {
        let { fondo_id } = req.query;

        // 🔥 Aquí es donde lo ajustamos
        if (!fondo_id) {
            const [fondoActual] = await db.query(`SELECT id FROM fondos WHERE esActual = 'Si' LIMIT 1`);
            if (!fondoActual.length) {
                return res.status(400).json({ mensaje: 'No hay fondo actual establecido' });
            }
            fondo_id = fondoActual[0].id;
        }

        const sql = `
            SELECT p.*, f.nombre AS fondo
            FROM prestamos p
            JOIN fondos f ON p.fondo_id = f.id
            WHERE f.id = ?
            ORDER BY p.id DESC
        `;

        const [results] = await db.query(sql, [fondo_id]);
        res.json(results);
    } catch (err) {
        console.error('❌ Error al obtener préstamos:', err);
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

import express from 'express';
const router = express.Router();
import db from '../db.js';

// Obtener pagos por nombre (para informes)
router.get('/por-nombre/:nombre', (req, res) => {
    const nombre = req.params.nombre;
    const sql = `SELECT * FROM pagos_ahorros WHERE nombre = ?`;

    db.query(sql, [nombre], (err, resultados) => {
        if (err) {
            console.error('Error al obtener pagos por nombre:', err);
            return res.status(500).json({ mensaje: 'Error al obtener pagos por nombre' });
        }

        res.json(resultados);
    });
});


// Crear nuevo pago de ahorro
router.post('/', (req, res) => {
    const { nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora } = req.body;

    const sql = `
        INSERT INTO pagos_ahorros (nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora], (err, result) => {
        if (err) {
            console.error('Error al guardar pago de ahorro:', err);
            return res.status(500).json({ mensaje: 'Error al guardar pago de ahorro' });
        }

        res.json({ mensaje: 'Pago de ahorro guardado exitosamente' });
    });
});

// Obtener todos los pagos de ahorro
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM pagos_ahorros';

    db.query(sql, (err, resultados) => {
        if (err) {
            console.error('Error al obtener pagos de ahorro:', err);
            return res.status(500).json({ mensaje: 'Error al obtener pagos de ahorro' });
        }

        res.json(resultados);
    });
});

// Obtener un solo pago por ID
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM pagos_ahorros WHERE id = ?', [id], (err, resultados) => {
        if (err) {
            console.error('Error al obtener pago:', err);
            return res.status(500).json({ mensaje: 'Error al obtener pago' });
        }
        res.json(resultados[0]);
    });
});

// Actualizar un pago por ID
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora } = req.body;

    const sql = `
        UPDATE pagos_ahorros 
        SET nombre = ?, puesto = ?, valor = ?, fecha_pago = ?, fecha_limite_pago = ?, mes = ?, dias_mora = ?
        WHERE id = ?
    `;

    db.query(sql, [nombre, puesto, valor, fecha_pago, fecha_limite_pago, mes, dias_mora, id], (err) => {
        if (err) {
            console.error('Error al actualizar pago:', err);
            return res.status(500).json({ mensaje: 'Error al actualizar pago' });
        }

        res.json({ mensaje: 'Pago actualizado con éxito' });
    });
});

// Eliminar un pago por ID
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM pagos_ahorros WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error al eliminar pago:', err);
            return res.status(500).json({ mensaje: 'Error al eliminar pago' });
        }
        res.json({ mensaje: 'Pago eliminado con éxito' });
    });
});



// Después (ESM)
export default router;

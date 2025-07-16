import express from 'express';
import db from '../db.js';

const router = express.Router();

// Obtener préstamos por solicitante y fecha
router.get('/prestamos', async (req, res) => {
    const { participante, ano, mes } = req.query;

    let sql = `SELECT * FROM prestamos WHERE nombre = ?`;
    const params = [participante];

    if (ano) {
        sql += ` AND YEAR(fprestamo) = ?`;
        params.push(ano);
    }

    if (mes) {
        sql += ` AND MONTH(fprestamo) = ?`;
        params.push(mes);
    }

    try {
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Error consultando préstamos:', error);
        res.status(500).json({ mensaje: 'Error en servidor' });
    }
});

// Obtener pagos de préstamos por solicitante y fecha
router.get('/pagos', async (req, res) => {
    const { participante, ano, mes } = req.query;

    let sql = `SELECT * FROM pagos_prestamos WHERE solicitante = ?`;
    const params = [participante];

    if (ano) {
        sql += ` AND YEAR(fpago) = ?`;
        params.push(ano);
    }

    if (mes) {
        sql += ` AND MONTH(fpago) = ?`;
        params.push(mes);
    }

    try {
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Error consultando pagos de préstamos:', error);
        res.status(500).json({ mensaje: 'Error en servidor' });
    }
});

export default router;

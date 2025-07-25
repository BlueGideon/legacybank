import express from "express";
import db from "../db.js";

const router = express.Router();

// ✅ Obtener liquidaciones (filtra por fondo si se envía fondo_id)
router.get("/", async (req, res) => {
    try {
        const { fondo_id } = req.query;

        let query = "SELECT * FROM liquidaciones";
        let params = [];

        if (fondo_id) {
            query += " WHERE fondo_id = ?";
            params.push(fondo_id);
        }

        query += " ORDER BY fecha_liquidacion DESC";

        const [filas] = await db.query(query, params);
        res.json(filas);
    } catch (err) {
        console.error("Error al obtener liquidaciones:", err);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
});

// ✅ Guardar nueva liquidación
router.post("/", async (req, res) => {
    const { nombre, motivo, valor_liquidar, fecha_liquidacion, fondo_id } = req.body;

    if (!nombre || !motivo || !valor_liquidar || !fecha_liquidacion || !fondo_id) {
        return res.status(400).json({ mensaje: "Faltan datos" });
    }

    try {
        await db.query(
            "INSERT INTO liquidaciones (nombre, motivo, valor_liquidar, fecha_liquidacion, fondo_id) VALUES (?, ?, ?, ?, ?)",
            [nombre, motivo, valor_liquidar, fecha_liquidacion, fondo_id]
        );
        res.json({ mensaje: "Liquidación guardada con éxito" });
    } catch (err) {
        console.error("Error guardando liquidación:", err);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
});

export default router;

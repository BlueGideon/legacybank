import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/pendientes", async (req, res) => {
    try {
        const [fondoActual] = await db.query("SELECT id FROM fondos WHERE esActual = 'Si'");
        if (!fondoActual.length) {
            return res.status(404).json({ message: "No hay un fondo marcado como actual." });
        }
        const fondoId = fondoActual[0].id;

        const [participantes] = await db.query(
            "SELECT nombre FROM participantes WHERE fondo_id = ?",
            [fondoId]
        );

        const [prestamos] = await db.query(
            "SELECT nombre, SUM(vprestamo) AS totalPrestamos FROM prestamos WHERE fondo_id = ? GROUP BY nombre",
            [fondoId]
        );

        // ✅ Moras en ahorros
        const [morasAhorros] = await db.query(`
            SELECT 
                sub.nombre, 
                SUM(sub.restante) AS restante
            FROM (
                SELECT 
                    pa.nombre,
                    (pa.dias_mora * 1000) - IFNULL(SUM(pma.valor),0) AS restante
                FROM pagos_ahorros pa
                LEFT JOIN pagos_mora_ahorros pma ON pma.id_pago_ahorro = pa.id
                WHERE pa.fondo_id = ? AND pa.dias_mora > 0
                GROUP BY pa.id
            ) AS sub
            GROUP BY sub.nombre
        `, [fondoId]);

        // ✅ Moras en préstamos (corregido FINAL)
        const [morasPrestamos] = await db.query(`
            SELECT 
                sub.nombre, 
                SUM(sub.restante) AS restante
            FROM (
                SELECT 
                    pr.nombre,
                    (GREATEST(DATEDIFF(prp.fpago, prp.flpago),0) * 1000)
                    - IFNULL((
                        SELECT SUM(valor) 
                        FROM pagos_mora_prestamos pmp 
                        WHERE pmp.id_pago_prestamo = prp.id
                    ),0) AS restante
                FROM pagos_prestamos prp
                JOIN prestamos pr ON pr.id = prp.idPrestamo
                WHERE pr.fondo_id = ? AND DATEDIFF(prp.fpago, prp.flpago) > 0
            ) AS sub
            GROUP BY sub.nombre
        `, [fondoId]);

        // ✅ Armar respuesta final (separado)
        const resultado = participantes.map((p) => {
            const prestamo = prestamos.find((pr) => pr.nombre === p.nombre);
            const totalPrestamo = prestamo ? parseFloat(prestamo.totalPrestamos) : 0;
            const multa = totalPrestamo < 250000 ? 60000 : 0;

            const moraAhorrosPendiente = morasAhorros
                .filter((m) => m.nombre === p.nombre)
                .reduce((acc, m) => acc + (m.restante > 0 ? m.restante : 0), 0);

            const moraPrestamosPendiente = morasPrestamos
                .filter((m) => m.nombre === p.nombre)
                .reduce((acc, m) => acc + (m.restante > 0 ? m.restante : 0), 0);

            return {
                nombre: p.nombre,
                moraPrestamos: moraPrestamosPendiente,
                moraAhorros: moraAhorrosPendiente,
                multa
            };
        });

        res.json(resultado);
    } catch (err) {
        console.error("Error en multas y moras:", err);
        res.status(500).json({ message: "Error al obtener multas y moras" });
    }
});

export default router;

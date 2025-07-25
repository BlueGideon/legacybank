import express from 'express';
const router = express.Router();
import db from '../db.js';

// ✅ Obtener un participante específico por nombre y fondo
router.get('/buscar', async (req, res) => {
    try {
        const { nombre, fondo_id } = req.query;
        const [resultados] = await db.query(
            `SELECT nombre, cantPuestos 
             FROM participantes 
             WHERE nombre = ? AND fondo_id = ? AND rol = 'Usuario'`,
            [nombre, fondo_id]
        );
        res.json(resultados[0] || {});
    } catch (err) {
        console.error("Error al buscar participante:", err);
        res.status(500).json({ mensaje: "Error al buscar participante" });
    }
});

// ✅ GET participantes con rol Usuario y filtrados por fondo si se pasa como query
router.get('/usuarios', async (req, res) => {
    try {
        const { fondo_id } = req.query;

        let sql = `SELECT nombre, puesto, cantPuestos, fondo_id FROM participantes WHERE rol = 'Usuario'`;
        const params = [];

        if (fondo_id) {
            sql += ` AND fondo_id = ?`;
            params.push(fondo_id);
        }

        const [resultados] = await db.query(sql, params);
        res.json(resultados);
    } catch (err) {
        console.error('❌ Error en la consulta SQL:', err);
        res.status(500).json({ mensaje: 'Error en la consulta.' });
    }
});


// ✅ Obtener participantes filtrados por fondo, participante y puesto
router.get('/filtrados', async (req, res) => {
    const { fondo_id, participante, puesto } = req.query;

    try {
        let sql = `SELECT * FROM participantes WHERE 1=1`;

        const params = [];

        if (fondo_id) {
            sql += ` AND fondo_id = ?`;
            params.push(fondo_id);
        }

        if (participante) {
            sql += ` AND nombre = ?`;
            params.push(participante);
        }

        if (puesto) {
            sql += ` AND puesto = ?`;
            params.push(puesto);
        }

        sql += ` AND rol = 'Usuario'`;

        const [resultados] = await db.query(sql, params);
        res.json(resultados);

    } catch (err) {
        console.error('Error al filtrar participantes:', err);
        res.status(500).json({ mensaje: 'Error al filtrar participantes' });
    }
});

// ✅ Actualizar solo perfil de administrador
router.put('/perfil-admin/:id', async (req, res) => {
    try {
        const { nombre, correo, telefono } = req.body;
        const sql = `UPDATE participantes 
                     SET nombre = ?, correo = ?, telefono = ?
                     WHERE id = ? AND rol = 'Administrador'`;
        await db.query(sql, [nombre, correo, telefono, req.params.id]);
        res.json({ mensaje: 'Perfil de administrador actualizado con éxito' });
    } catch (err) {
        console.error('Error al actualizar perfil admin:', err);
        res.status(500).json({ mensaje: 'Error al actualizar perfil admin' });
    }
});

// ✅ Cambiar solo la contraseña del administrador
router.put('/cambiar-contrasena/:id', async (req, res) => {
    try {
        const { contrasena } = req.body;
        const sql = `UPDATE participantes SET contrasena = ? WHERE id = ? AND rol = 'Administrador'`;
        await db.query(sql, [contrasena, req.params.id]);
        res.json({ mensaje: 'Contraseña actualizada con éxito' });
    } catch (err) {
        console.error('Error al cambiar contraseña:', err);
        res.status(500).json({ mensaje: 'Error al cambiar contraseña' });
    }
});

// Crear participante
router.post('/', async (req, res) => {
    try {
        const { nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo_id } = req.body;
        const sql = `INSERT INTO participantes (nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo_id]);
        res.status(201).json({ mensaje: 'Participante creado con éxito', id: result.insertId });
    } catch (err) {
        console.error('Error al crear participante:', err);
        res.status(500).json({ mensaje: `Error al crear participante: ${err.message}` });
    }
});

// Obtener todos los participantes
router.get('/', async (req, res) => {
    try {
        const [resultados] = await db.query('SELECT * FROM participantes');
        res.json(resultados);
    } catch (err) {
        console.error('Error al obtener participantes:', err);
        res.status(500).json({ mensaje: 'Error al obtener participantes' });
    }
});

// Obtener un participante por ID
router.get('/:id', async (req, res) => {
    try {
        const [resultados] = await db.query('SELECT * FROM participantes WHERE id = ?', [req.params.id]);
        res.json(resultados[0]);
    } catch (err) {
        console.error('Error al obtener participante:', err);
        res.status(500).json({ mensaje: 'Error al obtener participante' });
    }
});

// Eliminar un participante por ID
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM participantes WHERE id = ?', [req.params.id]);
        res.json({ mensaje: 'Participante eliminado con éxito' });
    } catch (err) {
        console.error('Error al eliminar participante:', err);
        res.status(500).json({ mensaje: 'Error al eliminar participante' });
    }
});

// Actualizar un participante por ID
router.put('/:id', async (req, res) => {
    try {
        const { nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo_id } = req.body;
        const sql = `UPDATE participantes 
                     SET nombre = ?, correo = ?, contrasena = ?, telefono = ?, rol = ?, puesto = ?, cantPuestos = ?, fondo_id = ?
                     WHERE id = ?`;
        await db.query(sql, [nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo_id, req.params.id]);
        res.json({ mensaje: 'Participante actualizado con éxito' });
    } catch (err) {
        console.error('Error al actualizar participante:', err);
        res.status(500).json({ mensaje: 'Error al actualizar participante' });
    }
});

export default router;
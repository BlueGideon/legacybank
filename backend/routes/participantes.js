import express from 'express';
const router = express.Router();
import db from '../db.js';

// GET participantes con rol Usuario
router.get('/usuarios', async (req, res) => {
    try {
        const [resultados] = await db.query('SELECT nombre, puesto, cantPuestos FROM participantes WHERE rol = "Usuario"');
        res.json(resultados);
    } catch (err) {
        console.error('❌ Error en la consulta SQL:', err);
        res.status(500).json({ mensaje: 'Error en la consulta.' });
    }
});

// Crear participante
router.post('/', async (req, res) => {
    try {
        const { nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo } = req.body;
        const sql = `INSERT INTO participantes (nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo]);
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
        const { nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo } = req.body;
        const sql = `UPDATE participantes 
                     SET nombre = ?, correo = ?, contrasena = ?, telefono = ?, rol = ?, puesto = ?, cantPuestos = ?, fondo = ?
                     WHERE id = ?`;
        await db.query(sql, [nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo, req.params.id]);
        res.json({ mensaje: 'Participante actualizado con éxito' });
    } catch (err) {
        console.error('Error al actualizar participante:', err);
        res.status(500).json({ mensaje: 'Error al actualizar participante' });
    }
});

export default router;


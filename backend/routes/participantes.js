import express from 'express';
const router = express.Router();
import db from '../db.js';

// GET participantes con rol Usuario
router.get('/usuarios', (req, res) => {
    db.query('SELECT nombre, puesto, cantPuestos FROM participantes WHERE rol = "Usuario"', (err, resultados) => {
        if (err) {
            console.error('❌ Error en la consulta SQL:', err);
            return res.status(500).json({ mensaje: 'Error en la consulta.' });
        }

        try {
            res.json(resultados);
        } catch (error) {
            console.error('❌ Error al enviar JSON:', error);
            res.status(500).send('Error interno al enviar JSON');
        }
    });
});


// Crear participante
router.post('/', (req, res) => {
    const { nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo } = req.body;

    const sql = `INSERT INTO participantes (nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo], (err, result) => {
        if (err) {
            console.error('Error al crear participante:', err.sqlMessage || err.message);
            return res.status(500).json({ mensaje: `Error al crear participante: ${err.sqlMessage || err.message}` });
        }


        res.status(201).json({ mensaje: 'Participante creado con éxito', id: result.insertId });
    });
});

// Obtener todos los participantes
router.get('/', (req, res) => {
    db.query('SELECT * FROM participantes', (err, resultados) => {
        if (err) {
            console.error('Error al obtener participantes:', err);
            return res.status(500).json({ mensaje: 'Error al obtener participantes' });
        }
        res.json(resultados);
    });
});

// Obtener un participante por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM participantes WHERE id = ?', [id], (err, resultados) => {
        if (err) {
            console.error('Error al obtener participante:', err);
            return res.status(500).json({ mensaje: 'Error al obtener participante' });
        }
        res.json(resultados[0]);
    });
});

// Eliminar un participante por ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM participantes WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error al eliminar participante:', err);
            return res.status(500).json({ mensaje: 'Error al eliminar participante' });
        }
        res.json({ mensaje: 'Participante eliminado con éxito' });
    });
});

// Actualizar un participante por ID
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo } = req.body;

    const sql = `UPDATE participantes 
                 SET nombre = ?, correo = ?, contrasena = ?, telefono = ?, rol = ?, puesto = ?, cantPuestos = ?, fondo = ?
                 WHERE id = ?`;

    db.query(sql, [nombre, correo, contrasena, telefono, rol, puesto, cantPuestos, fondo, id], (err) => {
        if (err) {
            console.error('Error al actualizar participante:', err);
            return res.status(500).json({ mensaje: 'Error al actualizar participante' });
        }
        res.json({ mensaje: 'Participante actualizado con éxito' });
    });
});

// Después (ESM)
export default router;

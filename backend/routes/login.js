import express from 'express';
const router = express.Router();
import db from '../db.js';

// Ruta para login de administrador
router.post('/', (req, res) => {
    const { correo, contrasena } = req.body;

    const sql = `SELECT * FROM participantes WHERE correo = ? AND contrasena = ? AND rol = 'Administrador' LIMIT 1`;

    db.query(sql, [correo, contrasena], (err, results) => {
        if (err) {
            console.error('Error en login:', err);
            return res.status(500).json({ mensaje: 'Error interno del servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas o no eres administrador' });
        }

        const usuario = { ...results[0] };
        delete usuario.contrasena;

        res.json({ mensaje: 'Inicio de sesión exitoso', usuario });
    });
});

// Verificar identidad para recuperación de contraseña
router.post('/verificar-identidad', (req, res) => {
    const { correo, fondo } = req.body;

    const sql = `SELECT * FROM participantes WHERE correo = ? AND fondo = ? AND rol = 'Administrador' LIMIT 1`;

    db.query(sql, [correo, fondo], (err, results) => {
        if (err) {
            console.error('Error al verificar identidad:', err);
            return res.status(500).json({ mensaje: 'Error del servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontró un administrador con ese correo y fondo actual.' });
        }

        res.json({ mensaje: 'Identidad verificada correctamente' });
    });
});

// Ruta para actualizar la contraseña del administrador
router.put('/actualizar-contrasena', (req, res) => {
    const { correo, fondo, nuevaContrasena } = req.body;

    const sql = `UPDATE participantes SET contrasena = ? WHERE correo = ? AND fondo = ? AND rol = 'Administrador'`;

    db.query(sql, [nuevaContrasena, correo, fondo], (err, result) => {
        if (err) {
            console.error('Error al actualizar contraseña:', err);
            return res.status(500).json({ mensaje: 'Error al actualizar la contraseña' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se encontró el administrador para actualizar' });
        }

        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    });
});

// Después (ESM)
export default router;
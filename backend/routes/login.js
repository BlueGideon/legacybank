import express from 'express';
const router = express.Router();
import db from '../db.js';

// Ruta para login de administrador
router.post('/', async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    const [results] = await db.query(
      `SELECT * FROM participantes WHERE correo = ? AND contrasena = ? AND rol = 'Administrador' LIMIT 1`,
      [correo, contrasena]
    );

    if (results.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas o no eres administrador' });
    }

    const usuario = { ...results[0] };
    delete usuario.contrasena;

    res.json({ mensaje: 'Inicio de sesión exitoso', usuario });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// Verificar identidad para recuperación de contraseña
router.post('/verificar-identidad', async (req, res) => {
  const { correo, fondo } = req.body;

  try {
    const [results] = await db.query(
      `SELECT * FROM participantes WHERE correo = ? AND fondo = ? AND rol = 'Administrador' LIMIT 1`,
      [correo, fondo]
    );

    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontró un administrador con ese correo y fondo actual.' });
    }

    res.json({ mensaje: 'Identidad verificada correctamente' });
  } catch (err) {
    console.error('Error al verificar identidad:', err);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// Ruta para actualizar la contraseña del administrador
router.put('/actualizar-contrasena', async (req, res) => {
  const { correo, fondo, nuevaContrasena } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE participantes SET contrasena = ? WHERE correo = ? AND fondo = ? AND rol = 'Administrador'`,
      [nuevaContrasena, correo, fondo]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'No se encontró el administrador para actualizar' });
    }

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error al actualizar contraseña:', err);
    res.status(500).json({ mensaje: 'Error al actualizar la contraseña' });
  }
});

export default router;

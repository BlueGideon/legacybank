import express from 'express';
const router = express.Router();
import db from '../db.js';

// 1. CREAR fondo
router.post('/', async (req, res) => {
  const { nombre, tISocio, tIExterno, vPCompleto, esActual } = req.body;

  try {
    if (esActual === 'Si') {
      await db.query(`UPDATE fondos SET esActual = 'No' WHERE esActual = 'Si'`);
    }

    const [result] = await db.query(
      `INSERT INTO fondos (nombre, tISocio, tIExterno, vPCompleto, esActual) VALUES (?, ?, ?, ?, ?)`,
      [nombre, tISocio, tIExterno, vPCompleto, esActual]
    );

    res.status(201).json({ mensaje: 'Fondo creado con éxito', id: result.insertId });
  } catch (err) {
    console.error('Error al guardar fondo:', err);
    res.status(500).json({ mensaje: 'Error al guardar el fondo' });
  }
});

// 2. OBTENER fondo actual
router.get('/actual', async (req, res) => {
  try {
    const [results] = await db.query(`SELECT * FROM fondos WHERE esActual = 'Si' LIMIT 1`);

    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'No hay fondo actual establecido' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('Error al buscar fondo actual:', err);
    res.status(500).json({ mensaje: 'Error al buscar el fondo actual' });
  }
});

// 3. OBTENER todos los fondos
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query(`SELECT * FROM fondos ORDER BY id DESC`);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener los fondos:', err);
    res.status(500).json({ mensaje: 'Error al obtener los fondos' });
  }
});

// 4. OBTENER fondo por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query(`SELECT * FROM fondos WHERE id = ?`, [id]);

    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Fondo no encontrado' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('Error al buscar el fondo:', err);
    res.status(500).json({ mensaje: 'Error al buscar el fondo' });
  }
});

// 5. ACTUALIZAR fondo
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, tISocio, tIExterno, vPCompleto, esActual } = req.body;

  try {
    if (esActual === 'Si') {
      await db.query(`UPDATE fondos SET esActual = 'No' WHERE esActual = 'Si'`);
    }

    await db.query(
      `UPDATE fondos SET nombre = ?, tISocio = ?, tIExterno = ?, vPCompleto = ?, esActual = ? WHERE id = ?`,
      [nombre, tISocio, tIExterno, vPCompleto, esActual, id]
    );

    res.json({ mensaje: 'Fondo actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar fondo:', err);
    res.status(500).json({ mensaje: 'Error al actualizar el fondo' });
  }
});

// 6. ELIMINAR fondo
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(`DELETE FROM fondos WHERE id = ?`, [id]);
    res.json({ mensaje: 'Fondo eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar fondo:', err);
    res.status(500).json({ mensaje: 'Error al eliminar el fondo' });
  }
});

export default router;

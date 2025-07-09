import express from 'express';
const router = express.Router();
import db from '../db.js';

// 1. CREAR fondo
router.post('/', (req, res) => {
  const { nombre, tISocio, tIExterno, vPCompleto, esActual } = req.body;

  // Si el nuevo fondo será el actual, primero desmarcamos todos los anteriores
  const insertarFondo = () => {
    const sql = `INSERT INTO fondos (nombre, tISocio, tIExterno, vPCompleto, esActual) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [nombre, tISocio, tIExterno, vPCompleto, esActual], (err, result) => {
      if (err) {
        console.error('Error al guardar fondo:', err);
        return res.status(500).json({ mensaje: 'Error al guardar el fondo' });
      }
      res.status(201).json({ mensaje: 'Fondo creado con éxito', id: result.insertId });
    });
  };

  if (esActual === 'Si') {
    const desmarcarSQL = `UPDATE fondos SET esActual = 'No' WHERE esActual = 'Si'`;
    db.query(desmarcarSQL, (err) => {
      if (err) {
        console.error('Error al desmarcar fondos:', err);
        return res.status(500).json({ mensaje: 'Error interno al desmarcar fondos' });
      }
      insertarFondo(); // luego de desmarcar, creamos el nuevo fondo
    });
  } else {
    insertarFondo(); // si no es actual, solo lo creamos directamente
  }
});

// 2. OBTENER fondo actual (DEBE ir antes de /:id)
router.get('/actual', (req, res) => {
  const sql = 'SELECT * FROM fondos WHERE esActual = "Si" LIMIT 1';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al buscar fondo actual:', err);
      return res.status(500).json({ mensaje: 'Error al buscar el fondo actual' });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'No hay fondo actual establecido' });
    }

    res.json(results[0]); // Devuelve el fondo actual
  });
});

// 3. OBTENER todos los fondos
router.get('/', (req, res) => {
  db.query('SELECT * FROM fondos ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error('Error al obtener los fondos:', err);
      return res.status(500).json({ mensaje: 'Error al obtener los fondos' });
    }
    res.json(results);
  });
});

// 4. OBTENER fondo por ID
router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM fondos WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al buscar el fondo:', err);
      return res.status(500).json({ mensaje: 'Error al buscar el fondo' });
    }
    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Fondo no encontrado' });
    }
    res.json(results[0]);
  });
});

// 5. ACTUALIZAR fondo
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, tISocio, tIExterno, vPCompleto, esActual } = req.body;

  const desmarcarSQL = `UPDATE fondos SET esActual = 'No' WHERE esActual = 'Si'`;
  const actualizarSQL = `UPDATE fondos SET nombre = ?, tISocio = ?, tIExterno = ?, vPCompleto = ?, esActual = ? WHERE id = ?`;

  // Si se marca como actual, desmarcar todos los demás primero
  if (esActual === 'Si') {
    db.query(desmarcarSQL, (err) => {
      if (err) {
        console.error('Error al desmarcar fondos:', err);
        return res.status(500).json({ mensaje: 'Error interno al desmarcar fondos' });
      }

      db.query(actualizarSQL, [nombre, tISocio, tIExterno, vPCompleto, esActual, id], (err) => {
        if (err) {
          console.error('Error al actualizar fondo:', err);
          return res.status(500).json({ mensaje: 'Error al actualizar el fondo' });
        }

        res.json({ mensaje: 'Fondo actualizado correctamente' });
      });
    });
  } else {
    // Si no se marca como actual, simplemente actualiza
    db.query(actualizarSQL, [nombre, tISocio, tIExterno, vPCompleto, esActual, id], (err) => {
      if (err) {
        console.error('Error al actualizar fondo:', err);
        return res.status(500).json({ mensaje: 'Error al actualizar el fondo' });
      }

      res.json({ mensaje: 'Fondo actualizado correctamente' });
    });
  }
});

// 6. ELIMINAR fondo
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM fondos WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar fondo:', err);
      return res.status(500).json({ mensaje: 'Error al eliminar el fondo' });
    }
    res.json({ mensaje: 'Fondo eliminado correctamente' });
  });
});

// Después (ESM)
export default router;


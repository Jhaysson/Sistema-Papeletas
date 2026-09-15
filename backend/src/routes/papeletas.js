import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      nombre_apellidos,
      numero_tarjeta,
      oficina,
      motivo_comision,
      motivo_personales,
      motivo_otros,
      motivo_otros_descripcion,
      fecha_salida,
      hora_salida,
      hora_retorno,
      fecha_retorno,
      detalle_acciones,
      firma_trabajador,
      firma_funcionario,
      firma_jefe,
      establecimientos
    } = req.body;

    const [result] = await conn.query(
      `INSERT INTO papeletas
       (nombre_apellidos, numero_tarjeta, oficina, motivo_comision, motivo_personales,
        motivo_otros, motivo_otros_descripcion, fecha_salida, hora_salida, hora_retorno,
        fecha_retorno, detalle_acciones, firma_trabajador, firma_funcionario, firma_jefe)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_apellidos,
        numero_tarjeta,
        oficina,
        motivo_comision || 0,
        motivo_personales || 0,
        motivo_otros || 0,
        motivo_otros_descripcion || null,
        fecha_salida,
        hora_salida,
        hora_retorno || null,
        fecha_retorno || null,
        detalle_acciones || null,
        firma_trabajador || null,
        firma_funcionario || null,
        firma_jefe || null
      ]
    );

    const papeletaId = result.insertId;

    if (establecimientos && establecimientos.length > 0) {
      for (let i = 0; i < establecimientos.length; i++) {
        const est = establecimientos[i];
        await conn.query(
          `INSERT INTO establecimientos
           (papeleta_id, numero, institucion, lugar, hora_llegada, hora_retorno)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [papeletaId, i + 1, est.institucion, est.lugar, est.hora_llegada || null, est.hora_retorno || null]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ message: 'Papeleta registrada correctamente', id: papeletaId });
  } catch (error) {
    await conn.rollback();
    console.error('Error al registrar papeleta:', error);
    res.status(500).json({ error: 'Error al guardar la papeleta' });
  } finally {
    conn.release();
  }
});

router.get('/', async (req, res) => {
  try {
    const { fecha } = req.query;
    let query = 'SELECT * FROM papeletas';
    let params = [];
    if (fecha) {
      query += ' WHERE fecha_salida = ?';
      params.push(fecha);
    }
    query += ' ORDER BY fecha_salida DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener papeletas:', error);
    res.status(500).json({ error: 'Error al obtener papeletas' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [papeleta] = await pool.query('SELECT * FROM papeletas WHERE id = ?', [req.params.id]);
    if (papeleta.length === 0) {
      return res.status(404).json({ error: 'Papeleta no encontrada' });
    }
    const [establecimientos] = await pool.query(
      'SELECT * FROM establecimientos WHERE papeleta_id = ? ORDER BY numero',
      [req.params.id]
    );
    res.json({ ...papeleta[0], establecimientos });
  } catch (error) {
    console.error('Error al obtener papeleta:', error);
    res.status(500).json({ error: 'Error al obtener papeleta' });
  }
});

export default router;
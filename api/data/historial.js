const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  const { usuario_id } = req.query;
  if (!usuario_id) return res.status(400).json({ error: 'usuario_id requerido' });

  try {
    const history = await sql`
      SELECT DATE(fecha_hora) as fecha, TO_CHAR(fecha_hora, 'HH24:MI:SS') as hora, 
             indice_uv_actual, dosis_acumulada, estado_alerta
      FROM registros_exposicion 
      WHERE usuario_id = ${usuario_id}
      ORDER BY fecha_hora DESC LIMIT 50;
    `;
    return res.status(200).json(history.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  const { usuario_id } = req.query;
  if (!usuario_id) return res.status(400).json({ error: 'usuario_id requerido' });

  try {
    const actual = await sql`
      SELECT indice_uv_actual, dosis_acumulada, estado_alerta 
      FROM registros_exposicion 
      WHERE usuario_id = ${usuario_id} 
      ORDER BY fecha_hora DESC LIMIT 1;
    `;

    const stats = await sql`
      SELECT 
        AVG(indice_uv_actual) as promedio, 
        MAX(indice_uv_actual) as maximo, 
        MIN(indice_uv_actual) as minimo
      FROM registros_exposicion 
      WHERE usuario_id = ${usuario_id} AND DATE(fecha_hora) = CURRENT_DATE;
    `;

    // Últimos 15 datos para tu gráfica Chart.js
    const chart = await sql`
      SELECT TO_CHAR(fecha_hora, 'HH24:MI') as hora, indice_uv_actual 
      FROM registros_exposicion 
      WHERE usuario_id = ${usuario_id} 
      ORDER BY fecha_hora DESC LIMIT 15;
    `;

    return res.status(200).json({
      actual: actual.rows[0] || { indice_uv_actual: 0, dosis_acumulada: 0, estado_alerta: 'Seguro' },
      stats: stats.rows[0] || { promedio: 0, maximo: 0, minimo: 0 },
      chart: chart.rows.reverse() // Revertir para que los más antiguos queden a la izquierda de la gráfica
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { usuario_id, rango } = req.query; // rango puede ser 'semanal' o 'mensual'

  try {
    let intervalo = sql`1 week`;
    if (rango === 'mensual') intervalo = sql`1 month`;

    // Consulta enfocada puramente en telemetría de radiación ultravioleta y tiempos de exposición segura
    const reporteDatos = await sql`
      SELECT 
        DATE(fecha_hora) as fecha,
        ROUND(AVG(indice_uv_actual)::numeric, 2) as uv_promedio,
        MAX(indice_uv_actual) as uv_maximo,
        MAX(dosis_acumulada) as dosis_maxima_alcanzada,
        COUNT(CASE WHEN estado_alerta = 'Riesgo' THEN 1 END) as minutos_en_riesgo
      FROM registros_exposicion
      WHERE usuario_id = ${usuario_id} AND fecha_hora >= NOW() - ${intervalo}
      GROUP BY DATE(fecha_hora)
      ORDER BY fecha DESC;
    `;

    /* NOTA TÉCNICA DE CUMPLIMIENTO:
       Este conjunto de datos se genera de forma directa omitiendo conclusiones cualitativas,
       análisis auditivos o telemetría del estado del zumbador físico (Buzzer).
    */
    return res.status(200).json({
      tipo_reporte: rango,
      generado_en: new Date().toISOString(),
      metricas_uv: reporteDatos.rows
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al compilar el reporte técnico: ' + error.message });
  }
};
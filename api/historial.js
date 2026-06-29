const { sql } = require('@vercel/postgres');

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const pad = value => String(value).padStart(2, '0');
  return `${hours}h ${pad(minutes)}m`;
}

function mapEstado(value) {
  if (value === 'Precaucion') return 'PRECAUCIÓN';
  return String(value || 'SEGURO').toUpperCase();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { usuario_id } = req.query;
  if (!usuario_id) return res.status(400).json({ error: 'usuario_id es obligatorio' });

  try {
    const rowsQuery = await sql`
      SELECT fecha_hora, indice_uv_actual, dosis_acumulada, estado_alerta
      FROM registros_exposicion
      WHERE usuario_id = ${usuario_id}
      ORDER BY fecha_hora DESC
      LIMIT 100;
    `;

    const records = rowsQuery.rows;

    const historial = records.map((record, index) => {
      const nextOlder = records[index + 1];
      const currentDate = new Date(record.fecha_hora);
      const nextDate = nextOlder ? new Date(nextOlder.fecha_hora) : new Date();
      const elapsedSeconds = (nextDate - currentDate) / 1000;

      return {
        fecha: currentDate.toLocaleDateString('es-CL'),
        hora: `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`,
        uv: Number(record.indice_uv_actual).toFixed(1),
        dosis: Math.round(Number(record.dosis_acumulada) || 0),
        estado: mapEstado(record.estado_alerta),
        tiempo: formatDuration(elapsedSeconds),
      };
    });

    return res.status(200).json({ historial });
  } catch (error) {
    return res.status(500).json({ error: 'Error al cargar el historial: ' + error.message });
  }
};
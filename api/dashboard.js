const { sql } = require('@vercel/postgres');

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const pad = value => String(value).padStart(2, '0');
  return `${hours}h ${pad(minutes)}m`;
}

function formatTime(value) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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
    const perfilQuery = await sql`
      SELECT u.id, u.nombre, u.apellido, u.correo, u.rol, u.cargo, e.nombre_empresa
      FROM usuarios u
      LEFT JOIN empresas e ON e.id = u.empresa_id
      WHERE u.id = ${usuario_id}
      LIMIT 1;
    `;

    if (perfilQuery.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const registrosQuery = await sql`
      SELECT fecha_hora, indice_uv_actual, dosis_acumulada, estado_alerta
      FROM registros_exposicion
      WHERE usuario_id = ${usuario_id}
      ORDER BY fecha_hora DESC
      LIMIT 50;
    `;

    const registros = registrosQuery.rows;
    const latest = registros[0] || null;
    const source = registros.length ? registros.slice().reverse() : [];
    const statsSource = source.filter(Boolean);

    const uvValues = statsSource.map(r => Number(r.indice_uv_actual) || 0);
    const latestDosis = latest ? Number(latest.dosis_acumulada) || 0 : 0;
    const currentUv = latest ? Number(latest.indice_uv_actual) || 0 : 0;

    let exposureSeconds = 0;
    if (statsSource.length > 1) {
      const first = new Date(statsSource[0].fecha_hora);
      const last = new Date(statsSource[statsSource.length - 1].fecha_hora);
      exposureSeconds = (last - first) / 1000;
    }

    const chartData = registros.slice(0, 8).reverse().map(r => ({
      t: formatTime(r.fecha_hora),
      v: Number(r.indice_uv_actual) || 0,
    }));

    const alerts = registros
      .filter(r => mapEstado(r.estado_alerta) !== 'SEGURO')
      .slice(0, 5)
      .map(r => ({
        time: formatTime(r.fecha_hora),
        message: `Dosis ${mapEstado(r.estado_alerta).toLowerCase()} (${Math.round(Number(r.dosis_acumulada) || 0)} J/m²)`,
        state: mapEstado(r.estado_alerta),
      }));

    const resumen = registros.slice(0, 4).map(r => ({
      time: formatTime(r.fecha_hora),
      state: mapEstado(r.estado_alerta),
      label: `${Number(r.indice_uv_actual).toFixed(1)} UV · ${Math.round(Number(r.dosis_acumulada) || 0)} J/m²`,
    }));

    return res.status(200).json({
      user: {
        id: perfilQuery.rows[0].id,
        nombre: perfilQuery.rows[0].nombre,
        apellido: perfilQuery.rows[0].apellido,
        correo: perfilQuery.rows[0].correo,
        empresa: perfilQuery.rows[0].nombre_empresa || '—',
        cargo: perfilQuery.rows[0].cargo || '—',
        rol: perfilQuery.rows[0].rol,
      },
      latest: latest ? {
        uv: currentUv,
        dosis: latestDosis,
        estado: mapEstado(latest.estado_alerta),
        fecha_hora: latest.fecha_hora,
      } : null,
      stats: {
        promedio: uvValues.length ? (uvValues.reduce((sum, value) => sum + value, 0) / uvValues.length).toFixed(1) : '—',
        maximo: uvValues.length ? Math.max(...uvValues).toFixed(1) : '—',
        minimo: uvValues.length ? Math.min(...uvValues).toFixed(1) : '—',
        tiempo: formatDuration(exposureSeconds),
        seconds: exposureSeconds,
      },
      chartData,
      alerts,
      resumen,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al cargar el dashboard: ' + error.message });
  }
};
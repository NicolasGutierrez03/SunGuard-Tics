const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { device_mac, uv_actual, dosis_acumulada, bloqueador_activo } = req.body;

  if (!device_mac || uv_actual === undefined || dosis_acumulada === undefined) {
    return res.status(400).json({ error: 'Parámetros IoT insuficientes' });
  }

  try {
    // 1. Intentar buscar el dispositivo
    let dispositivoQuery = await sql`
      SELECT id, usuario_id FROM dispositivos WHERE device_mac = ${device_mac};
    `;

    let dispositivoId;
    let usuarioId;

    // 2. Registro automático si no existe
    if (dispositivoQuery.rowCount === 0) {
      console.log(`Registrando nuevo dispositivo: ${device_mac}`);
      const nuevoDispositivo = await sql`
        INSERT INTO dispositivos (device_mac, estado_conexion, ultima_sincronizacion)
        VALUES (${device_mac}, 'Online', CURRENT_TIMESTAMP)
        RETURNING id, usuario_id;
      `;
      dispositivoId = nuevoDispositivo.rows[0].id;
      usuarioId = nuevoDispositivo.rows[0].usuario_id; // Será null inicialmente
    } else {
      dispositivoId = dispositivoQuery.rows[0].id;
      usuarioId = dispositivoQuery.rows[0].usuario_id;
    }

    // 3. Determinar el nivel de alerta
    let alerta = 'Seguro';
    if (dosis_acumulada >= 100.0) {
      alerta = 'Riesgo';
    } else if (dosis_acumulada >= 50.0) { // <-- CAMBIADO AQUÍ (Quita el _uv)
      alerta = 'Precaucion';
    }

    // 4. Actualizar estado del dispositivo
    await sql`
      UPDATE dispositivos 
      SET estado_conexion = 'Online', ultima_sincronizacion = CURRENT_TIMESTAMP 
      WHERE id = ${dispositivoId};
    `;

    // 5. Persistir registro de telemetría
    // Si usuarioId es null, el insert funcionará siempre que la tabla lo permita
    await sql`
      INSERT INTO registros_exposicion (dispositivo_id, usuario_id, indice_uv_actual, dosis_acumulada, bloqueador_activo, estado_alerta)
      VALUES (${dispositivoId}, ${usuarioId}, ${uv_actual}, ${dosis_acumulada}, ${bloqueador_activo}, ${alerta});
    `;

    return res.status(200).json({ 
      status: 'Sincronizado', 
      estado_alerta: alerta,
      instruccion_servidor: alerta === 'Riesgo' ? 'TRIGGER_ALARM' : 'KEEP_MONITORING'
    });
    
  } catch (error) {
    return res.status(500).json({ error: 'Error de ingesta de datos IoT: ' + error.message });
  }
};
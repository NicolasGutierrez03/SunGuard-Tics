import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { device_mac, uv_actual, dosis_acumulada, bloqueador_activo } = req.body;

  if (!device_mac || uv_actual === undefined || dosis_acumulada === undefined) {
    return res.status(400).json({ error: 'Parámetros IoT insuficientes' });
  }

  try {
    // Buscar el dispositivo registrado y el usuario que lo tiene vinculado
    const dispositivoQuery = await sql`
      SELECT id, usuario_id FROM dispositivos WHERE device_mac = ${device_mac};
    `;

    if (dispositivoQuery.rowCount === 0) {
      return res.status(404).json({ error: 'Dispositivo hardware no registrado en la plataforma' });
    }

    const { id: dispositivoId, usuario_id: usuarioId } = dispositivoQuery.rows[0];

    // Sincronización estricta de umbrales con el firmware físico del ESP32
    let alerta = 'Seguro';
    if (dosis_acumulada >= 100.0) {
      alerta = 'Riesgo';
    } else if (dosis_acumulada >= 50.0) {
      alerta = 'Precaucion';
    }

    // Actualizar estado dinámico del dispositivo (Ping de red)
    await sql`
      UPDATE dispositivos 
      SET estado_conexion = 'Online', ultima_sincronizacion = CURRENT_TIMESTAMP 
      WHERE id = ${dispositivoId};
    `;

    // Persistir el registro histórico de telemetría UV
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
}
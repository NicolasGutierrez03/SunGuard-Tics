const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { device_mac, usuario_id } = req.body;

  if (!device_mac || !usuario_id) return res.status(400).json({ error: 'Faltan parámetros' });

  try {
    // 1. Vincular el dispositivo al usuario (o crearlo si el ESP32 aún no envía nada)
    await sql`
      INSERT INTO dispositivos (device_mac, usuario_id, estado_conexion)
      VALUES (${device_mac}, ${usuario_id}, 'Offline')
      ON CONFLICT (device_mac) 
      DO UPDATE SET usuario_id = EXCLUDED.usuario_id;
    `;

    // 2. Asociar registros pasados del ESP32 a este usuario
    await sql`
      UPDATE registros_exposicion 
      SET usuario_id = ${usuario_id}
      WHERE dispositivo_id = (SELECT id FROM dispositivos WHERE device_mac = ${device_mac});
    `;

    return res.status(200).json({ success: true, message: 'Dispositivo vinculado con éxito' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al vincular: ' + error.message });
  }
};
const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function rolToTipo(rol) {
  if (rol === 'Supervisor') return 'supervisor';
  if (rol === 'Administrador') return 'admin';
  return 'trabajador';
}

function buildAvatar(tipo) {
  if (tipo === 'supervisor') return '👔';
  if (tipo === 'admin') return '🔑';
  return '👷';
}

module.exports = async function handler(req, res) {
  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  try {
    // 1. Buscar al usuario en la base de datos por su correo
    const { rows } = await sql`
      SELECT u.id, u.correo, u.password_hash, u.rol, u.nombre, u.apellido, u.empresa_id, u.cargo, e.nombre_empresa 
      FROM usuarios u
      LEFT JOIN empresas e ON e.id = u.empresa_id
      WHERE u.correo = ${correo};
    `;

    // Si no existe el correo, retornamos error genérico por seguridad
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = rows[0];

    // 2. Comparar la contraseña enviada con el hash de la base de datos
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.password_hash);

    if (!contrasenaValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Generar el Token JWT
    // Nota: Debes configurar JWT_SECRET en la pestaña "Environment Variables" de Vercel
    const secreto = process.env.JWT_SECRET || 'secreto_desarrollo_sunguard_2026';
    const token = jwt.sign(
      { 
        userId: usuario.id, 
        rol: usuario.rol, 
        empresaId: usuario.empresa_id 
      },
      secreto,
      { expiresIn: '12h' } // Expira después de una jornada laboral extendida
    );

    // 4. Retornar el token y los datos del perfil al frontend
    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token: token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        email: usuario.correo,
        rol: usuario.rol,
        tipo: rolToTipo(usuario.rol),
        cargo: usuario.cargo || 'No especificado',
        empresa: usuario.nombre_empresa || '—',
        avatar: buildAvatar(rolToTipo(usuario.rol))
      }
    });

  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
};
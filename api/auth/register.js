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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { nombre, apellido, rut, correo, contrasena, tipoUsuario, empresa, cargo, telefono } = req.body;

  if (!nombre || !apellido || !rut || !correo || !contrasena) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const tipoNormalizado = String(tipoUsuario || '').toLowerCase();
  if (!['trabajador', 'supervisor', 'admin'].includes(tipoNormalizado)) {
    return res.status(400).json({ error: 'Tipo de usuario inválido' });
  }

  try {
    const passwordHash = await bcrypt.hash(contrasena, 10);

    const rolAsignado = tipoNormalizado === 'supervisor'
      ? 'Supervisor'
      : tipoNormalizado === 'admin'
        ? 'Administrador'
        : 'Trabajador';

    let empresaId = null;

    if (empresa && empresa.trim() !== '') {
      const checkEmpresa = await sql`SELECT id FROM empresas WHERE rut_empresa = ${rut};`;
      
      if (checkEmpresa.rowCount > 0) {
        empresaId = checkEmpresa.rows[0].id;
      } else {
        const nuevaEmpresa = await sql`
          INSERT INTO empresas (nombre_empresa, rut_empresa, telefono) 
          VALUES (${empresa}, ${rut}, ${telefono || null}) RETURNING id;
        `;
        empresaId = nuevaEmpresa.rows[0].id;
      }
    }

    // Insertar el usuario con los campos formateados limpiamente
    // Si cargo es una cadena vacía, le pasamos null para que la BD lo procese bien
    const cargoFinal = cargo && cargo.trim() !== '' ? cargo : null;

    await sql`
      INSERT INTO usuarios (rut, nombre, apellido, correo, password_hash, rol, empresa_id, cargo)
      VALUES (${rut}, ${nombre}, ${apellido}, ${correo}, ${passwordHash}, ${rolAsignado}, ${empresaId}, ${cargoFinal});
    `;

    const usuarioQuery = await sql`
      SELECT u.id, u.nombre, u.apellido, u.correo, u.rol, u.cargo, e.nombre_empresa
      FROM usuarios u
      LEFT JOIN empresas e ON e.id = u.empresa_id
      WHERE u.correo = ${correo}
      LIMIT 1;
    `;

    const usuario = usuarioQuery.rows[0];
    const secreto = process.env.JWT_SECRET || 'secreto_desarrollo_sunguard_2026';
    const token = jwt.sign(
      { userId: usuario.id, rol: usuario.rol, empresaId },
      secreto,
      { expiresIn: '12h' }
    );

    return res.status(201).json({
      message: 'Usuario registrado con éxito',
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        email: usuario.correo,
        rol: usuario.rol,
        tipo: rolToTipo(usuario.rol),
        empresa: usuario.nombre_empresa || empresa || '—',
        cargo: usuario.cargo || '—',
        avatar: buildAvatar(rolToTipo(usuario.rol))
      }
    });

  } catch (error) {
    console.error('Error detectado en Neon:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un usuario o empresa con esos datos' });
    }
    return res.status(500).json({ 
      error: 'Error en la base de datos', 
      details: error.message 
    });
  }
};
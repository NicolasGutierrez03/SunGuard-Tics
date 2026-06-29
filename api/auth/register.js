const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { nombre, apellido, rut, correo, contrasena, tipoUsuario, empresa, cargo, telefono } = req.body;

  if (!nombre || !apellido || !rut || !correo || !contrasena) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const passwordHash = await bcrypt.hash(contrasena, 10);
    
    // CORRECCIÓN ENUM: Forzamos a que empiece con Mayúscula exactamente igual que en tu schema.sql
    let rolAsignado = 'Trabajador'; 
    if (tipoUsuario === 'supervisor') rolAsignado = 'Supervisor';
    if (tipoUsuario === 'admin') rolAsignado = 'Administrador';

    let empresaId = null;

    // Si viene una empresa asignada (Uso Empresa)
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

    return res.status(201).json({ message: 'Usuario registrado con éxito' });

  } catch (error) {
    console.error('Error detectado en Neon:', error);
    // Ahora enviamos el mensaje del error real para que lo veas en la consola del navegador
    return res.status(500).json({ 
      error: 'Error en la base de datos', 
      details: error.message 
    });
  }
};
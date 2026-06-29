import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { nombre, apellido, rut, correo, contrasena, tipoUsuario, empresa, cargo, telefono } = req.body;

  if (!nombre || !apellido || !rut || !correo || !contrasena) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const passwordHash = await bcrypt.hash(contrasena, 10);
    let empresaId = null;
    let rolAsignado = 'Trabajador';

    // Lógica condicional si se registra una entidad Empresa
    if (tipoUsuario === 'Empresa' && empresa) {
      rolAsignado = 'Supervisor';
      const checkEmpresa = await sql`SELECT id FROM empresas WHERE rut_empresa = ${rut};`;
      
      if (checkEmpresa.rowCount > 0) {
        empresaId = checkEmpresa.rows[0].id;
      } else {
        const nuevaEmpresa = await sql`
          INSERT INTO empresas (nombre_empresa, rut_empresa, telefono) 
          VALUES (${empresa}, ${rut}, ${telefono}) RETURNING id;
        `;
        empresaId = nuevaEmpresa.rows[0].id;
      }
    }

    await sql`
      INSERT INTO usuarios (rut, nombre, apellido, correo, password_hash, rol, empresa_id, cargo)
      VALUES (${rut}, ${nombre}, ${apellido}, ${correo}, passwordHash, ${rolAsignado}, ${empresaId}, ${cargo});
    `;

    return res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno de servidor o usuario ya existente: ' + error.message });
  }
}
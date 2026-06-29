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
    let rolAsignado = 'Trabajador'; // Por defecto para 'trabajador'

    // Ajustamos la lógica para que coincida con los valores reales de tu index.html ('supervisor', 'admin')
    if (tipoUsuario === 'supervisor' || tipoUsuario === 'admin') {
      rolAsignado = tipoUsuario === 'supervisor' ? 'Supervisor' : 'Administrador';
      
      // Si el usuario seleccionó "Empresa" en el radio button de uso y escribió un nombre
      if (empresa) {
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
    }

    // CORRECCIÓN CRÍTICA: Se añadió ${passwordHash} parametrizado correctamente
    await sql`
      INSERT INTO usuarios (rut, nombre, apellido, correo, password_hash, rol, empresa_id, cargo)
      VALUES (${rut}, ${nombre}, ${apellido}, ${correo}, ${passwordHash}, ${rolAsignado}, ${empresaId}, ${cargo});
    `;

    return res.status(201).json({ message: 'Usuario registrado con éxito' });

  } catch (error) {
    console.error('Error interno en el registro:', error);
    // Si la base de datos tira un error (ej: correo duplicado), le avisamos al frontend en vez de simular éxito
    return res.status(500).json({ error: 'Error interno del servidor al guardar en la base de datos' });
  }
}
-- Creación de Tipos ENUM para consistencia de datos
CREATE TYPE usr_rol AS ENUM ('Invitado', 'Trabajador', 'Supervisor', 'Administrador');
CREATE TYPE alert_lvl AS ENUM ('Seguro', 'Precaucion', 'Riesgo');

-- Tabla de Empresas
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_empresa VARCHAR(255) NOT NULL,
    rut_empresa VARCHAR(50) UNIQUE NOT NULL,
    telefono VARCHAR(50),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol usr_rol NOT NULL DEFAULT 'Invitado',
    empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
    cargo VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Dispositivos (Hardware ESP32)
CREATE TABLE dispositivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_mac VARCHAR(50) UNIQUE NOT NULL,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    estado_conexion VARCHAR(50) DEFAULT 'Offline',
    nivel_bateria INT DEFAULT 100,
    ultima_sincronizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Registros de Telemetría UV
CREATE TABLE registros_exposicion (
    id BIGSERIAL PRIMARY KEY,
    dispositivo_id UUID REFERENCES dispositivos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    indice_uv_actual FLOAT NOT NULL,
    dosis_acumulada FLOAT NOT NULL,
    bloqueador_activo BOOLEAN DEFAULT FALSE,
    estado_alerta alert_lvl NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices de optimización de búsquedas en paneles de supervisión
CREATE INDEX idx_usuarios_rut ON usuarios(rut);
CREATE INDEX idx_usuarios_nombre ON usuarios(nombre, apellido);
CREATE INDEX idx_telemetria_fecha ON registros_exposicion(fecha_hora);
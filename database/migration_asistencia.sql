-- ============================================================
-- MIGRACIÓN: MÓDULO DE CONTROL DE ASISTENCIA Y REPORTES
-- Sistema SIGA - Papeletas
-- Ejecutar una sola vez sobre el esquema sistema_papeletas:
--   docker exec -i papeletas_db mysql -u root -proot_password < database/migration_asistencia.sql
-- ============================================================

USE sistema_papeletas;

-- ------------------------------------------------------------
-- 1. SEDES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sedes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  direccion VARCHAR(255) DEFAULT NULL,
  estado TINYINT(1) DEFAULT 1
);

-- ------------------------------------------------------------
-- 2. AREAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  codigo VARCHAR(50) DEFAULT NULL,
  estado TINYINT(1) DEFAULT 1
);

-- ------------------------------------------------------------
-- 3. EMPLEADOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS empleados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  documento_identidad VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  regimen_laboral VARCHAR(50) DEFAULT 'NOMBRADO',
  area_id INT DEFAULT NULL,
  sede_id INT DEFAULT NULL,
  estado ENUM('ACTIVO', 'INACTIVO', 'VACACIONES') DEFAULT 'ACTIVO',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_empleados_area FOREIGN KEY (area_id) REFERENCES areas(id),
  CONSTRAINT fk_empleados_sede FOREIGN KEY (sede_id) REFERENCES sedes(id)
);

-- ------------------------------------------------------------
-- 4. HORARIOS (con días laborales por horario)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  hora_entrada TIME NOT NULL,
  hora_salida TIME NOT NULL,
  tolerancia_minutos INT DEFAULT 5,
  limite_tardanza_minutos INT DEFAULT 15,
  lunes TINYINT(1) DEFAULT 1,
  martes TINYINT(1) DEFAULT 1,
  miercoles TINYINT(1) DEFAULT 1,
  jueves TINYINT(1) DEFAULT 1,
  viernes TINYINT(1) DEFAULT 1,
  sabado TINYINT(1) DEFAULT 0,
  domingo TINYINT(1) DEFAULT 0,
  estado TINYINT(1) DEFAULT 1
);

-- ------------------------------------------------------------
-- 5. ASIGNACION DE HORARIOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignacion_horarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  horario_id INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE DEFAULT NULL,
  CONSTRAINT fk_asignacion_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
  CONSTRAINT fk_asignacion_horario FOREIGN KEY (horario_id) REFERENCES horarios(id)
);

-- ------------------------------------------------------------
-- 6. ORIGENES BIOMETRICOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS origenes_biometricos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  ubicacion VARCHAR(150) DEFAULT NULL,
  estado TINYINT(1) DEFAULT 1
);

-- ------------------------------------------------------------
-- 7. MARCAcIONES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marcaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  timestamp DATETIME NOT NULL,
  tipo ENUM('ENTRADA', 'SALIDA', 'REFRIGERIO_SALIDA', 'REFRIGERIO_ENTRADA') NOT NULL,
  origen_biometrico_id INT DEFAULT NULL,
  CONSTRAINT fk_marcaciones_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
  CONSTRAINT fk_marcaciones_origen FOREIGN KEY (origen_biometrico_id) REFERENCES origenes_biometricos(id)
);

-- ------------------------------------------------------------
-- 8. PAPELETAS DE SALIDA (nueva, paralela a papeletas existente)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS papeletas_salida (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora_salida TIME NOT NULL,
  hora_retorno TIME DEFAULT NULL,
  tipo ENUM('PARTICULAR', 'COMISION', 'SALUD') NOT NULL DEFAULT 'PARTICULAR',
  motivo_texto VARCHAR(255) DEFAULT NULL,
  estado ENUM('APROBADO', 'PENDIENTE', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_papeletas_salida_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 9. TIPO DE JUSTIFICACION
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipo_justificacion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL
);

-- ------------------------------------------------------------
-- 10. JUSTIFICACIONES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS justificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  tipo_justificacion_id INT DEFAULT NULL,
  descripcion TEXT,
  adjunto_url VARCHAR(255) DEFAULT NULL,
  estado ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_justificaciones_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
  CONSTRAINT fk_justificaciones_tipo FOREIGN KEY (tipo_justificacion_id) REFERENCES tipo_justificacion(id)
);

-- ------------------------------------------------------------
-- 11. VACACIONES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vacaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  periodo_anio INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_efectivos INT NOT NULL,
  estado ENUM('PROGRAMADO', 'GOZADO', 'PENDIENTE') NOT NULL DEFAULT 'PENDIENTE',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vacaciones_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 12. FERIADOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feriados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  descripcion VARCHAR(150) NOT NULL,
  es_recurrente TINYINT(1) DEFAULT 0
);

-- ============================================================
-- ÍNDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX idx_empleados_area ON empleados(area_id);
CREATE INDEX idx_empleados_sede ON empleados(sede_id);
CREATE INDEX idx_marcaciones_emp_ts ON marcaciones(empleado_id, timestamp);
CREATE INDEX idx_marcaciones_tipo ON marcaciones(tipo);
CREATE INDEX idx_marcaciones_ts ON marcaciones(timestamp);
CREATE INDEX idx_asignacion_emp_fechas ON asignacion_horarios(empleado_id, fecha_inicio, fecha_fin);
CREATE INDEX idx_vacaciones_emp_periodo ON vacaciones(empleado_id, periodo_anio);
CREATE INDEX idx_justificaciones_emp_fechas ON justificaciones(empleado_id, fecha_inicio, fecha_fin);
CREATE INDEX idx_papeletas_salida_emp_fecha ON papeletas_salida(empleado_id, fecha);
CREATE INDEX idx_feriados_fecha ON feriados(fecha);

-- ============================================================
-- DATOS SEMILLA
-- ============================================================
INSERT IGNORE INTO sedes (id, nombre, direccion) VALUES
  (1, 'Sede Central', 'Av. Principal 1234'),
  (2, 'Sede Norte', 'Jr. Los Olivos 567');

INSERT IGNORE INTO areas (id, nombre, codigo) VALUES
  (1, 'Administración', 'ADM'),
  (2, 'Recursos Humanos', 'RRHH'),
  (3, 'Operaciones', 'OPE');

INSERT IGNORE INTO tipo_justificacion (id, nombre, descripcion) VALUES
  (1, 'Enfermedad', 'Incapacidad por enfermedad o salud'),
  (2, 'Permiso personal', 'Asuntos personales debidamente sustentados'),
  (3, 'Comisión de servicio', 'Gestiones oficiales fuera de la sede');

INSERT IGNORE INTO origenes_biometricos (id, nombre, descripcion, ubicacion) VALUES
  (1, 'Biometrico Principal', 'Equipo de marcas de ingreso/salida', 'Sede Central - Hall'),
  (2, 'Control de Acceso 1', 'Equipo alterno de control de acceso', 'Sede Central - Puerta 1');

-- Horarios de ejemplo (Lun-Vie)
INSERT IGNORE INTO horarios (id, nombre, hora_entrada, hora_salida, tolerancia_minutos, limite_tardanza_minutos, lunes, martes, miercoles, jueves, viernes, sabado, domingo) VALUES
  (1, 'Jornada Administrativa Sede Central', '08:00:00', '17:00:00', 5, 15, 1, 1, 1, 1, 1, 0, 0),
  (2, 'Jornada Administrativa Sede Norte', '08:30:00', '17:30:00', 5, 15, 1, 1, 1, 1, 1, 0, 0);

-- Feriados nacionales (Perú) para el año en curso y siguientes
INSERT IGNORE INTO feriados (id, fecha, descripcion, es_recurrente) VALUES
  (1, '2026-01-01', 'Año Nuevo', 1),
  (2, '2026-04-09', 'Jueves Santo', 1),
  (3, '2026-04-10', 'Viernes Santo', 1),
  (4, '2026-05-01', 'Día del Trabajo', 1),
  (5, '2026-06-29', 'San Pedro y San Pablo', 1),
  (6, '2026-07-28', 'Fiestas Patrias', 1),
  (7, '2026-07-29', 'Fiestas Patrias', 1),
  (8, '2026-08-30', 'Santa Rosa de Lima', 1),
  (9, '2026-10-08', 'Combate de Angamos', 1),
  (10, '2026-11-01', 'Día de Todos los Santos', 1),
  (11, '2026-12-08', 'Inmaculada Concepción', 1),
  (12, '2026-12-25', 'Navidad', 1);
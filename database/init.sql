CREATE DATABASE IF NOT EXISTS sistema_papeletas;
USE sistema_papeletas;

CREATE TABLE IF NOT EXISTS papeletas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_apellidos VARCHAR(150) NOT NULL,
  numero_tarjeta INT NOT NULL,
  oficina VARCHAR(100) NOT NULL,
  motivo_comision TINYINT(1) DEFAULT 0,
  motivo_personales TINYINT(1) DEFAULT 0,
  motivo_otros TINYINT(1) DEFAULT 0,
  motivo_otros_descripcion VARCHAR(255) DEFAULT NULL,
  fecha_salida DATE NOT NULL,
  hora_salida TIME NOT NULL,
  hora_retorno TIME DEFAULT NULL,
  fecha_retorno DATE DEFAULT NULL,
  detalle_acciones TEXT,
  firma_trabajador VARCHAR(100),
  firma_funcionario VARCHAR(100),
  firma_jefe VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS establecimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  papeleta_id INT NOT NULL,
  numero INT NOT NULL,
  institucion VARCHAR(150) NOT NULL,
  lugar VARCHAR(150) NOT NULL,
  hora_llegada TIME,
  hora_retorno TIME,
  FOREIGN KEY (papeleta_id) REFERENCES papeletas(id) ON DELETE CASCADE
);

CREATE INDEX idx_papeletas_fecha ON papeletas(fecha_salida);
CREATE INDEX idx_papeletas_tarjeta ON papeletas(numero_tarjeta);
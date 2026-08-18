-- ============================================================
-- XploraSG — Turismo Digital Inteligente
-- Script de creación de base de datos
-- Basado en el modelo Entidad-Relación definido en la Fase II
-- ============================================================

CREATE DATABASE IF NOT EXISTS xplorasg
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE xplorasg;

-- ------------------------------------------------------------
-- Roles
-- ------------------------------------------------------------
CREATE TABLE roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol VARCHAR(30) NOT NULL UNIQUE  -- turista | prestador | administrador
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Usuarios
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  id_rol INT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Municipios (Sierra Gorda de Querétaro)
-- ------------------------------------------------------------
CREATE TABLE municipios (
  id_municipio INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Categorías (naturaleza, aventura, cultura, gastronomía, etc.)
-- ------------------------------------------------------------
CREATE TABLE categorias (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  icono VARCHAR(50)  -- referencia al set de iconografía de marca
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Lugares (entidad central: atractivos turísticos)
-- ------------------------------------------------------------
CREATE TABLE lugares (
  id_lugar INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  latitud DECIMAL(10, 7),
  longitud DECIMAL(10, 7),
  horarios VARCHAR(150),
  precio_rango VARCHAR(50),
  contacto VARCHAR(150),
  id_municipio INT NOT NULL,
  id_categoria INT NOT NULL,
  id_prestador INT NULL,                 -- usuario prestador que lo registró (si aplica)
  estado_verificacion ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  es_demo BOOLEAN NOT NULL DEFAULT FALSE, -- marca explícita de datos de demostración
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lugares_municipio FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio),
  CONSTRAINT fk_lugares_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
  CONSTRAINT fk_lugares_prestador FOREIGN KEY (id_prestador) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Hospedajes (extiende Lugares 1:1)
-- ------------------------------------------------------------
CREATE TABLE hospedajes (
  id_hospedaje INT AUTO_INCREMENT PRIMARY KEY,
  id_lugar INT NOT NULL UNIQUE,
  precio_noche DECIMAL(10,2),
  capacidad INT,
  CONSTRAINT fk_hospedajes_lugar FOREIGN KEY (id_lugar) REFERENCES lugares(id_lugar) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Restaurantes (extiende Lugares 1:1)
-- ------------------------------------------------------------
CREATE TABLE restaurantes (
  id_restaurante INT AUTO_INCREMENT PRIMARY KEY,
  id_lugar INT NOT NULL UNIQUE,
  tipo_cocina VARCHAR(80),
  CONSTRAINT fk_restaurantes_lugar FOREIGN KEY (id_lugar) REFERENCES lugares(id_lugar) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Eventos
-- ------------------------------------------------------------
CREATE TABLE eventos (
  id_evento INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  fecha DATETIME NOT NULL,
  id_lugar INT NOT NULL,
  descripcion TEXT,
  CONSTRAINT fk_eventos_lugar FOREIGN KEY (id_lugar) REFERENCES lugares(id_lugar)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Reservaciones
-- ------------------------------------------------------------
CREATE TABLE reservaciones (
  id_reservacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_hospedaje INT NOT NULL,
  fecha_reserva DATE NOT NULL,
  estado ENUM('pendiente','confirmada','cancelada') NOT NULL DEFAULT 'pendiente',
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservaciones_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  CONSTRAINT fk_reservaciones_hospedaje FOREIGN KEY (id_hospedaje) REFERENCES hospedajes(id_hospedaje)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Opiniones y calificaciones
-- ------------------------------------------------------------
CREATE TABLE opiniones (
  id_opinion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_lugar INT NOT NULL,
  calificacion TINYINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_opiniones_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  CONSTRAINT fk_opiniones_lugar FOREIGN KEY (id_lugar) REFERENCES lugares(id_lugar),
  CONSTRAINT uq_opinion_usuario_lugar UNIQUE (id_usuario, id_lugar) -- evita opiniones duplicadas
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Imágenes
-- ------------------------------------------------------------
CREATE TABLE imagenes (
  id_imagen INT AUTO_INCREMENT PRIMARY KEY,
  id_lugar INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  orden INT DEFAULT 0,
  CONSTRAINT fk_imagenes_lugar FOREIGN KEY (id_lugar) REFERENCES lugares(id_lugar) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Rutas y relación Ruta-Lugar (N:M con orden)
-- ------------------------------------------------------------
CREATE TABLE rutas (
  id_ruta INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT
) ENGINE=InnoDB;

CREATE TABLE ruta_lugar (
  id_ruta_lugar INT AUTO_INCREMENT PRIMARY KEY,
  id_ruta INT NOT NULL,
  id_lugar INT NOT NULL,
  orden INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_rutalugar_ruta FOREIGN KEY (id_ruta) REFERENCES rutas(id_ruta) ON DELETE CASCADE,
  CONSTRAINT fk_rutalugar_lugar FOREIGN KEY (id_lugar) REFERENCES lugares(id_lugar) ON DELETE CASCADE,
  CONSTRAINT uq_ruta_lugar UNIQUE (id_ruta, id_lugar)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Índices de apoyo a búsquedas (Sprint 1: por municipio/categoría)
-- ------------------------------------------------------------
CREATE INDEX idx_lugares_municipio ON lugares(id_municipio);
CREATE INDEX idx_lugares_categoria ON lugares(id_categoria);
CREATE INDEX idx_lugares_estado ON lugares(estado_verificacion);
CREATE INDEX idx_opiniones_lugar ON opiniones(id_lugar);

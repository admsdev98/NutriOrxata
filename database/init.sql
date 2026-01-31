-- NutriOrxata Database Schema
-- Gestión de ingredientes, platos y planificación semanal

-- Categorías de ingredientes
CREATE TYPE categoria_ingrediente AS ENUM (
    'Pasta y arroz',
    'Carnes',
    'Pescados',
    'Verduras',
    'Frutas',
    'Lácteos',
    'Huevos',
    'Legumbres',
    'Pan',
    'Cereales',
    'Aceites',
    'Salsas',
    'Bebidas',
    'Otros'
);

-- Momentos del día
CREATE TYPE momento_dia AS ENUM ('desayuno', 'almuerzo', 'comida', 'merienda', 'cena');

-- Días de la semana
CREATE TYPE dia_semana AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');

-- Roles de usuario
CREATE TYPE rol_usuario AS ENUM ('admin', 'usuario');

-- Tabla de Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'usuario',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda por email
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Tabla de Ingredientes (productos de Mercadona)
CREATE TABLE ingredientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    categoria categoria_ingrediente NOT NULL DEFAULT 'Otros',
    supermercado VARCHAR(50) DEFAULT 'Mercadona',
    calorias_por_100g DECIMAL(10,2) NOT NULL,
    proteinas_por_100g DECIMAL(10,2) NOT NULL DEFAULT 0,
    carbohidratos_por_100g DECIMAL(10,2) NOT NULL DEFAULT 0,
    grasas_por_100g DECIMAL(10,2) NOT NULL DEFAULT 0,
    fibra_por_100g DECIMAL(10,2) DEFAULT 0,
    sal_por_100g DECIMAL(10,2) DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Género
CREATE TYPE genero_familiar AS ENUM ('M', 'F');

-- Nivel de actividad física
CREATE TYPE actividad_fisica AS ENUM ('sedentario', 'ligero', 'moderado', 'activo', 'muy_activo');

-- Tabla de Familiares
CREATE TABLE familiares (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    edad INTEGER,
    peso DECIMAL(5,2), -- en kg
    altura INTEGER, -- en cm
    genero genero_familiar,
    actividad_fisica actividad_fisica DEFAULT 'moderado',
    objetivo_calorias INTEGER DEFAULT 2000,
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Platos
CREATE TABLE platos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    momento_dia momento_dia NOT NULL,
    calorias_totales DECIMAL(10,2) NOT NULL DEFAULT 0,
    proteinas_totales DECIMAL(10,2) DEFAULT 0,
    carbohidratos_totales DECIMAL(10,2) DEFAULT 0,
    grasas_totales DECIMAL(10,2) DEFAULT 0,
    fibra_totales DECIMAL(10,2) DEFAULT 0,
    peso_total_gramos DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación: ingredientes usados en cada plato CON CANTIDADES
CREATE TABLE plato_ingredientes (
    id SERIAL PRIMARY KEY,
    plato_id INTEGER REFERENCES platos(id) ON DELETE CASCADE,
    ingrediente_id INTEGER REFERENCES ingredientes(id) ON DELETE CASCADE,
    cantidad_gramos DECIMAL(10,2) NOT NULL,
    calorias_aportadas DECIMAL(10,2) DEFAULT 0,
    proteinas_aportadas DECIMAL(10,2) DEFAULT 0,
    carbohidratos_aportados DECIMAL(10,2) DEFAULT 0,
    grasas_aportadas DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plato_id, ingrediente_id)
);

-- Tabla de relación: platos asignados a familiares
CREATE TABLE plato_familiares (
    id SERIAL PRIMARY KEY,
    plato_id INTEGER REFERENCES platos(id) ON DELETE CASCADE,
    familiar_id INTEGER REFERENCES familiares(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plato_id, familiar_id)
);

-- Tabla de planificación semanal
CREATE TABLE planificacion_semanal (
    id SERIAL PRIMARY KEY,
    semana_inicio DATE NOT NULL,
    dia dia_semana NOT NULL,
    momento momento_dia NOT NULL,
    plato_id INTEGER REFERENCES platos(id) ON DELETE SET NULL,
    familiar_id INTEGER REFERENCES familiares(id) ON DELETE CASCADE,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(semana_inicio, dia, momento, familiar_id)
);

-- Función para calcular aportes de un ingrediente en un plato
CREATE OR REPLACE FUNCTION calcular_aportes_ingrediente()
RETURNS TRIGGER AS $$
DECLARE
    ing RECORD;
    factor DECIMAL(10,4);
BEGIN
    SELECT * INTO ing FROM ingredientes WHERE id = NEW.ingrediente_id;
    factor := NEW.cantidad_gramos / 100.0;
    
    NEW.calorias_aportadas := ROUND(ing.calorias_por_100g * factor, 2);
    NEW.proteinas_aportadas := ROUND(ing.proteinas_por_100g * factor, 2);
    NEW.carbohidratos_aportados := ROUND(ing.carbohidratos_por_100g * factor, 2);
    NEW.grasas_aportadas := ROUND(ing.grasas_por_100g * factor, 2);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular aportes al insertar/actualizar ingrediente en plato
CREATE TRIGGER trigger_calcular_aportes
BEFORE INSERT OR UPDATE ON plato_ingredientes
FOR EACH ROW
EXECUTE FUNCTION calcular_aportes_ingrediente();

-- Función para actualizar totales del plato
CREATE OR REPLACE FUNCTION actualizar_totales_plato()
RETURNS TRIGGER AS $$
DECLARE
    plato_id_target INTEGER;
BEGIN
    plato_id_target := COALESCE(NEW.plato_id, OLD.plato_id);
    
    UPDATE platos
    SET 
        calorias_totales = COALESCE((
            SELECT SUM(calorias_aportadas)
            FROM plato_ingredientes
            WHERE plato_id = plato_id_target
        ), 0),
        proteinas_totales = COALESCE((
            SELECT SUM(proteinas_aportadas)
            FROM plato_ingredientes
            WHERE plato_id = plato_id_target
        ), 0),
        carbohidratos_totales = COALESCE((
            SELECT SUM(carbohidratos_aportados)
            FROM plato_ingredientes
            WHERE plato_id = plato_id_target
        ), 0),
        grasas_totales = COALESCE((
            SELECT SUM(grasas_aportadas)
            FROM plato_ingredientes
            WHERE plato_id = plato_id_target
        ), 0),
        peso_total_gramos = COALESCE((
            SELECT SUM(cantidad_gramos)
            FROM plato_ingredientes
            WHERE plato_id = plato_id_target
        ), 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = plato_id_target;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar totales después de modificar ingredientes
CREATE TRIGGER trigger_actualizar_totales_plato
AFTER INSERT OR UPDATE OR DELETE ON plato_ingredientes
FOR EACH ROW
EXECUTE FUNCTION actualizar_totales_plato();

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_ingredientes_updated_at BEFORE UPDATE ON ingredientes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_familiares_updated_at BEFORE UPDATE ON familiares FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_platos_updated_at BEFORE UPDATE ON platos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_planificacion_updated_at BEFORE UPDATE ON planificacion_semanal FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Índices para búsquedas
CREATE INDEX idx_ingredientes_nombre ON ingredientes(nombre);
CREATE INDEX idx_ingredientes_categoria ON ingredientes(categoria);
CREATE INDEX idx_platos_nombre ON platos(nombre);
CREATE INDEX idx_platos_momento ON platos(momento_dia);
CREATE INDEX idx_planificacion_semana ON planificacion_semanal(semana_inicio, familiar_id);

-- Seed Data: Ingredientes de Mercadona
INSERT INTO ingredientes (nombre, categoria, calorias_por_100g, proteinas_por_100g, carbohidratos_por_100g, grasas_por_100g, fibra_por_100g) VALUES
-- Pasta y arroz
('Macarrones integrales Hacendado', 'Pasta y arroz', 350, 12.0, 70.0, 2.5, 8.0),
('Arroz basmati Hacendado', 'Pasta y arroz', 345, 7.5, 78.0, 0.5, 1.5),
('Espaguetis integrales Hacendado', 'Pasta y arroz', 348, 13.0, 68.0, 2.8, 9.0),
('Fideos de arroz', 'Pasta y arroz', 360, 3.5, 83.0, 0.5, 1.0),

-- Carnes
('Carne picada mixta Hacendado', 'Carnes', 220, 18.0, 0, 17.5, 0),
('Pechuga de pollo Hacendado', 'Carnes', 110, 23.0, 0, 2.5, 0),
('Pavo en filetes Hacendado', 'Carnes', 105, 22.0, 0.5, 1.5, 0),
('Lomo de cerdo', 'Carnes', 143, 21.0, 0, 6.5, 0),
('Ternera para guisar', 'Carnes', 150, 20.0, 0, 8.0, 0),

-- Pescados
('Salmón fresco', 'Pescados', 180, 20.0, 0, 12.0, 0),
('Merluza congelada Hacendado', 'Pescados', 85, 17.0, 0, 2.0, 0),
('Atún al natural Hacendado', 'Pescados', 108, 25.0, 0, 1.0, 0),
('Gambas peladas congeladas', 'Pescados', 85, 18.0, 0, 1.0, 0),
('Bacalao desalado', 'Pescados', 82, 18.0, 0, 0.7, 0),

-- Verduras
('Cebolla', 'Verduras', 40, 1.0, 9.0, 0.1, 1.7),
('Tomate natural', 'Verduras', 18, 0.9, 3.5, 0.2, 1.2),
('Espárragos verdes', 'Verduras', 20, 2.2, 2.0, 0.2, 2.0),
('Calabacín', 'Verduras', 17, 1.2, 3.1, 0.3, 1.0),
('Pimiento rojo', 'Verduras', 31, 1.0, 6.0, 0.3, 2.1),
('Zanahoria', 'Verduras', 41, 0.9, 10.0, 0.2, 2.8),
('Brócoli', 'Verduras', 34, 2.8, 7.0, 0.4, 2.6),
('Espinacas frescas', 'Verduras', 23, 2.9, 3.6, 0.4, 2.2),

-- Frutas
('Plátano', 'Frutas', 89, 1.1, 23.0, 0.3, 2.6),
('Manzana', 'Frutas', 52, 0.3, 14.0, 0.2, 2.4),
('Fresas', 'Frutas', 32, 0.7, 7.7, 0.3, 2.0),
('Naranja', 'Frutas', 47, 0.9, 12.0, 0.1, 2.4),

-- Lácteos
('Queso rallado Hacendado', 'Lácteos', 400, 26.0, 2.0, 33.0, 0),
('Yogur griego natural Hacendado', 'Lácteos', 97, 9.0, 4.0, 5.0, 0),
('Leche desnatada Hacendado', 'Lácteos', 35, 3.5, 5.0, 0.1, 0),
('Queso fresco batido 0%', 'Lácteos', 55, 8.0, 4.0, 0.2, 0),

-- Huevos
('Huevos L Hacendado', 'Huevos', 155, 13.0, 1.1, 11.0, 0),

-- Legumbres
('Lentejas cocidas Hacendado', 'Legumbres', 115, 9.0, 20.0, 0.4, 7.9),
('Garbanzos cocidos Hacendado', 'Legumbres', 120, 8.0, 18.0, 2.0, 6.0),
('Alubias blancas cocidas', 'Legumbres', 100, 7.0, 17.0, 0.5, 6.0),

-- Pan y cereales
('Pan integral de molde Hacendado', 'Pan', 240, 9.0, 44.0, 3.0, 6.5),
('Avena integral Hacendado', 'Cereales', 370, 13.0, 60.0, 7.0, 10.0),
('Copos de maíz Hacendado', 'Cereales', 378, 7.0, 84.0, 0.9, 3.0),

-- Aceites y salsas
('Aceite de oliva virgen extra', 'Aceites', 900, 0, 0, 100, 0),
('Tomate frito Hacendado', 'Salsas', 85, 1.5, 12.0, 3.5, 1.8),
('Salsa de soja', 'Salsas', 53, 5.0, 6.0, 0.1, 0);

-- Seed Data: Familiares de ejemplo
INSERT INTO familiares (nombre, edad, objetivo_calorias) VALUES
('Pedro', 42, 2200),
('María', 38, 1800),
('Lucas', 12, 2000);

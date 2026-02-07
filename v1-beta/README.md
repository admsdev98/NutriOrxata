# 🥗 NutriOrxata - Planificador Semanal de Comidas

Sistema completo para gestionar la planificación semanal de comidas familiares con cálculo automático de información nutricional.

## 🚀 Características

- **📦 Gestión de Ingredientes**: Base de datos de productos de Mercadona con información nutricional por 100g
- **🍽️ Creación de Platos**: Combina ingredientes con cantidades específicas y calcula automáticamente las calorías y macros
- **👨‍👩‍👧‍👦 Familiares**: Gestiona miembros de la familia con objetivos calóricos personalizados
- **📅 Planificador Semanal**: Vista de calendario para asignar platos a cada comida del día
- **📊 Cálculo Automático**: Los totales nutricionales se actualizan en tiempo real

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | React 18 + Vite |
| Backend | Python + FastAPI |
| Base de datos | PostgreSQL 15 |
| Contenedores | Docker + Docker Compose |

## 📁 Estructura del Proyecto

```
NutriOrxata/
├── docker-compose.yml      # Orquestación de servicios
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── scripts/          # Utilidades y migraciones
│   └── src/
│       └── app/
│           ├── main.py         # Punto de entrada FastAPI
│           ├── config.py       # Configuración
│           ├── database.py     # Conexión a PostgreSQL
│           ├── models/         # Modelos SQLAlchemy
│           ├── schemas/        # Schemas Pydantic
│           └── routers/        # Endpoints API
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── App.jsx         # Componente principal + rutas
│       ├── index.css       # Sistema de diseño
│       ├── api/client.js   # Cliente API
│       └── pages/          # Páginas de la aplicación
└── database/
    └── init.sql            # Schema + triggers + seed data
```

## 🚀 Inicio Rápido

### Requisitos Previos

- Docker y Docker Compose instalados

### Levantar el Proyecto

```bash
# Clonar o navegar al directorio
cd NutriOrxata

# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Acceder a la Aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📡 API Endpoints

### Ingredientes
```
GET    /api/ingredientes              # Listar todos
GET    /api/ingredientes?q=macarrones # Buscar por nombre
GET    /api/ingredientes?categoria=Carnes # Filtrar por categoría
POST   /api/ingredientes              # Crear nuevo
PUT    /api/ingredientes/{id}         # Actualizar
DELETE /api/ingredientes/{id}         # Eliminar
```

### Platos
```
GET    /api/platos                    # Listar todos
GET    /api/platos/{id}               # Obtener con ingredientes
POST   /api/platos                    # Crear con ingredientes
PUT    /api/platos/{id}               # Actualizar info
DELETE /api/platos/{id}               # Eliminar

POST   /api/platos/{id}/ingredientes  # Añadir ingrediente
PUT    /api/platos/{id}/ingredientes/{ing_id}  # Actualizar cantidad
DELETE /api/platos/{id}/ingredientes/{ing_id}  # Quitar ingrediente
```

### Familiares
```
GET    /api/familiares                # Listar todos
POST   /api/familiares                # Crear nuevo
PUT    /api/familiares/{id}           # Actualizar
DELETE /api/familiares/{id}           # Eliminar
```

### Planificación
```
GET    /api/planificacion                          # Listar semana actual
GET    /api/planificacion?semana_inicio=2024-01-29 # Semana específica
GET    /api/planificacion/resumen/{familiar_id}    # Resumen con totales
POST   /api/planificacion                          # Asignar plato
DELETE /api/planificacion/{id}                     # Eliminar asignación
```

## 🗄️ Base de Datos

### Triggers Automáticos

La base de datos incluye triggers que:

1. **Calculan automáticamente** los aportes nutricionales de cada ingrediente según la cantidad
2. **Actualizan los totales** del plato cuando se añaden, modifican o eliminan ingredientes

### Seed Data

Incluye ~40 ingredientes de Mercadona precargados en categorías:
- Pasta y arroz
- Carnes
- Pescados
- Verduras
- Frutas
- Lácteos
- Y más...

## 📊 Ejemplo de Uso

### Crear un Plato

```json
POST /api/platos
{
    "nombre": "Macarrones a la Boloñesa",
    "descripcion": "Pasta integral con salsa boloñesa casera",
    "momento_dia": "comida",
    "ingredientes": [
        { "ingrediente_id": 1, "cantidad_gramos": 80 },
        { "ingrediente_id": 5, "cantidad_gramos": 120 },
        { "ingrediente_id": 39, "cantidad_gramos": 100 }
    ],
    "familiares_ids": [1, 2, 3]
}
```

La respuesta incluirá los totales calculados automáticamente:
```json
{
    "id": 1,
    "nombre": "Macarrones a la Boloñesa",
    "calorias_totales": 629,
    "proteinas_totales": 33.2,
    "carbohidratos_totales": 68,
    "grasas_totales": 25.5,
    "peso_total_gramos": 300,
    ...
}
```

## 🔧 Desarrollo

### Backend (modo desarrollo)

```bash
cd backend
pip install -r requirements.txt
PYTHONPATH=src uvicorn app.main:app --reload
```

### Frontend (modo desarrollo)

```bash
cd frontend
npm install
npm run dev
```

## 📝 Variables de Entorno

### Backend
- `DATABASE_URL`: URL de conexión a PostgreSQL
- `CORS_ORIGINS`: Orígenes permitidos para CORS
- `SECRET_KEY`: Clave para firmar JWT (obligatoria en producción)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Duración del token (minutos)
- `JWT_ISSUER`: Issuer esperado en JWT (opcional)
- `JWT_AUDIENCE`: Audience esperada en JWT (opcional)
- `BCRYPT_ROUNDS`: Coste de bcrypt (default: 12)
- `ENVIRONMENT`: `development` o `production`

### Frontend
- `VITE_API_URL`: URL del backend (default: http://localhost:8000)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Push a la branch (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - Siéntete libre de usar este proyecto como base para tus propias aplicaciones.

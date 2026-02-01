# Plan Detallado: Importador BEDCA -> `ingredientes` (NutriOrxata)

Fecha: 2026-02-01  
Objetivo: Poblar la tabla `ingredientes` con **alimentos genéricos** (no productos de supermercado) usando **BEDCA** como fuente canónica, con valores por 100g: `kcal`, `proteina`, `carbohidratos`, `grasas` y, si está disponible, `fibra` y `sal`.

---

## 0) Contexto del proyecto (estado actual)

### 0.1 Repositorio / servicios
- Repo: NutriOrxata
- Backend: FastAPI + SQLAlchemy.
- DB: Postgres (docker-compose).

### 0.2 Tabla destino
Definida en `database/init.sql` (sección “Tabla de Ingredientes”):
- `ingredientes.nombre` (varchar, NOT NULL)
- `ingredientes.categoria` (ENUM `categoria_ingrediente`, NOT NULL)
- `ingredientes.supermercado` (default `Mercadona`) **pero para BEDCA lo dejaremos en otro valor** (ver plan).
- `ingredientes.calorias_por_100g` (NOT NULL)
- macros por 100g con default 0:
  - `proteinas_por_100g`
  - `carbohidratos_por_100g`
  - `grasas_por_100g`
  - `fibra_por_100g` (nullable)
  - `sal_por_100g` (nullable)
- `notas`, `created_at`, `updated_at`.

Modelo SQLAlchemy: `backend/src/app/models/ingrediente.py`:
- Campos equivalentes a la tabla.
- `categoria` es `String(50)` con default "Otros" (ojo: DB tiene ENUM, pero el modelo actual usa String; el import debe escribir valores del enum exactamente).

### 0.3 Categorías disponibles (ENUM)
En `database/init.sql`:
- `Pasta y arroz`
- `Carnes`
- `Pescados`
- `Verduras`
- `Frutas`
- `Lácteos`
- `Huevos`
- `Legumbres`
- `Pan`
- `Cereales`
- `Aceites`
- `Salsas`
- `Bebidas`
- `Otros`

---

## 1) Fuente de datos: BEDCA (cómo se consulta realmente)

BEDCA no ofrece (a día de hoy) un endpoint JSON simple. La web usa un endpoint de “query engine”:

- Endpoint: `POST https://www.bedca.net/bdpub/procquery.php`
- Content-Type: `text/xml`
- Payload: XML con estructura `<foodquery>...</foodquery>`
- Respuesta: XML con `<foodresponse>...</foodresponse>`

### 1.1 Concepto de “levels”
BEDCA usa un atributo `level` que cambia el tipo de query/resultado:

- `level=3`: lista de **grupos de alimentos** (food groups).
- `level=3f`: lista de **alimentos** dentro de un grupo (por `foodgroup_id`) y origen (`f_origen`).
- `level=2`: detalle completo (incluye composición) de un alimento por `f_id`.

### 1.2 Ejemplos de payloads (deben funcionar tal cual)

#### A) Listar grupos de alimentos (food groups)
Devuelve `fg_id`, `fg_ori_name`, `fg_eng_name`.

```xml
<?xml version="1.0" encoding="utf-8"?>
<foodquery>
  <type level="3"/>
  <selection>
    <atribute name="fg_id"/>
    <atribute name="fg_ori_name"/>
    <atribute name="fg_eng_name"/>
  </selection>
  <order ordtype="ASC">
    <atribute3 name="fg_id"/>
  </order>
</foodquery>
```

Respuesta ejemplo (resumida):
- `fg_id=1` Lácteos y derivados
- `fg_id=2` Huevos y derivados
- `fg_id=3` Cárnicos y derivados
- `fg_id=4` Pescados...
- `fg_id=5` Grasas y aceites
- `fg_id=6` Cereales y derivados
- `fg_id=7` Legumbres, semillas, frutos secos...
- `fg_id=8` Verduras...
- `fg_id=9` Frutas...
- `fg_id=11` Bebidas (no lácteas)
- etc.

#### B) Listar alimentos por grupo (food list)
Usa `level=3f` y condiciones:
- `foodgroup_id = <fg_id>`
- `f_origen = <origen>` donde origen puede ser `BEDCA` o `BEDCA2` (se observaron ambos).

```xml
<?xml version="1.0" encoding="utf-8"?>
<foodquery>
  <type level="3f"/>
  <selection>
    <atribute name="f_id"/>
    <atribute name="f_ori_name"/>
    <atribute name="f_eng_name"/>
  </selection>
  <condition>
    <cond1><atribute1 name="foodgroup_id"/></cond1>
    <relation type="EQUAL"/>
    <cond3>3</cond3>
  </condition>
  <condition>
    <cond1><atribute1 name="f_origen"/></cond1>
    <relation type="EQUAL"/>
    <cond3>BEDCA</cond3>
  </condition>
  <order ordtype="ASC">
    <atribute3 name="f_ori_name"/>
  </order>
</foodquery>
```

#### C) Detalle composición de un alimento por f_id
Usa `level=2` y condiciones:
- `f_id = <id>`
- `publico = 1` (filtra componentes “publicables”)

Nota: la web usa un selection enorme; para el import nos bastan estos campos:
- Identidad: `f_id`, `f_ori_name`, `f_eng_name`, `f_origen`, `edible_portion`
- Valores: `c_id`, `c_ori_name`, `eur_name`, `componentgroup_id`, `best_location`, `v_unit`, `moex`, `value_type`

Payload mínimo recomendado:

```xml
<?xml version="1.0" encoding="utf-8"?>
<foodquery>
  <type level="2"/>
  <selection>
    <atribute name="f_id"/>
    <atribute name="f_ori_name"/>
    <atribute name="f_eng_name"/>
    <atribute name="edible_portion"/>
    <atribute name="f_origen"/>
    <atribute name="c_id"/>
    <atribute name="c_ori_name"/>
    <atribute name="eur_name"/>
    <atribute name="componentgroup_id"/>
    <atribute name="best_location"/>
    <atribute name="v_unit"/>
    <atribute name="moex"/>
    <atribute name="value_type"/>
  </selection>
  <condition>
    <cond1><atribute1 name="f_id"/></cond1>
    <relation type="EQUAL"/>
    <cond3>994</cond3>
  </condition>
  <condition>
    <cond1><atribute1 name="publico"/></cond1>
    <relation type="EQUAL"/>
    <cond3>1</cond3>
  </condition>
  <order ordtype="ASC">
    <atribute3 name="componentgroup_id"/>
  </order>
</foodquery>
```

Respuesta: `<foodresponse><food>...<foodvalue>...</foodvalue>...</food></foodresponse>` con muchos `<foodvalue>`.

---

## 2) Qué valores nutricionales sacar y cómo convertirlos

### 2.1 Componentes BEDCA (c_id) obligatorios y opcionales

OBLIGATORIOS (para insertar un ingrediente):
- Energía: `c_id=409` (`eur_name=ENERC`)
  - Se observó `v_unit = kJ` (kJ/100g).
- Proteína: `c_id=416` (`eur_name=PROT`)
  - `v_unit = g`
- Carbohidratos: `c_id=53` (`eur_name=CHO`)
  - `v_unit = g`
- Grasa total: `c_id=410` (`eur_name=FAT`)
  - `v_unit = g`

OPCIONALES:
- Fibra dietética: `c_id=307` (`eur_name=FIBT`)
  - `v_unit = g`
- Sodio: `c_id=323` (`eur_name=NA`)
  - `v_unit = mg` (observado)

### 2.2 Conversiones y normalización

- Calorías por 100g (kcal/100g):
  - BEDCA energía viene en kJ/100g -> convertir:
    - `kcal = kJ / 4.184`
  - Redondeo recomendado a 2 decimales para guardar en `DECIMAL(10,2)`.

- Sal por 100g (g/100g), si BEDCA da sodio:
  - Sodio suele venir como mg/100g.
  - Convertir sodio mg -> g: `sodio_g = sodio_mg / 1000`
  - Convertir sodio -> sal (NaCl): `sal_g = sodio_g * 2.5`
  - Guardar en `sal_por_100g` (g/100g). Redondeo a 2 decimales.

- Unidades:
  - Para macros, esperar `g`.
  - Para energía, esperar `kJ`. Si llegara `kcal` en algún alimento, soportar ambos.

- Edible portion:
  - BEDCA incluye `edible_portion`. Para import de alimentos genéricos, usaremos valores “per 100g edible portion” (moex `W`) tal como vienen; no aplicamos factor adicional.

---

## 3) Diseño de datos (idempotencia + trazabilidad)

### 3.1 Problema
`ingredientes` hoy no tiene campos para saber “este registro viene de BEDCA f_id X”, lo que complica:
- re-ejecutar import sin duplicar
- actualizar valores si BEDCA cambia
- auditar origen

### 3.2 Solución recomendada (cambio de schema mínimo)
Añadir columnas a `ingredientes`:
- `fuente VARCHAR(30) NOT NULL DEFAULT 'MANUAL'`
- `fuente_id VARCHAR(50)` (para BEDCA: `f_id`)
- `UNIQUE (fuente, fuente_id)`

Y ajustar el modelo SQLAlchemy para reflejarlo.

Si NO se puede tocar schema:
- Guardar `fuente=BEDCA` en `supermercado` (aunque semánticamente sea raro) y `f_id` en `notas` (ej: `BEDCA:f_id=994`)
- Dedupe por `nombre + categoria + supermercado`, con riesgo de colisiones.

### 3.3 Reglas de upsert
- Clave primaria lógica: `(fuente='BEDCA', fuente_id=str(f_id))`.
- Si existe:
  - actualizar macros y kcal si han cambiado
  - no tocar `created_at`, sí `updated_at`.
- Si no existe:
  - insertar nuevo.

---

## 4) Mapping de “tipo” a `categoria_ingrediente`

BEDCA trae `foodgroup_id` (fg_id) en listas, y el alimento “pertenece” a ese grupo.

### 4.1 Mapping base (por fg_id)
- 1 (Lácteos y derivados) -> `Lácteos`
- 2 (Huevos y derivados) -> `Huevos`
- 3 (Cárnicos y derivados) -> `Carnes`
- 4 (Pescados...) -> `Pescados`
- 5 (Grasas y aceites) -> `Aceites`
- 6 (Cereales y derivados) -> `Cereales` (con heurísticas abajo)
- 7 (Legumbres/semillas/frutos secos) -> `Legumbres` (o `Otros` para frutos secos si se decide)
- 8 (Verduras...) -> `Verduras`
- 9 (Frutas...) -> `Frutas`
- 11 (Bebidas no lácteas) -> `Bebidas`
- 10 (Azúcar/chocolate) -> `Otros` o `Cereales` (decisión: por defecto `Otros`)
- resto -> `Otros`

### 4.2 Heurísticas adicionales (sobre `nombre` en español)
Aplicar en este orden (first-match):

- Si contiene cualquiera de:
  - `arroz`, `pasta`, `fideo`, `macarr`, `espagu`, `tallar`, `cusc`, `quinoa` -> `Pasta y arroz`
- Si contiene:
  - `pan`, `boll`, `tost`, `pico`, `baguette` -> `Pan`
- Si contiene:
  - `salsa`, `mayonesa`, `ketchup`, `mostaza`, `tomate frito`, `pesto` -> `Salsas`
- Si contiene `cereal` pero fg_id=6 -> `Cereales` (mantener)

Nota: estas heurísticas se aplican después del mapping por fg_id, para refinar fg_id=6 principalmente, y para reclasificar casos puntuales.

---

## 5) Implementación técnica (Python) en el repo

### 5.1 Archivos a crear
- `backend/scripts/import_bedca_ingredientes.py`
  - Script CLI ejecutable dentro del contenedor backend.
- (Opcional, recomendado) `backend/src/app/services/bedca_client.py`
  - Cliente HTTP y helpers de parseo, para reutilizar y testear.

### 5.2 Dependencias
- Opción A (recomendada): añadir `requests` a `backend/requirements.txt`.
- Opción B (sin deps): usar `urllib.request` (stdlib). Menos cómodo pero suficiente.

### 5.3 Interfaz CLI del script (especificación exacta)
Flags:
- `--group-ids "1,2,3,4,5,6,7,8,9,11"`
  - Default recomendado: todos los “alimentos básicos”.
- `--origins "BEDCA,BEDCA2"`
  - Default: ambos.
- `--limit N`
  - Procesa solo N alimentos (para pruebas).
- `--dry-run`
  - No escribe en DB; imprime resumen y ejemplos.
- `--rate-limit-ms 200`
  - Sleep entre requests (respeto servidor).
- `--min-required energy,protein,carbs,fat`
  - Default: exigir todos; si falta alguno, skip + log.
- `--update-existing / --no-update-existing`
  - Default: update.
- `--supermercado "BEDCA"`
  - Para poblar `ingredientes.supermercado` con la fuente real (recomendado).

Salida:
- contador total, insertados, actualizados, saltados (por falta de datos), errores HTTP, errores parse.

### 5.4 Reglas de robustez HTTP
- Timeout: 30s.
- Reintentos: 3 con backoff exponencial para 5xx/timeout.
- Para 4xx: no retry (salvo 429).
- Respetar `--rate-limit-ms`.

### 5.5 Parsing XML (especificación)
- Usar `xml.etree.ElementTree`.
- Respuesta `level=2`:
  - `food = root.find("food")`
  - iterar `food.findall("foodvalue")`:
    - leer `c_id`, `best_location`, `v_unit`, `value_type`
- “best_location” es el valor numérico principal.
- Convertir a `float` con cuidado (puede venir vacío).
- Aceptar `value_type`:
  - `BE` (best estimate)
  - `AR` (analytical result)
  - `LZ` (logical zero)
  - Si está vacío, tratar como missing.

### 5.6 Normalización de nombres
- `nombre` = `f_ori_name` (español).
- Trim espacios, colapsar dobles espacios.
- Mantener acentos (ya viene con).

### 5.7 Escritura en DB (SQLAlchemy)
- Importar:
  - `from app.database import SessionLocal`
  - `from app.models.ingrediente import Ingrediente`
- Sesión:
  - `db = SessionLocal()`
  - commit en batches (ej. cada 100 items) para rendimiento.
- Upsert:
  - si hay columnas `fuente`/`fuente_id`: query por esas.
  - si no: query por `nombre`, `categoria`, `supermercado`.

---

## 6) QA y validación (mínimo obligatorio)

### 6.1 Prueba rápida manual
- Buscar 3 alimentos base por nombre para asegurar el pipeline:
  - “Pollo, pechuga, con piel, crudo” (ej f_id=994)
  - “Arroz…” (localizar por LIKE)
  - “Aceite de oliva…” (localizar por LIKE)
- Validar:
  - kcal plausibles (kJ/4.184)
  - macros plausibles (0..100)
  - que `categoria` sea coherente.

### 6.2 Reglas de validación de datos
Antes de insertar:
- `0 <= protein, carbs, fat, fiber <= 100`
- `kcal > 0` (si no, skip)
- Si `kcal` demasiado alto (ej > 1000), log warning (probable unidad mal interpretada).

### 6.3 Auditoría
Guardar en `notas` (aunque tengamos fuente_id):
- `Fuente: BEDCA`
- `BEDCA f_id: <id>`
- `BEDCA origen: BEDCA/BEDCA2`
- `BEDCA fg_id: <id>`

---

## 7) Instrucciones de ejecución (docker)

Ejecutar dentro del contenedor backend (una vez exista el script):

- Opción 1 (docker compose):
  - `docker compose exec backend python scripts/import_bedca_ingredientes.py --group-ids "1,2,3,4,5,6,7,8,9,11" --origins "BEDCA,BEDCA2" --rate-limit-ms 200`

- Prueba corta:
  - `docker compose exec backend python scripts/import_bedca_ingredientes.py --group-ids "3,6,5" --limit 50 --dry-run`

---

## 8) Decisiones abiertas (resolver antes de merge)

1) ¿Se permite modificar schema para añadir `fuente` y `fuente_id` + unique?
  - Recomendación: sí (mejora idempotencia y mantenimiento).
2) ¿Cómo clasificar “frutos secos” del fg_id=7?
  - Opción A: `Legumbres` (simple)
  - Opción B: `Otros` (si se quiere evitar mezclar)
3) ¿Qué poner en `supermercado`?
  - Recomendación: `BEDCA` (es la fuente real; aunque el campo se llame supermercado, es el mejor fit actual).
4) ¿Importar todo BEDCA o solo una lista “curada”?
  - Recomendación: empezar por grupos base + heurísticas; luego permitir “allowlist” por queries.

---

## 9) Apéndice: comprobaciones técnicas ya realizadas

- `POST /bdpub/procquery.php` con `level=3` devuelve correctamente food groups.
- `POST level=2` para `f_id=994` devuelve:
  - energía 409: `437.1 kJ/100g`
  - grasa 410: `1.2 g/100g`
  - proteína 416: `23.1 g/100g`
  - carbohidratos 53: `0 g/100g`
  - fibra 307: `0 g/100g`
  - sodio 323: `65 mg/100g` -> sal ~ `0.16 g/100g`

Esto confirma que con BEDCA podemos cumplir “sí o sí” kcal y macros para genéricos.

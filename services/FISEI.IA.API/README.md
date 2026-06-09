# FISEI.IA.API

Microservicio Python / Flask que expone predicciones de riesgo de mantenimiento
y estadísticas históricas, conectándose a SQL Server mediante `pyodbc`.

## Estructura

```
FISEI.IA.API/
├── app.py                  # Entry point Flask (puerto 5090)
├── database.py             # Conexión a SQL Server con pyodbc
├── requirements.txt        # Dependencias
├── routes/
│   ├── __init__.py
│   └── ia_routes.py        # Blueprint con los endpoints /api/ia/*
└── services/
    ├── __init__.py
    └── ia_service.py       # Reglas heurísticas y consultas SQL
```

## Instalación

```bash
cd services/FISEI.IA.API
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

> **Requisito previo**: tener instalado el
> [ODBC Driver 18 for SQL Server](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
> (recomendado para SQL Server 2022).

## Ejecución

```bash
python app.py
```

El servicio arranca en `http://localhost:5090`.

## Endpoints

| Método | Ruta                       | Descripción                                      |
|--------|----------------------------|--------------------------------------------------|
| GET    | `/health`                  | Health check                                     |
| GET    | `/api/ia/predicciones`     | Predicciones de riesgo por equipo                |
| GET    | `/api/ia/estadisticas`     | Estadísticas generales de mantenimientos         |

### GET /api/ia/predicciones

Aplica reglas heurísticas (sin ML externo) a cada equipo activo:

| Prioridad | Regla                                                          | Riesgo |
|-----------|----------------------------------------------------------------|--------|
| 1         | ≥ 2 mantenimientos **Correctivos** en los últimos 90 días     | Alto   |
| 2         | > 180 días desde el último mantenimiento **Completado**       | Alto   |
| 3         | Entre 90 y 180 días sin mantenimiento **Completado**          | Medio  |
| 4         | Último mantenimiento **Completado** hace < 90 días            | Bajo   |

Ejemplo de respuesta:

```json
[
  {
    "equipoId": 1,
    "numeroSerie": "DELL-001",
    "laboratorio": "Laboratorio 1",
    "marca": "Dell",
    "modelo": "Inspiron 15",
    "riesgo": "Alto",
    "razon": "Alta frecuencia de fallas correctivas",
    "diasSinMantenimiento": 95,
    "totalCorrectivos": 3
  }
]
```

### GET /api/ia/estadisticas

```json
{
  "mantenimientosPorMes": [ { "mes": "2025-12", "datos": [ {"tipo": "Correctivo", "total": 4} ] } ],
  "topEquiposConFallas": [ { "equipoId": 3, "numeroSerie": "HP-007", "totalCorrectivos": 8 } ],
  "distribucionPorLaboratorio": [ { "laboratorio": "Lab A", "totalMantenimientos": 12 } ],
  "resumen": { "total": 50, "completados": 40, "pendientes": 8, "cancelados": 2 }
}
```

## CORS

Habilitado para `http://localhost:5173` en todas las rutas `/api/*`.

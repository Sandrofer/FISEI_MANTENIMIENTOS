import logging
from datetime import date, timedelta, datetime
from collections import defaultdict

from database import (
    get_connection_inventario,
    get_connection_mantenimientos
)

logger = logging.getLogger(__name__)

DIAS_CORRECTIVOS = 90
DIAS_ALTO = 180
DIAS_MEDIO = 90


# ─────────────────────────────────────────────
def _to_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    return value


def _dias_desde(fecha):
    if not fecha:
        return None
    return (date.today() - fecha).days


# ─────────────────────────────────────────────
def obtener_predicciones():

    # ✔ EQUIPOS (Inventario DB)
    conn = get_connection_inventario()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, codigo_inventario, nombre_modelo, numero_serie, estado
        FROM equipos
    """)
    equipos = cursor.fetchall()
    conn.close()

    # ✔ MANTENIMIENTOS (Mantenimientos DB)
    conn = get_connection_mantenimientos()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT equipo_id, estado_individual, fecha_inicio, fecha_fin
        FROM detalles_mantenimiento
    """)
    mantenimientos = cursor.fetchall()
    conn.close()

    # index
    mant_por_equipo = defaultdict(list)

    for m in mantenimientos:
        mant_por_equipo[m[0]].append(m)

    hoy = date.today()
    resultado = []

    for e in equipos:

        equipo_id = e[0]
        codigo = e[1]
        modelo = e[2]
        serie = e[3]

        registros = mant_por_equipo.get(equipo_id, [])

        # ✔ correctivos recientes
        correctivos = [
            r for r in registros
            if r[1] == "Finalizado"
            and _to_date(r[3] or r[2])
            and _to_date(r[3] or r[2]) >= hoy - timedelta(days=DIAS_CORRECTIVOS)
        ]

        # ✔ última fecha
        fechas = [
            _to_date(r[3] or r[2])
            for r in registros
            if _to_date(r[3] or r[2])
        ]

        ultimo = max(fechas) if fechas else None
        dias_sin = _dias_desde(ultimo)

        # ── reglas ─────────────────────────────
        if len(correctivos) >= 2:
            riesgo = "Alto"
            razon = "Fallas recurrentes"
        elif dias_sin is None or dias_sin > DIAS_ALTO:
            riesgo = "Alto"
            razon = "Sin mantenimiento reciente"
        elif dias_sin >= DIAS_MEDIO:
            riesgo = "Medio"
            razon = "Tiempo intermedio sin mantenimiento"
        else:
            riesgo = "Bajo"
            razon = "Estado estable"

        resultado.append({
            "equipoId": equipo_id,
            "codigo": codigo,
            "modelo": modelo,
            "serie": serie,
            "riesgo": riesgo,
            "razon": razon,
            "diasSinMantenimiento": dias_sin,
            "totalRegistros": len(registros)
        })

    return resultado


# ─────────────────────────────────────────────
def obtener_estadisticas():

    conn = get_connection_mantenimientos()
    cursor = conn.cursor()

    # ✔ resumen
    cursor.execute("""
        SELECT estado_individual, COUNT(*)
        FROM detalles_mantenimiento
        GROUP BY estado_individual
    """)

    resumen = {r[0]: r[1] for r in cursor.fetchall()}

    # ✔ top equipos
    cursor.execute("""
        SELECT TOP 5 equipo_id, COUNT(*)
        FROM detalles_mantenimiento
        GROUP BY equipo_id
        ORDER BY COUNT(*) DESC
    """)

    top = [
        {"equipoId": r[0], "total": r[1]}
        for r in cursor.fetchall()
    ]

    conn.close()

    return {
        "resumen": resumen,
        "topEquipos": top
    }
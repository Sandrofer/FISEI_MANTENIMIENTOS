"""
Conexiones SQL Server - Microservicio IA
"""

import logging
import pyodbc

logger = logging.getLogger(__name__)

BASE_CONNECTION = (
    "Driver={ODBC Driver 18 for SQL Server};"
    "Server=localhost\\SQLEXPRESS;"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
    "Encrypt=yes;"
)

# ─────────────────────────────────────────────
def get_connection_inventario():
    """Conexión a DB Inventario (equipos)"""
    try:
        conn = pyodbc.connect(
            BASE_CONNECTION + "Database=DB_Microservicio_Inventario;",
            timeout=10
        )
        return conn
    except Exception as e:
        logger.error("Error conexión Inventario: %s", e)
        raise


# ─────────────────────────────────────────────
def get_connection_mantenimientos():
    """Conexión a DB Mantenimientos"""
    try:
        conn = pyodbc.connect(
            BASE_CONNECTION + "Database=DB_Microservicio_Mantenimientos;",
            timeout=10
        )
        return conn
    except Exception as e:
        logger.error("Error conexión Mantenimientos: %s", e)
        raise
"""
Blueprint con los endpoints del módulo IA.
  GET /api/ia/predicciones
  GET /api/ia/estadisticas
"""

import logging
from flask import Blueprint, jsonify

from services.ia_service import obtener_predicciones, obtener_estadisticas

logger = logging.getLogger(__name__)

ia_bp = Blueprint("ia", __name__)


# ─── GET /api/ia/predicciones ─────────────────────────────────────────────────
@ia_bp.route("/predicciones", methods=["GET"])
def predicciones():
    """Retorna predicciones de riesgo por equipo basadas en reglas heurísticas."""
    try:
        logger.info("GET /api/ia/predicciones - solicitud recibida")
        resultado = obtener_predicciones()
        logger.info("GET /api/ia/predicciones - %d registros retornados", len(resultado))
        return jsonify(resultado), 200
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("Error en /api/ia/predicciones: %s", exc, exc_info=True)
        return jsonify({"error": "Error al obtener predicciones", "detalle": str(exc)}), 500


# ─── GET /api/ia/estadisticas ─────────────────────────────────────────────────
@ia_bp.route("/estadisticas", methods=["GET"])
def estadisticas():
    """Retorna estadísticas generales de mantenimientos."""
    try:
        logger.info("GET /api/ia/estadisticas - solicitud recibida")
        resultado = obtener_estadisticas()
        return jsonify(resultado), 200
    except Exception as exc:  # pylint: disable=broad-except
        logger.error("Error en /api/ia/estadisticas: %s", exc, exc_info=True)
        return jsonify({"error": "Error al obtener estadísticas", "detalle": str(exc)}), 500

"""
FISEI.IA.API - Microservicio de Inteligencia Artificial
Puerto: 5090
"""

import logging
from flask import Flask, jsonify
from flask_cors import CORS

from routes.ia_routes import ia_bp

# ─── Configuración de logging ────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ─── Inicialización de Flask ─────────────────────────────────────────────────
app = Flask(__name__)

# ─── CORS ────────────────────────────────────────────────────────────────────
CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:5173"}},
    supports_credentials=True,
)

# ─── Registro de Blueprints ──────────────────────────────────────────────────
app.register_blueprint(ia_bp, url_prefix="/api/ia")


# ─── Manejadores de error globales ───────────────────────────────────────────
@app.errorhandler(404)
def not_found(error):
    logger.warning("Ruta no encontrada: %s", error)
    return jsonify({"error": "Ruta no encontrada", "detalle": str(error)}), 404


@app.errorhandler(405)
def method_not_allowed(error):
    logger.warning("Método no permitido: %s", error)
    return jsonify({"error": "Método no permitido", "detalle": str(error)}), 405


@app.errorhandler(500)
def internal_server_error(error):
    logger.error("Error interno del servidor: %s", error)
    return jsonify({"error": "Error interno del servidor", "detalle": str(error)}), 500


# ─── Health check ────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "servicio": "FISEI.IA.API"}), 200


# ─── Entry point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logger.info("Iniciando FISEI.IA.API en puerto 5090...")
    app.run(host="0.0.0.0", port=5090, debug=False)


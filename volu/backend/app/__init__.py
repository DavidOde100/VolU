from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

def create_app():
    load_dotenv()

    app = Flask(__name__)
    app.url_map.strict_slashes = False  # 👈 Prevents automatic 308 redirects for trailing slashes

    CORS(app, origins=os.getenv("FRONTEND_URL", "http://localhost:3000"),
         supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Register blueprints
    from app.routes.notifications import notifications_bp
    from app.routes.participation import participation_bp
    from app.routes.user_profile import user_profile_bp
    from app.routes.events import events_bp

    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(participation_bp, url_prefix="/api/participation")
    app.register_blueprint(user_profile_bp)
    app.register_blueprint(events_bp, url_prefix="/api/events")

    return app


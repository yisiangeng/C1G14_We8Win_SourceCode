from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    from app.controllers.user_controller import user_bp
    from app.controllers.data_controller import data_bp
    
    app.register_blueprint(user_bp)
    app.register_blueprint(data_bp)
    
    return app

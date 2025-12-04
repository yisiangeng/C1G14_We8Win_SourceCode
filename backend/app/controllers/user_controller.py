from flask import Blueprint, jsonify, request
from app.models.user import User
from app.views.user_view import render_user_list, render_user_detail, render_user_created

user_bp = Blueprint('user', __name__, url_prefix='/api/users')

users_db = [
    User(1, 'John Doe', 'john@example.com'),
    User(2, 'Jane Smith', 'jane@example.com'),
]

@user_bp.route('/', methods=['GET'])
def get_users():
    return jsonify(render_user_list(users_db)), 200

@user_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = next((u for u in users_db if u.id == user_id), None)
    if user is None:
        return jsonify({'status': 'error', 'message': 'User not found'}), 404
    return jsonify(render_user_detail(user)), 200

@user_bp.route('/', methods=['POST'])
def create_user():
    data = request.get_json()
    new_user = User(
        id=len(users_db) + 1,
        name=data.get('name'),
        email=data.get('email')
    )
    users_db.append(new_user)
    return jsonify(render_user_created(new_user)), 201

@user_bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = next((u for u in users_db if u.id == user_id), None)
    if user is None:
        return jsonify({'status': 'error', 'message': 'User not found'}), 404
    
    data = request.get_json()
    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    return jsonify(render_user_detail(user)), 200

@user_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    global users_db
    users_db = [u for u in users_db if u.id != user_id]
    return jsonify({'status': 'deleted'}), 204

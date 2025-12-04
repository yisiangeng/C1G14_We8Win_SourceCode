from flask import Blueprint, jsonify, request
from app.models.data import Data
from app.views.data_view import render_data_list, render_data_detail, render_data_created

data_bp = Blueprint('data', __name__, url_prefix='/api/data')

data_db = [
    Data(1, 'Temperature', 22.5, '2025-12-05T10:00:00'),
    Data(2, 'Humidity', 65.0, '2025-12-05T10:00:00'),
]

@data_bp.route('/', methods=['GET'])
def get_data():
    return jsonify(render_data_list(data_db)), 200

@data_bp.route('/<int:data_id>', methods=['GET'])
def get_data_item(data_id):
    item = next((d for d in data_db if d.id == data_id), None)
    if item is None:
        return jsonify({'status': 'error', 'message': 'Data not found'}), 404
    return jsonify(render_data_detail(item)), 200

@data_bp.route('/', methods=['POST'])
def create_data():
    data = request.get_json()
    new_data = Data(
        id=len(data_db) + 1,
        title=data.get('title'),
        value=data.get('value'),
        timestamp=data.get('timestamp')
    )
    data_db.append(new_data)
    return jsonify(render_data_created(new_data)), 201

@data_bp.route('/<int:data_id>', methods=['PUT'])
def update_data(data_id):
    item = next((d for d in data_db if d.id == data_id), None)
    if item is None:
        return jsonify({'status': 'error', 'message': 'Data not found'}), 404
    
    data = request.get_json()
    item.title = data.get('title', item.title)
    item.value = data.get('value', item.value)
    item.timestamp = data.get('timestamp', item.timestamp)
    return jsonify(render_data_detail(item)), 200

@data_bp.route('/<int:data_id>', methods=['DELETE'])
def delete_data(data_id):
    global data_db
    data_db = [d for d in data_db if d.id != data_id]
    return jsonify({'status': 'deleted'}), 204

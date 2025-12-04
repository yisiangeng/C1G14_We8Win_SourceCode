def render_data_list(data_items):
    return {
        'status': 'success',
        'data': [item.to_dict() for item in data_items]
    }

def render_data_detail(data_item):
    return {
        'status': 'success',
        'data': data_item.to_dict()
    }

def render_data_created(data_item):
    return {
        'status': 'created',
        'data': data_item.to_dict()
    }

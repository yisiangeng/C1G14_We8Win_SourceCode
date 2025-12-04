def render_user_list(users):
    return {
        'status': 'success',
        'data': [user.to_dict() for user in users]
    }

def render_user_detail(user):
    return {
        'status': 'success',
        'data': user.to_dict()
    }

def render_user_created(user):
    return {
        'status': 'created',
        'data': user.to_dict()
    }

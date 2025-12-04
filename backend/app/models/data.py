class Data:
    def __init__(self, id, title, value, timestamp):
        self.id = id
        self.title = title
        self.value = value
        self.timestamp = timestamp
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'value': self.value,
            'timestamp': self.timestamp
        }

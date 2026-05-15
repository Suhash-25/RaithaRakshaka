
import json
import os

class CatalogHelper:
    _data = None

    @classmethod
    def load_data(cls):
        if cls._data is None:
            path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src", "data", "class 12", "knowledge_enhanced.json")
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    cls._data = json.load(f)
            else:
                cls._data = {}
        return cls._data

    @classmethod
    def get_description(cls, topic_name: str) -> str:
        data = cls.load_data()
        if not data:
            return None
        
        topic_lower = topic_name.lower().strip()
        
        # Search in Physics subjects
        for stream in data.get('streams', []):
            for subject in stream.get('subjects', []):
                if subject.get('subject_name') == 'Physics':
                    for chapter in subject.get('chapters', []):
                        for concept in chapter.get('concepts', []):
                            if concept.get('topic_name', '').lower().strip() == topic_lower:
                                return concept.get('description')
                            # Partial match
                            if topic_lower in concept.get('topic_name', '').lower():
                                return concept.get('description')
        return None

    @classmethod
    def get_all_topics(cls):
        data = cls.load_data()
        topics = []
        for stream in data.get('streams', []):
            for subject in stream.get('subjects', []):
                if subject.get('subject_name') == 'Physics':
                    for chapter in subject.get('chapters', []):
                        for concept in chapter.get('concepts', []):
                            topics.append(concept.get('topic_name'))
        return topics

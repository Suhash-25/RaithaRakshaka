
import json
import os

def merge_descriptions_v2():
    enhanced_path = r"c:\Users\User\OneDrive\Desktop\SJC\frontend\src\data\class 12\knowledge_enhanced.json"
    catalog1_path = r"c:\Users\User\OneDrive\Desktop\SJC\frontend\src\data\physicsClass12Catalog.js"
    catalog2_path = r"c:\Users\User\OneDrive\Desktop\SJC\frontend\src\data\physicsChapters9to14.js"

    with open(enhanced_path, 'r', encoding='utf-8') as f:
        enhanced_data = json.load(f)

    # Build a lookup map: topic_name -> description
    desc_map = {}
    for stream in enhanced_data.get('streams', []):
        for subject in stream.get('subjects', []):
            if subject.get('subject_name') == 'Physics':
                for chapter in subject.get('chapters', []):
                    for concept in chapter.get('concepts', []):
                        # Some concepts are strings, some are dicts
                        if isinstance(concept, dict):
                            desc_map[concept['topic_name']] = concept['description']

    def update_file(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        count = 0
        for topic, desc in desc_map.items():
            # Try matching with double quotes
            pattern1 = f'title: "{topic}"'
            if pattern1 in content and f'description: ' not in content[content.find(pattern1):content.find(pattern1)+200]:
                replacement1 = f'title: "{topic}",\n          description: {json.dumps(desc)}'
                content = content.replace(pattern1, replacement1)
                count += 1
            
            # Try matching with single quotes
            pattern2 = f"title: '{topic}'"
            if pattern2 in content and f'description: ' not in content[content.find(pattern2):content.find(pattern2)+200]:
                replacement2 = f"title: '{topic}',\n          description: {json.dumps(desc)}"
                content = content.replace(pattern2, replacement2)
                count += 1
                
            # Try matching with escaped apostrophes if any
            escaped_topic = topic.replace("'", "\\'")
            pattern3 = f"title: '{escaped_topic}'"
            if pattern3 in content and f'description: ' not in content[content.find(pattern3):content.find(pattern3)+200]:
                replacement3 = f"title: '{escaped_topic}',\n          description: {json.dumps(desc)}"
                content = content.replace(pattern3, replacement3)
                count += 1

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {path} with {count} descriptions.")

    update_file(catalog1_path)
    update_file(catalog2_path)

if __name__ == "__main__":
    merge_descriptions_v2()

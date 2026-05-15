
import json
import os
import re

def merge_descriptions():
    enhanced_path = r"c:\Users\User\OneDrive\Desktop\SJC\frontend\src\data\class 12\knowledge_enhanced.json"
    catalog1_path = r"c:\Users\User\OneDrive\Desktop\SJC\frontend\src\data\physicsClass12Catalog.js"
    catalog2_path = r"c:\Users\User\OneDrive\Desktop\SJC\frontend\src\data\physicsChapters9to14.js"

    with open(enhanced_path, 'r', encoding='utf-8') as f:
        enhanced_data = json.load(f)

    # Build a lookup map: (chapter_no, topic_name_lower) -> description
    desc_map = {}
    for subject in enhanced_data['streams'][0]['subjects']:
        if subject['subject_name'] == 'Physics':
            for chapter in subject['chapters']:
                ch_no = chapter['chapter_no']
                for concept in chapter['concepts']:
                    topic_name = concept['topic_name'].lower().strip()
                    desc_map[(ch_no, topic_name)] = concept['description']

    def update_catalog_content(content):
        # We need to find topics in the JS code and insert descriptions.
        # Topics are usually inside a chapter's 'topics' array.
        # Example: { id: 't1-1', title: 'Electric Charge', ... }
        
        # This is tricky with regex. Let's try a simpler approach:
        # We'll split by chapters and then by topics.
        
        # Find chapter number first
        chapters = re.split(r'number:\s*(\d+)', content)
        new_content = chapters[0]
        
        for i in range(1, len(chapters), 2):
            ch_no = int(chapters[i])
            ch_body = chapters[i+1]
            
            # Now find topics in this chapter body
            # Topic titles are usually in 'title: "..."'
            topic_splits = re.split(r'title:\s*[\'"]([^\'"]+)[\'"]', ch_body)
            new_ch_body = topic_splits[0]
            
            for j in range(1, len(topic_splits), 2):
                title = topic_splits[j]
                title_clean = title.lower().strip()
                remainder = topic_splits[j+1]
                
                # Check if we have a description for this topic
                desc = desc_map.get((ch_no, title_clean))
                if not desc:
                    # Try partial match or fuzzy?
                    # Some titles in catalog might be slightly different
                    # e.g. "Gauss’s Law" vs "Gauss Law"
                    fuzzy_title = title_clean.replace("’s", "").replace("'s", "").replace("-", " ")
                    for (m_ch, m_title), m_desc in desc_map.items():
                        if m_ch == ch_no:
                            m_title_clean = m_title.replace("’s", "").replace("'s", "").replace("-", " ")
                            if m_title_clean == fuzzy_title:
                                desc = m_desc
                                break

                # Insert description after title
                if desc:
                    # Clean up description for JS (escape quotes)
                    safe_desc = desc.replace('"', '\\"').replace('\n', '\\n')
                    # We want to insert it like: title: "...", description: "...",
                    new_ch_body += f'title: "{title}",\n      description: "{safe_desc}",'
                else:
                    new_ch_body += f'title: "{title}"'
                
                new_ch_body += remainder
            
            new_content += f'number: {ch_no}' + new_ch_body
            
        return new_content

    # Update Catalog 1
    with open(catalog1_path, 'r', encoding='utf-8') as f:
        content1 = f.read()
    new_content1 = update_catalog_content(content1)
    with open(catalog1_path, 'w', encoding='utf-8') as f:
        f.write(new_content1)
    print(f"Updated {catalog1_path}")

    # Update Catalog 2
    with open(catalog2_path, 'r', encoding='utf-8') as f:
        content2 = f.read()
    new_content2 = update_catalog_content(content2)
    with open(catalog2_path, 'w', encoding='utf-8') as f:
        f.write(new_content2)
    print(f"Updated {catalog2_path}")

if __name__ == "__main__":
    merge_descriptions()

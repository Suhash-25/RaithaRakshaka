import os
import json
import time
import google.generativeai as genai

import sys
sys.stdout.reconfigure(encoding='utf-8')

# Configure Gemini
genai.configure(api_key="AIzaSyDz9HaAVTlnWLNERMoRU_iYNVPuaqSJUS0")

model = genai.GenerativeModel("gemini-flash-latest", generation_config={"response_mime_type": "application/json"})

def generate_descriptions(subject, class_level, topics):
    prompt = f"""You are an expert Academic Content Generation AI specialized in K-12 Education Content Engineering.
Your task is to generate a highly detailed, exam-ready description for each topic in a given list.

Subject: {subject}
Class Level: Class {class_level}

Requirements for each description:
1. Target length: Minimum 2 paragraphs, Preferred 3-4 paragraphs.
2. Must contain:
   - Introduction
   - Detailed educational explanation
   - Examples
   - Real-world understanding
   - Educational clarity
3. Keep it student-friendly and easy to understand for Class {class_level}.
4. Use '\n\n' to separate paragraphs in the JSON string.
5. You must return the output ONLY as a valid JSON array of strings. Do not include any markdown formatting like ```json.

Rules for subject depth:
- Mathematics: Include formula (if applicable), shortcuts, rules, concept explanation, real-life application, problem-solving approach.
- Science: Include definitions, scientific explanation, key concepts, formula/reactions.
- English/Hindi/Kannada/Sanskrit/Literature: Include short summary, main theme, character explanation, moral/value, central idea for poems.
- Social Science: Include historical significance, dates, leaders, concepts.
- EVS: Include environment awareness, daily life connection.

IMPORTANT:
- Do NOT repeat the topic name unnecessarily.
- Do NOT use markdown formatting, HTML, bullet symbols, or AI disclaimers.
- Produce highly accurate, conceptually strong, exam-oriented descriptions.

Input Topics:
{json.dumps(topics, indent=2)}

You MUST return a JSON array of strings exactly matching the number of input topics. Each string should be the description for the corresponding topic in the input array.
[
  "Description for topic 1...",
  "Description for topic 2...",
  ...
]
"""
    retries = 3
    for attempt in range(retries):
        try:
            response = model.generate_content(prompt)
            descriptions = json.loads(response.text)
            if len(descriptions) != len(topics):
                print(f"Warning: Expected {len(topics)} descriptions but got {len(descriptions)}. Attempt {attempt+1}/{retries}", flush=True)
                if attempt == retries - 1:
                    while len(descriptions) < len(topics):
                        descriptions.append("Description not available.")
                    return descriptions[:len(topics)]
                time.sleep(2)
                continue
            return descriptions
        except Exception as e:
            print(f"Error generating content: {e}. Attempt {attempt+1}/{retries}", flush=True)
            time.sleep(2)
            if attempt == retries - 1:
                return ["Description generation failed due to API error."] * len(topics)

def process_file(file_path):
    print(f"Processing {file_path}...", flush=True)
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    class_level = data.get("class", "Unknown")

    for subject in data.get("subjects", []):
        subject_name = subject.get("subject_name", "General")
        for concept in subject.get("concepts", []):
            topics = concept.get("topics", [])
            # Filter string topics
            string_topics = [t for t in topics if isinstance(t, str)]
            if not string_topics:
                continue
                
            print(f"  -> Generating for {len(string_topics)} topics in {subject_name} / {concept.get('unit', 'Unknown')}...", flush=True)
            
            # Batch call for the topics (if more than 20, we can chunk it, but let's assume they are small)
            chunk_size = 15
            all_descriptions = []
            for i in range(0, len(string_topics), chunk_size):
                chunk = string_topics[i:i+chunk_size]
                chunk_desc = generate_descriptions(subject_name, class_level, chunk)
                all_descriptions.extend(chunk_desc)
                time.sleep(1.5) # rate limiting
            
            # Replace topics
            new_topics = []
            desc_index = 0
            for t in topics:
                if isinstance(t, str):
                    new_topics.append({
                        "topic_name": t,
                        "description": all_descriptions[desc_index]
                    })
                    desc_index += 1
                else:
                    new_topics.append(t)
            concept["topics"] = new_topics
            
    # Save to enhanced file
    dir_name = os.path.dirname(file_path)
    base_name = os.path.basename(file_path)
    new_name = base_name.replace(".json", "_enhanced.json")
    new_path = os.path.join(dir_name, new_name)
    
    with open(new_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {new_path}\n", flush=True)

def main():
    root_dir = r"C:\DICKEN-BAGRECHA\Local Disk (D)\Hackathons\SJCIT\PragnaVistara\git_clone\AV26-104\data"
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith(".json") and not filename.endswith("_enhanced.json"):
                file_path = os.path.join(dirpath, filename)
                process_file(file_path)

if __name__ == "__main__":
    main()

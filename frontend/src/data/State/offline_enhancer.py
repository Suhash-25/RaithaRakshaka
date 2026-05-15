import json
import os
import random

def get_rich_description(subject, unit, topic, seed_val):
    random.seed(seed_val)
    
    # Intros
    intros = [
        f"The study of {topic} forms a cornerstone of our understanding in {subject}, particularly within the domain of {unit}. This topic introduces fundamental concepts that bridge theoretical knowledge with practical, everyday applications. Developing a strong grasp of these principles early on sets the stage for advanced learning.",
        f"Diving into {topic} within the context of {unit} offers students a fascinating look at the mechanisms that drive {subject}. It is not just about memorizing facts, but about comprehending the underlying patterns that make up this field of study. Mastery of this area is essential for building a robust educational foundation.",
        f"In the realm of {subject}, the concept of {topic} stands out as a critical building block. Associated with {unit}, this subject matter encourages analytical thinking and deeper cognitive engagement. Students exploring this topic will discover how interconnected and structured our learning systems truly are."
    ]
    
    # Body
    bodies = {
        "Mathematics": [
            f"At its core, {topic} involves understanding numerical relationships and spatial logic. When students engage with {unit}, they learn to decode complex problems by breaking them down into manageable steps. This involves identifying variables, applying established theorems, and verifying outcomes through rigorous calculation. This structured approach fosters a mindset oriented towards problem-solving.",
            f"The mechanics of {topic} require a systematic approach to numbers and patterns. By focusing on {unit}, learners are equipped with the analytical tools needed to quantify the world around them. Whether it's through geometric visualization or algebraic manipulation, the logical sequencing learned here is universally applicable."
        ],
        "English": [
            f"Within English language and literature, {topic} plays a pivotal role in enhancing communication and comprehension. As part of {unit}, it focuses on the nuances of expression, structural grammar, and vocabulary expansion. Students learn not just to read, but to interpret and articulate complex ideas effectively.",
            f"Focusing on {topic} enriches a student's linguistic capabilities. Under the umbrella of {unit}, this topic explores the mechanics of language, teaching students how to construct meaningful sentences, understand phonetic structures, and appreciate the art of storytelling and communication."
        ],
        "Environmental Studies": [
            f"Exploring {topic} provides vital insights into our natural and social ecosystems. Within the scope of {unit}, students learn about the delicate balance of nature, human interaction with the environment, and the importance of sustainability. This knowledge is crucial for fostering environmentally conscious citizens.",
            f"The environmental significance of {topic} cannot be overstated. By studying {unit}, learners develop an awareness of their surroundings, recognizing the interdependencies between flora, fauna, and human societies. This holistic view encourages responsible behavior and ecological stewardship."
        ]
    }
    
    # Default body for other subjects
    default_body = [
        f"Understanding the core elements of {topic} requires focused attention on its primary characteristics within {unit}. Students engage in comprehensive learning that encompasses both theoretical definitions and practical implications. This structured learning pathway ensures a deep and lasting comprehension of the subject material.",
        f"The detailed examination of {topic} reveals the intricate layers of {unit}. Through guided study, students unpack complex concepts, translating them into easily digestible pieces of knowledge. This process is essential for achieving academic excellence and conceptual clarity."
    ]
    
    # Examples
    examples = [
        f"For instance, consider how {topic} manifests in daily life. Whether you are organizing objects, measuring spaces, or simply observing nature, the principles of {unit} are actively at play. This practical manifestation makes the theoretical aspects much more tangible and easier to grasp.",
        f"A real-world example of {topic} can be seen in everyday problem-solving scenarios. When faced with a challenge related to {unit}, applying the structured methods learned in this topic allows for quick and accurate resolutions, demonstrating the immense value of this knowledge.",
        f"To illustrate, observing the application of {topic} in practical environments highlights its importance. The concepts from {unit} are not just academic exercises; they are tools used by professionals and individuals every day to navigate and make sense of complex systems."
    ]
    
    # Conclusion
    conclusions = [
        f"In summary, mastering {topic} empowers students with the confidence and skills necessary to excel in {subject}. The journey through {unit} guarantees a comprehensive educational experience that goes far beyond the classroom.",
        f"Ultimately, the knowledge gained from studying {topic} serves as a lifelong intellectual asset. By thoroughly understanding {unit}, learners are well-prepared to tackle future academic challenges with resilience and competence.",
        f"To conclude, {topic} is an indispensable part of the {subject} curriculum. The insights developed during the exploration of {unit} will continually support a student's academic and personal growth."
    ]
    
    # Localized Templates for Kannada
    kannada_intros = [
        f"{subject} ವಿಷಯದಲ್ಲಿ {topic} ಒಂದು ಪ್ರಮುಖ ಘಟಕವಾಗಿದೆ. ಇದು {unit} ವಿಭಾಗದ ಅಡಿಯಲ್ಲಿ ಬರುತ್ತದೆ. ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಇದು ಮೂಲಭೂತ ಜ್ಞಾನವನ್ನು ನೀಡುತ್ತದೆ.",
        f"{topic} ಅಧ್ಯಯನವು {subject} ಕಲಿಯುವಲ್ಲಿ ಅತ್ಯಂತ ಮಹತ್ವದ್ದಾಗಿದೆ. {unit} ವಿಭಾಗದಲ್ಲಿ ಬರುವ ಈ ವಿಷಯವು ನಮ್ಮ ದೈನಂದಿನ ಜೀವನದೊಂದಿಗೆ ನೇರ ಸಂಬಂಧ ಹೊಂದಿದೆ."
    ]
    kannada_bodies = [
        f"{topic} ಪರಿಕಲ್ಪನೆಯು ಮುಖ್ಯವಾಗಿ {unit} ನ ತತ್ವಗಳನ್ನು ವಿವರಿಸುತ್ತದೆ. ಇದರ ಮೂಲಕ ವಿದ್ಯಾರ್ಥಿಗಳು ವಿಷಯದ ಆಳವಾದ ಅರ್ಥವನ್ನು ಕಂಡುಕೊಳ್ಳಬಹುದು.",
        f"ಈ ವಿಷಯದಲ್ಲಿ, ನಾವು {topic} ನ ವಿವಿಧ ಮಗ್ಗಲುಗಳನ್ನು ಕಲಿಯುತ್ತೇವೆ. {subject} ಯಲ್ಲಿ ಇದು ಒಂದು ಪ್ರಮುಖ ಮೈಲುಗಲ್ಲು."
    ]
    kannada_examples = [
        f"ಉದಾಹರಣೆಗೆ, {topic} ಅನ್ನು ನಮ್ಮ ಸುತ್ತಲಿನ ಪರಿಸರದಲ್ಲಿ ನಾವು ಸುಲಭವಾಗಿ ಕಾಣಬಹುದು.",
        f"{topic} ನ ನೈಜ-ಪ್ರಪಂಚದ ಅನ್ವಯಗಳು ನಮಗೆ {unit} ನ ಪ್ರಾಮುಖ್ಯತೆಯನ್ನು ತಿಳಿಸಿಕೊಡುತ್ತವೆ."
    ]
    kannada_conclusions = [
        f"ಒಟ್ಟಾರೆಯಾಗಿ, {topic} ಬಗ್ಗೆ ಅರಿಯುವುದು ಭವಿಷ್ಯದ ಕಲಿಕೆಗೆ ಭದ್ರ ಬುನಾದಿಯಾಗಿದೆ.",
        f"ಈ ಅಧ್ಯಾಯದ ಮೂಲಕ {topic} ನ ಸಂಪೂರ್ಣ ಅರಿವು ನಮಗೆ ಲಭ್ಯವಾಗುತ್ತದೆ."
    ]
    
    # Localized Templates for Hindi
    hindi_intros = [
        f"{subject} विषय में {topic} एक बहुत ही महत्वपूर्ण अध्याय है। यह {unit} इकाई के अंतर्गत आता है और छात्रों को बुनियादी ज्ञान प्रदान करता है।",
        f"{topic} का अध्ययन {subject} सीखने में अत्यंत महत्वपूर्ण है। {unit} में आने वाला यह विषय हमारे दैनिक जीवन से सीधा संबंध रखता है।"
    ]
    hindi_bodies = [
        f"{topic} की अवधारणा मुख्य रूप से {unit} के सिद्धांतों की व्याख्या करती है। इसके माध्यम से छात्र विषय का गहरा अर्थ खोज सकते हैं।",
        f"इस विषय में, हम {topic} के विभिन्न पहलुओं को सीखते हैं। {subject} में यह एक प्रमुख मील का पत्थर है।"
    ]
    hindi_examples = [
        f"उदाहरण के लिए, हम {topic} को अपने आस-पास के वातावरण में आसानी से देख सकते हैं।",
        f"{topic} के वास्तविक दुनिया के अनुप्रयोग हमें {unit} के महत्व को बताते हैं।"
    ]
    hindi_conclusions = [
        f"कुल मिलाकर, {topic} के बारे में जानना भविष्य के सीखने के लिए एक मजबूत नींव है।",
        f"इस अध्याय के माध्यम से {topic} की पूरी समझ हमें प्राप्त होती है।"
    ]

    if subject == "Kannada":
        intro = random.choice(kannada_intros)
        body = random.choice(kannada_bodies)
        example = random.choice(kannada_examples)
        conclusion = random.choice(kannada_conclusions)
    elif subject == "Hindi":
        intro = random.choice(hindi_intros)
        body = random.choice(hindi_bodies)
        example = random.choice(hindi_examples)
        conclusion = random.choice(hindi_conclusions)
    else:
        intro = random.choice(intros)
        body = random.choice(bodies.get(subject, default_body))
        example = random.choice(examples)
        conclusion = random.choice(conclusions)
    
    return f"{intro}\n\n{body}\n\n{example}\n\n{conclusion}"

def generate_si_units(subject, topic):
    if subject == "Mathematics" and "Length" in topic or "Short" in topic:
        return ["Length -> Meter (m)", "Weight -> Kilogram (kg)"]
    if subject == "Environmental Studies" and "Weather" in topic:
        return ["Temperature -> Celsius (°C)"]
    return []

def generate_formulas(subject, topic):
    if subject == "Mathematics":
        if "Addition" in topic: return ["a + b = c (Sum)"]
        if "Subtraction" in topic: return ["a - b = c (Difference)"]
        if "Rectangle" in topic: return ["Area = length × width", "Perimeter = 2(length + width)"]
        if "Square" in topic: return ["Area = side × side", "Perimeter = 4 × side"]
    return []

def generate_tricks(subject, topic):
    if subject == "Mathematics":
        return ["Use your fingers for counting up to 10.", "Group objects in pairs to count faster."]
    if subject == "English":
        return ["A, E, I, O, U are vowels. Remember: 'An Elephant Is Over Under'.", "Capitalize the first letter of a sentence."]
    if "Planets" in topic or "Space" in topic:
        return ["My Very Educated Mother Just Served Us Noodles (Mars, Venus, Earth, Mercury, Jupiter, Saturn, Uranus, Neptune)"]
    return ["Read the concept aloud three times to memorize.", "Draw a picture related to the topic."]

def generate_methods(subject, topic):
    if subject == "Mathematics":
        return ["Identify the numbers.", "Determine the operation (+ or -).", "Calculate the result.", "Verify the answer."]
    return ["Read the text carefully.", "Identify key terms.", "Relate to real-world objects.", "Practice writing."]

def generate_key_points(topic):
    return [
        f"{topic} is essential for basic understanding.",
        f"It forms the foundation for advanced concepts.",
        f"Regular practice ensures long-term retention."
    ]

def generate_remember_this(topic):
    return [
        f"Always revise {topic} before exams.",
        "Connect this topic to everyday activities for better understanding."
    ]

def enhance_topic_list(topics, subject_name, unit_name):
    new_topics = []
    for t in topics:
        if isinstance(t, str):
            topic_name = t
        else:
            topic_name = t.get("topic_name", "Unknown")
            
        seed_val = hash(f"{subject_name}_{unit_name}_{topic_name}")
        new_topic = {
            "topic_name": topic_name,
            "description": get_rich_description(subject_name, unit_name, topic_name, seed_val),
            "key_points": generate_key_points(topic_name),
            "formulas": generate_formulas(subject_name, topic_name),
            "si_units": generate_si_units(subject_name, topic_name),
            "methods": generate_methods(subject_name, topic_name),
            "shortcut_tricks": generate_tricks(subject_name, topic_name),
            "remember_this": generate_remember_this(topic_name),
            "difficulty": "foundation",
            "estimated_read_time": "5 min"
        }
        new_topics.append(new_topic)
    return new_topics

def process_offline(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    subjects_list = data.get("subjects", [])
    if not subjects_list and "streams" in data:
        for stream in data.get("streams", []):
            subjects_list.extend(stream.get("subjects", []))
            
    for subject in subjects_list:
        subject_name = subject.get("subject_name", "General")
        
        # Process concepts (some subjects have concepts -> topics directly, or topics directly inside concepts like class 12)
        for concept in subject.get("concepts", []):
            if not isinstance(concept, dict): continue
            unit = concept.get("unit", "Unit")
            if "topics" in concept:
                concept["topics"] = enhance_topic_list(concept["topics"], subject_name, unit)
                
        # Process parts -> chapters
        for part in subject.get("parts", []):
            if not isinstance(part, dict): continue
            for chapter in part.get("chapters", []):
                if not isinstance(chapter, dict): continue
                unit = chapter.get("chapter_name", chapter.get("title", "Unit"))
                if "topics" in chapter:
                    chapter["topics"] = enhance_topic_list(chapter["topics"], subject_name, unit)
                elif "concepts" in chapter: # Class 12 uses concepts instead of topics
                    chapter["concepts"] = enhance_topic_list(chapter["concepts"], subject_name, unit)
                    
        # Process chapters (if direct children of subject)
        for chapter in subject.get("chapters", []):
            if not isinstance(chapter, dict):
                # Handle array of strings directly in chapters
                if isinstance(chapter, str):
                    if "topics" not in subject:
                        subject["topics"] = []
                    subject["topics"].append(chapter)
                continue
            unit = chapter.get("chapter_name", chapter.get("title", "Unit"))
            if "topics" in chapter:
                chapter["topics"] = enhance_topic_list(chapter["topics"], subject_name, unit)
            elif "concepts" in chapter:
                chapter["concepts"] = enhance_topic_list(chapter["concepts"], subject_name, unit)
                
        # Process sections (Social Science style)
        for section in subject.get("sections", []):
            if not isinstance(section, dict): continue
            unit = section.get("section_name", "Unit")
            if "chapters" in section:
                # Some sections just have an array of string chapters, which we should enhance
                section["chapters"] = enhance_topic_list(section["chapters"], subject_name, unit)
                
        # if the subject itself gathered topics from string chapters
        if "topics" in subject and isinstance(subject["topics"], list) and len(subject["topics"]) > 0 and isinstance(subject["topics"][0], str):
            subject["topics"] = enhance_topic_list(subject["topics"], subject_name, "Unit")
            
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully processed locally and saved to {output_file}")

def main():
    root_dir = r"C:\DICKEN-BAGRECHA\Local Disk (D)\Hackathons\SJCIT\PragnaVistara\git_clone\AV26-104\data"
    
    # Process classes 1 to 12 sequentially
    for class_num in range(1, 13):
        folder = os.path.join(root_dir, f"class {class_num}")
        if not os.path.exists(folder):
            continue
            
        input_file = os.path.join(folder, "knowledge.json")
        output_file = os.path.join(folder, "knowledge_enhanced.json")
        
        if os.path.exists(input_file):
            print(f"Processing Class {class_num}...")
            process_offline(input_file, output_file)
            
            # Since user wants this to be directly available in frontend,
            # Let's also copy it to the frontend's public/syllabus_data directory
            frontend_dir = r"C:\DICKEN-BAGRECHA\Local Disk (D)\Hackathons\SJCIT\PragnaVistara\frontend\public\syllabus_data"
            dest_folder = os.path.join(frontend_dir, f"class {class_num}")
            os.makedirs(dest_folder, exist_ok=True)
            dest_file = os.path.join(dest_folder, "knowledge_enhanced.json")
            
            with open(dest_file, 'w', encoding='utf-8') as f_out:
                with open(output_file, 'r', encoding='utf-8') as f_in:
                    f_out.write(f_in.read())
            print(f"Copied Class {class_num} enhanced JSON to frontend public dir.")

if __name__ == "__main__":
    main()

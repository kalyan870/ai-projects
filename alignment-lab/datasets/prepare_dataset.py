import json
import random
from typing import List, Dict, Any

SAMPLE_DATA = [
    {
        "prompt": "What is the best programming language for beginners?",
        "chosen": "Python is widely recommended for beginners because of its simple syntax, readability, and vast community. It's used in web development, data science, and automation, making it versatile for learning programming concepts.",
        "rejected": "C++ is the best because it teaches you low-level memory management from the start."
    },
    {
        "prompt": "Explain how the internet works in simple terms.",
        "chosen": "The internet is a global network of computers connected by cables and wireless signals. When you visit a website, your computer sends a request through your router to your ISP's servers, which route it to the website's server. The server sends back data that your browser displays as a webpage.",
        "rejected": "It's complicated. Just know that you type a URL and a page appears. The technical details are too complex for most people."
    },
    {
        "prompt": "How do I improve my problem-solving skills?",
        "chosen": "Practice consistently with varied problems, break down complex problems into smaller parts, learn multiple approaches to the same problem, review and reflect on your solutions, and study how others solve problems. Start with easier problems and gradually increase difficulty.",
        "rejected": "Just do more problems. Quantity over quality. The more you do, the better you get automatically."
    },
    {
        "prompt": "What's the difference between AI and Machine Learning?",
        "chosen": "AI (Artificial Intelligence) is the broad field of creating machines that can perform tasks requiring human intelligence. Machine Learning is a subset of AI where systems learn from data rather than being explicitly programmed. So all ML is AI, but not all AI is ML. Deep Learning is a further subset of ML using neural networks.",
        "rejected": "They're basically the same thing. AI is just the fancy term companies use for marketing."
    },
    {
        "prompt": "How do I start a career in data science?",
        "chosen": "Start by learning Python and statistics fundamentals. Practice with SQL for data manipulation. Learn data visualization with tools like Matplotlib and Tableau. Build a portfolio with real datasets from Kaggle. Study machine learning basics and complete a capstone project. Network on LinkedIn and contribute to open-source data projects.",
        "rejected": "Get a master's degree in data science. You can't get a job without a formal education in the field."
    }
]

def create_preference_dataset(output_path: str = "datasets/preference_pairs.jsonl"):
    with open(output_path, "w") as f:
        for item in SAMPLE_DATA:
            f.write(json.dumps(item) + "\n")
    print(f"Created {len(SAMPLE_DATA)} preference pairs at {output_path}")

def create_dpo_dataset(output_path: str = "datasets/dpo_data.jsonl"):
    dpo_data = []
    for item in SAMPLE_DATA:
        dpo_data.append({
            "prompt": item["prompt"],
            "chosen": item["chosen"],
            "rejected": item["rejected"]
        })
    with open(output_path, "w") as f:
        for item in dpo_data:
            f.write(json.dumps(item) + "\n")
    print(f"Created {len(dpo_data)} DPO samples at {output_path}")

def augment_dataset(base_data: List[Dict], num_augmentations: int = 50) -> List[Dict]:
    augmented = []
    for item in base_data:
        for _ in range(num_augmentations // len(base_data)):
            noise = random.uniform(0.9, 1.1)
            augmented.append({
                "prompt": item["prompt"],
                "chosen": item["chosen"],
                "rejected": item["rejected"],
                "weight": round(noise, 2)
            })
    return augmented

if __name__ == "__main__":
    create_preference_dataset()
    create_dpo_dataset()

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer, Trainer, TrainingArguments
from datasets import Dataset
import json

class RewardModelTrainer:
    def __init__(self, model_name: str = "microsoft/phi-2"):
        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    def load_model(self):
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=True)
        self.tokenizer.pad_token = self.tokenizer.eos_token

        self.model = AutoModelForSequenceClassification.from_pretrained(
            self.model_name,
            num_labels=1,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            trust_remote_code=True
        ).to(self.device)

    def prepare_dataset(self, data_path: str):
        samples = []
        with open(data_path, "r") as f:
            for line in f:
                samples.append(json.loads(line))

        texts = []
        labels = []
        for s in samples:
            texts.append(f"Prompt: {s['prompt']}\nResponse: {s['chosen']}")
            labels.append(1.0)
            texts.append(f"Prompt: {s['prompt']}\nResponse: {s['rejected']}")
            labels.append(0.0)

        dataset = Dataset.from_dict({"text": texts, "label": labels})

        def tokenize(examples):
            tokens = self.tokenizer(
                examples["text"],
                truncation=True,
                padding="max_length",
                max_length=512
            )
            tokens["labels"] = examples["label"]
            return tokens

        return dataset.map(tokenize, batched=True)

    def train(self, data_path: str, output_dir: str = "checkpoints/reward_model", epochs: int = 3):
        self.load_model()
        dataset = self.prepare_dataset(data_path)

        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=epochs,
            per_device_train_batch_size=4,
            gradient_accumulation_steps=4,
            warmup_steps=100,
            logging_steps=10,
            save_steps=500,
            fp16=self.device == "cuda",
            report_to="none"
        )

        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=dataset,
            tokenizer=self.tokenizer
        )

        trainer.train()
        trainer.save_model(output_dir)
        self.tokenizer.save_pretrained(output_dir)

        return output_dir

    def score(self, prompt: str, response: str) -> float:
        text = f"Prompt: {prompt}\nResponse: {response}"
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512).to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
        return torch.sigmoid(outputs.logits).item()

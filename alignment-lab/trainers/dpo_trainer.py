import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import DPOTrainer, DPOConfig
from datasets import Dataset
import json
from peft import LoraConfig

class DPOTrainerWrapper:
    def __init__(self, model_name: str = "microsoft/phi-2"):
        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    def load_model(self):
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=True)
        self.tokenizer.pad_token = self.tokenizer.eos_token

        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            trust_remote_code=True
        )
        self.ref_model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            trust_remote_code=True
        )

    def prepare_dataset(self, data_path: str):
        samples = []
        with open(data_path, "r") as f:
            for line in f:
                samples.append(json.loads(line))

        return Dataset.from_list([
            {
                "prompt": s["prompt"],
                "chosen": s["chosen"],
                "rejected": s["rejected"]
            }
            for s in samples
        ])

    def train(self, data_path: str, output_dir: str = "checkpoints/dpo"):
        self.load_model()
        dataset = self.prepare_dataset(data_path)

        peft_config = LoraConfig(
            r=8,
            lora_alpha=16,
            target_modules=["q_proj", "v_proj"],
            lora_dropout=0.05,
            bias="none",
        )

        training_args = DPOConfig(
            output_dir=output_dir,
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            num_train_epochs=3,
            logging_steps=10,
            save_steps=500,
            fp16=self.device == "cuda",
            report_to="none",
            beta=0.1,
            max_length=512,
            max_prompt_length=128
        )

        dpo_trainer = DPOTrainer(
            model=self.model,
            ref_model=self.ref_model,
            args=training_args,
            train_dataset=dataset,
            tokenizer=self.tokenizer,
            peft_config=peft_config,
        )

        dpo_trainer.train()
        dpo_trainer.save_model(output_dir)
        self.tokenizer.save_pretrained(output_dir)

        return output_dir

    def generate(self, prompt: str, max_length: int = 200) -> str:
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
        outputs = self.model.generate(
            **inputs,
            max_new_tokens=max_length,
            temperature=0.7,
            do_sample=True
        )
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)

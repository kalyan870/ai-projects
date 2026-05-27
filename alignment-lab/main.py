import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datasets.prepare_dataset import create_preference_dataset, create_dpo_dataset
from trainers.sft_trainer import SFTTrainer
from trainers.dpo_trainer import DPOTrainerWrapper
from trainers.reward_trainer import RewardModelTrainer
from evaluations.benchmark import AlignmentBenchmark

def main():
    print("=" * 60)
    print("ALIGNMENT LAB - RLHF/DPO Training Pipeline")
    print("=" * 60)

    print("\n[1/4] Preparing datasets...")
    create_preference_dataset("datasets/preference_pairs.jsonl")
    create_dpo_dataset("datasets/dpo_data.jsonl")

    print("\n[2/4] Running Supervised Fine-Tuning (SFT)...")
    sft = SFTTrainer()
    sft_path = sft.train("datasets/preference_pairs.jsonl", "checkpoints/sft")
    print(f"  SFT model saved to: {sft_path}")

    print("\n[3/4] Training Reward Model...")
    rm = RewardModelTrainer()
    rm_path = rm.train("datasets/preference_pairs.jsonl", "checkpoints/reward_model")
    print(f"  Reward model saved to: {rm_path}")

    print("\n[4/4] Running DPO Training...")
    dpo = DPOTrainerWrapper()
    dpo_path = dpo.train("datasets/dpo_data.jsonl", "checkpoints/dpo")
    print(f"  DPO model saved to: {dpo_path}")

    print("\nEvaluating models...")
    benchmark = AlignmentBenchmark()

    def sft_generate(prompt):
        sft.model_name = "checkpoints/sft"
        sft.load_model()
        return sft.generate(prompt)

    eval_results = benchmark.evaluate_helpfulness(sft_generate)
    print(f"\nResults: {json.dumps(eval_results, indent=2)}")

    print("\n" + "=" * 60)
    print("ALIGNMENT LAB - Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()

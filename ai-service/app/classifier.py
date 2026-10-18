"""
CropCare AI - Neural Network Disease Classifier & Uncertainty Engine
Executes convolutional network inference, softmax probability estimation,
Shannon entropy computation, and calibrated confidence-based prediction rejection.
"""

import os
import json
import math
from typing import Dict, Any, List, Optional
import numpy as np
from PIL import Image

from .taxonomy import TAXONOMY, CLASS_NAMES, NUM_CLASSES, INDEX_TO_CLASS
from .preprocessing import preprocess_for_inference

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
DEFAULT_CHECKPOINT_PATH = os.path.join(MODEL_DIR, "cropcare_model.pt")
DEFAULT_META_PATH = os.path.join(MODEL_DIR, "model_meta.json")

class DiseaseClassifier:
    def __init__(self, checkpoint_path: Optional[str] = None):
        self.checkpoint_path = checkpoint_path or os.getenv("MODEL_CHECKPOINT_PATH", DEFAULT_CHECKPOINT_PATH)
        self.meta_path = os.getenv("MODEL_METADATA_PATH", DEFAULT_META_PATH)
        self.model = None
        self.device = "cpu"
        self.confidence_threshold = float(os.getenv("CONFIDENCE_THRESHOLD", "0.65"))
        self.entropy_threshold = float(os.getenv("UNCERTAINTY_ENTROPY_LIMIT", "1.20"))
        self.metadata = {}
        self.load_model()

    def load_model(self):
        """Attempts to load PyTorch checkpoint and metadata if available."""
        if os.path.exists(self.meta_path):
            try:
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                print(f"[Classifier] Failed reading metadata: {e}")

        if not os.path.exists(self.checkpoint_path):
            print(f"[Classifier] Notice: Model checkpoint not found at {self.checkpoint_path}.")
            print("Classifier will report untrained/unavailable status until python train.py is executed.")
            self.model = None
            return

        try:
            import torch
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"[Classifier] Loading PyTorch model from {self.checkpoint_path} on {self.device}...")
            
            # Load weights
            checkpoint = torch.load(self.checkpoint_path, map_location=self.device)
            # If model instance was saved or state_dict
            if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                # Reconstruct MobileNetV2 architecture with NUM_CLASSES
                from torchvision import models
                import torch.nn as nn
                net = models.mobilenet_v2(weights=None)
                net.classifier[1] = nn.Linear(net.classifier[1].in_features, NUM_CLASSES)
                net.load_state_dict(checkpoint["state_dict"])
                self.model = net
            else:
                self.model = checkpoint

            if hasattr(self.model, "eval"):
                self.model.eval()
            print("[Classifier] Checkpoint successfully loaded.")
        except Exception as e:
            print(f"[Classifier] Error loading PyTorch checkpoint: {e}")
            self.model = None

    def is_loaded(self) -> bool:
        return self.model is not None

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "checkpointLoaded": self.is_loaded(),
            "checkpointPath": self.checkpoint_path,
            "device": self.device,
            "modelVersion": self.metadata.get("version", "mobilenet_v2_v1_baseline"),
            "architecture": self.metadata.get("architecture", "MobileNetV2 Transfer Learning"),
            "numClasses": NUM_CLASSES,
            "supportedClasses": CLASS_NAMES,
            "confidenceThreshold": self.confidence_threshold,
            "entropyThreshold": self.entropy_threshold,
        }

    def predict(self, image: Image.Image, crop_hint: Optional[str] = None) -> Dict[str, Any]:
        """
        Runs model inference with uncertainty estimation and prediction rejection.
        Never fabricates predictions if model is unavailable.
        """
        if not self.is_loaded():
            return {
                "isAvailable": False,
                "modelVersion": "untrained",
                "topClass": "model_unavailable",
                "topDisplayName": "Model Checkpoint Not Trained",
                "confidence": 0.0,
                "entropy": 0.0,
                "accepted": False,
                "reviewReason": (
                    "Model checkpoint has not been trained or loaded yet. "
                    "Please run 'python ai-service/training/train.py' to produce the model weights."
                ),
                "classProbabilities": [],
                "limitationsNotice": "Model is not trained. Human expert review required.",
            }

        try:
            import torch
            input_tensor = torch.from_numpy(preprocess_for_inference(image)).to(self.device)

            with torch.no_grad():
                logits = self.model(input_tensor)
                probs = torch.softmax(logits, dim=1).squeeze().cpu().numpy()

            # Format class probabilities
            class_probs: List[Dict[str, Any]] = []
            for i, prob in enumerate(probs):
                cname = INDEX_TO_CLASS[i]
                meta = TAXONOMY[cname]
                class_probs.append({
                    "className": cname,
                    "displayName": meta["display_name"],
                    "crop": meta["crop"],
                    "condition": meta["condition"],
                    "probability": round(float(prob), 4),
                    "isHealthy": meta["is_healthy"],
                })

            # Sort descending by probability
            class_probs.sort(key=lambda x: x["probability"], reverse=True)

            top_entry = class_probs[0]
            top_prob = top_entry["probability"]
            top_class = top_entry["className"]

            # Compute Shannon Entropy H = -sum(p * ln(p))
            entropy = float(-np.sum([p * math.log(max(p, 1e-12)) for p in probs]))

            # Calibrated rejection logic (Hypothesis H2)
            accepted = True
            review_reason = None

            if top_prob < self.confidence_threshold:
                accepted = False
                review_reason = (
                    f"Low confidence warning: Maximum prediction confidence ({top_prob:.1%}) "
                    f"is below safety threshold ({self.confidence_threshold:.0%}). "
                    "Case flagged for agricultural expert review."
                )
            elif entropy > self.entropy_threshold:
                accepted = False
                review_reason = (
                    f"High prediction entropy ({entropy:.2f} > {self.entropy_threshold:.2f}). "
                    "Multiple disease classes exhibit similar probability distributions. "
                    "Human expert referral recommended."
                )

            return {
                "isAvailable": True,
                "modelVersion": self.metadata.get("version", "mobilenet_v2_v1"),
                "topClass": top_class,
                "topDisplayName": top_entry["displayName"],
                "confidence": round(top_prob, 4),
                "entropy": round(entropy, 4),
                "accepted": accepted,
                "reviewReason": review_reason,
                "classProbabilities": class_probs,
                "limitationsNotice": (
                    "Decision-support output. Model is evaluated on field photography with out-of-distribution "
                    "rejection enabled. Consult an agronomist before initiating chemical interventions."
                ),
                "device": self.device,
            }
        except Exception as e:
            return {
                "isAvailable": False,
                "modelVersion": "error",
                "topClass": "inference_error",
                "topDisplayName": "Inference Execution Failed",
                "confidence": 0.0,
                "entropy": 0.0,
                "accepted": False,
                "reviewReason": f"Inference execution failed: {str(e)}",
                "classProbabilities": [],
                "limitationsNotice": "System error during inference.",
            }

classifier = DiseaseClassifier()

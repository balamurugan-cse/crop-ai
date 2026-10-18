"""
CropCare AI - Transfer Learning Disease Classifier Training Pipeline
Trains MobileNetV2 / ResNet on PlantVillage dataset splits with training-only augmentation.
Saves model checkpoint and metadata.
"""

import os
import sys
import json
import time
import argparse
from typing import Dict, Any, List
from PIL import Image
import numpy as np

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.taxonomy import TAXONOMY, CLASS_NAMES, NUM_CLASSES
from training.prepare_dataset import (
    build_reproducible_splits,
    generate_sample_verification_dataset,
    SPLITS_DIR,
)

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "models"))

def train_classifier(epochs: int = 5, batch_size: int = 16, lr: float = 1e-3, architecture: str = "mobilenet_v2"):
    import torch
    import torch.nn as nn
    from torch.utils.data import Dataset, DataLoader
    from torchvision import transforms, models

    os.makedirs(MODELS_DIR, exist_ok=True)
    splits_file = os.path.join(SPLITS_DIR, "splits.json")

    # If splits do not exist, run prepare_dataset sample mode
    if not os.path.exists(splits_file):
        print("[Warning] Splits file not found. Generating initial dataset splits...")
        generate_sample_verification_dataset(15)
        build_reproducible_splits()

    with open(splits_file, "r", encoding="utf-8") as f:
        splits = json.load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Training] Starting on compute device: {device} | Model: {architecture} | Epochs: {epochs}")

    # Transforms: Augmentations applied strictly to training split
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    class CropDataset(Dataset):
        def __init__(self, items: List[Dict[str, str]], transform=None):
            self.items = items
            self.transform = transform
            self.class_to_idx = {name: meta["index"] for name, meta in TAXONOMY.items()}

        def __len__(self):
            return len(self.items)

        def __getitem__(self, idx):
            item = self.items[idx]
            image = Image.open(item["path"]).convert("RGB")
            label = self.class_to_idx[item["class"]]
            if self.transform:
                image = self.transform(image)
            return image, label

    train_dataset = CropDataset(splits["train"], transform=train_transform)
    val_dataset = CropDataset(splits["val"], transform=val_transform)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    print(f"[Dataset] Training samples: {len(train_dataset)} | Validation samples: {len(val_dataset)}")

    # Instantiate model
    if architecture == "mobilenet_v2":
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT if hasattr(models, 'MobileNet_V2_Weights') else None)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, NUM_CLASSES)
    else:
        model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT if hasattr(models, 'ResNet18_Weights') else None)
        model.fc = nn.Linear(model.fc.in_features, NUM_CLASSES)

    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    best_val_acc = 0.0
    checkpoint_path = os.path.join(MODELS_DIR, "cropcare_model.pt")
    meta_path = os.path.join(MODELS_DIR, "model_meta.json")

    history = {"train_loss": [], "val_loss": [], "val_accuracy": []}

    start_time = time.time()
    for epoch in range(1, epochs + 1):
        # Training
        model.train()
        running_loss = 0.0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * images.size(0)

        epoch_train_loss = running_loss / len(train_dataset)

        # Validation
        model.eval()
        val_loss = 0.0
        correct = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                correct += torch.sum(preds == labels.data).item()

        epoch_val_loss = val_loss / len(val_dataset)
        epoch_val_acc = (correct / len(val_dataset)) * 100.0

        history["train_loss"].append(round(epoch_train_loss, 4))
        history["val_loss"].append(round(epoch_val_loss, 4))
        history["val_accuracy"].append(round(epoch_val_acc, 2))

        print(f"Epoch [{epoch}/{epochs}] - Train Loss: {epoch_train_loss:.4f} | Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc:.1f}%")

        if epoch_val_acc >= best_val_acc:
            best_val_acc = epoch_val_acc
            # Save state dict
            torch.save({"state_dict": model.state_dict(), "architecture": architecture}, checkpoint_path)

    elapsed = round(time.time() - start_time, 2)
    print(f"[Model] Checkpoint saved: {checkpoint_path} (Best Val Accuracy: {best_val_acc:.1f}%) in {elapsed}s")

    metadata = {
        "version": "1.0.0",
        "modelName": "CropCare AI Multi-Crop Classifier",
        "architecture": architecture,
        "trainedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "epochs": epochs,
        "batchSize": batch_size,
        "learningRate": lr,
        "trainingDurationSeconds": elapsed,
        "device": str(device),
        "bestValAccuracy": best_val_acc,
        "history": history,
        "numClasses": NUM_CLASSES,
        "classes": CLASS_NAMES,
        "trainingOnlyAugmentation": True,
        "provenance": {
            "trainingSplit": "PlantVillage (Mohanty et al., 2016) 70% split",
            "validationSplit": "PlantVillage 15% split",
            "externalHoldout": "PlantDoc (Singh et al., 2020) untouched 100%",
        },
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[Meta] Model metadata saved: {meta_path}")

    return checkpoint_path, metadata

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train CropCare AI Classifier")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Training batch size")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    parser.add_argument("--model", type=str, default="mobilenet_v2", choices=["mobilenet_v2", "resnet18"])
    args = parser.parse_args()

    train_classifier(epochs=args.epochs, batch_size=args.batch_size, lr=args.lr, architecture=args.model)

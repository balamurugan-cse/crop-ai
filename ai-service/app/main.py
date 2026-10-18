"""
CropCare AI - FastAPI Inference & Progression Service
"""

import os
import json

from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import io

from .taxonomy import TAXONOMY, CLASS_NAMES, NUM_CLASSES
from .preprocessing import validate_image_quality
from .classifier import classifier
from .progression import compare_longitudinal_observations

app = FastAPI(
    title="CropCare AI Inference & Recovery Service",
    description="Multi-Crop Disease Recognition, Uncertainty Rejection & Longitudinal Recovery Progression API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Returns AI microservice status, loaded model checkpoint status, and supported taxonomy."""
    info = classifier.get_model_info()
    return {
        "status": "healthy",
        "service": "CropCare AI Python Service",
        **info,
    }

@app.post("/analyze")
async def analyze_leaf_image(
    file: UploadFile = File(...),
    crop_hint: Optional[str] = Form(None)
):
    """
    Analyzes an uploaded leaf image:
    1. Validates image type, integrity, dimensions (>=128x128), blur, and exposure.
    2. Runs neural network classifier inference.
    3. Calculates Shannon entropy and applies calibrated confidence rejection.
    4. Returns class probabilities and transparent advisory limitations.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image file received.")

    # Step 1: Pre-inference image quality and sanity validation
    is_acceptable, quality_metrics, pil_image = validate_image_quality(contents)
    if not is_acceptable:
        return JSONResponse(
            status_code=200,
            content={
                "isAvailable": True,
                "modelVersion": classifier.get_model_info()["modelVersion"],
                "imageQuality": quality_metrics,
                "topClass": "unsuitable_image",
                "topDisplayName": "Image Quality Unsuitable",
                "confidence": 0.0,
                "entropy": 0.0,
                "accepted": False,
                "reviewReason": quality_metrics.get("rejectionReason", "Image failed quality standards."),
                "classProbabilities": [],
                "limitationsNotice": "Photo quality is insufficient for foliar analysis. Please upload a clear, focused image.",
            }
        )

    # Step 2: Classifier inference & uncertainty rejection
    prediction = classifier.predict(pil_image, crop_hint=crop_hint)
    prediction["imageQuality"] = quality_metrics

    return prediction

@app.post("/compare-progression")
async def compare_progression(
    current_file: UploadFile = File(...),
    previous_file: UploadFile = File(...)
):
    """
    Compares two chronological leaf photographs for the same plot.
    Computes visual necrotic lesion delta, Excess Green (ExG) index shift,
    illumination consistency, and estimated symptom trend.
    """
    cur_bytes = await current_file.read()
    prev_bytes = await previous_file.read()

    try:
        cur_img = Image.open(io.BytesIO(cur_bytes)).convert("RGB")
        prev_img = Image.open(io.BytesIO(prev_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed opening comparison images: {e}")

    result = compare_longitudinal_observations(cur_img, prev_img)
    return result

@app.get("/metrics")
def get_evaluation_metrics():
    """
    Returns authentic research evaluation metrics (Macro-F1, Precision, Recall,
    Confusion Matrix, ECE) produced by the evaluation pipeline on PlantVillage and PlantDoc.
    """
    meta_path = os.getenv(
        "MODEL_METADATA_PATH",
        os.path.join(os.path.dirname(__file__), "models", "model_meta.json")
    )
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data
        except Exception as e:
            return {"error": f"Failed reading evaluation metadata: {e}"}

    return {
        "status": "awaiting_experiment_execution",
        "message": "Evaluation pipeline has not been executed yet. Run python ai-service/evaluation/evaluate.py.",
        "supportedClasses": CLASS_NAMES,
    }

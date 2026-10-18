import io
import pytest
from PIL import Image
import numpy as np

from app.taxonomy import TAXONOMY, CLASS_NAMES, NUM_CLASSES
from app.preprocessing import validate_image_quality, preprocess_for_inference
from app.progression import estimate_foliar_lesion_metrics, compare_longitudinal_observations
from app.classifier import DiseaseClassifier

def test_taxonomy_integrity():
    assert NUM_CLASSES == 11
    assert "tomato_early_blight" in CLASS_NAMES
    assert "potato_late_blight" in CLASS_NAMES
    assert "corn_common_rust" in CLASS_NAMES
    assert "bell_pepper_bacterial_spot" in CLASS_NAMES
    for cname, meta in TAXONOMY.items():
        assert "crop" in meta
        assert "condition" in meta
        assert "is_healthy" in meta
        assert isinstance(meta["is_healthy"], bool)

def test_preprocessing_rejects_corrupted_data():
    corrupt_bytes = b"not_an_image_file_random_bytes_123456"
    is_acceptable, metrics, img = validate_image_quality(corrupt_bytes)
    assert is_acceptable is False
    assert "rejectionReason" in metrics
    assert "Corrupt" in metrics["rejectionReason"] or "unreadable" in metrics["rejectionReason"]

def test_preprocessing_rejects_undersized_image():
    # 64x64 is smaller than minimum 128x128 threshold
    small_img = Image.new("RGB", (64, 64), color=(0, 128, 0))
    buf = io.BytesIO()
    small_img.save(buf, format="JPEG")
    is_acceptable, metrics, _ = validate_image_quality(buf.getvalue())
    assert is_acceptable is False
    assert metrics["width"] == 64
    assert "too small" in metrics["rejectionReason"]

def test_preprocessing_accepts_valid_leaf_image():
    # 224x224 valid green image with texture
    arr = np.random.randint(40, 180, (224, 224, 3), dtype=np.uint8)
    valid_img = Image.fromarray(arr)
    buf = io.BytesIO()
    valid_img.save(buf, format="JPEG")
    is_acceptable, metrics, processed_img = validate_image_quality(buf.getvalue())
    assert is_acceptable is True
    assert metrics["width"] == 224
    assert metrics["height"] == 224
    assert "blurVariance" in metrics

    # Test normalization array
    norm_arr = preprocess_for_inference(processed_img)
    assert norm_arr.shape == (1, 3, 224, 224)

def test_progression_metrics_and_comparison():
    # Create healthy leaf
    healthy_img = Image.new("RGB", (200, 200), color=(34, 139, 34))
    metrics_healthy = estimate_foliar_lesion_metrics(healthy_img)
    assert "lesionCoveragePercent" in metrics_healthy
    assert "meanExG" in metrics_healthy
    assert metrics_healthy["meanExG"] > 0

    # Create diseased leaf with yellow/brown necrotic patch
    diseased_arr = np.zeros((200, 200, 3), dtype=np.uint8)
    diseased_arr[:, :] = [34, 139, 34]
    # Add large brown lesion
    diseased_arr[50:150, 50:150] = [139, 69, 19]
    diseased_img = Image.fromarray(diseased_arr)

    metrics_diseased = estimate_foliar_lesion_metrics(diseased_img)
    assert metrics_diseased["lesionCoveragePercent"] > metrics_healthy["lesionCoveragePercent"]

    # Test comparison: from diseased to healthy = improving
    comparison = compare_longitudinal_observations(healthy_img, diseased_img)
    assert comparison["symptomTrend"] == "improving"
    assert comparison["lesionDeltaPercent"] < 0
    assert "scientificDisclaimer" in comparison

def test_classifier_unloaded_safeguard():
    # Instantiate with non-existent checkpoint path
    clf = DiseaseClassifier(checkpoint_path="non_existent_weights.pt")
    assert clf.is_loaded() is False
    dummy_img = Image.new("RGB", (224, 224), color=(50, 100, 50))
    pred = clf.predict(dummy_img)
    # Must report untrained/unavailable, not fabricate fake random disease prediction
    assert pred["isAvailable"] is False
    assert pred["accepted"] is False
    assert "not been trained" in pred["reviewReason"]

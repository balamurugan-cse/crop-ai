import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
import numpy as np

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "checkpointLoaded" in data
    assert "supportedClasses" in data
    assert len(data["supportedClasses"]) == 11

def test_metrics_endpoint():
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "classes" in data or "supportedClasses" in data

def test_analyze_endpoint_with_image():
    # Create valid test image with natural leaf texture
    arr = np.random.randint(40, 180, (224, 224, 3), dtype=np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    response = client.post(
        "/analyze",
        files={"file": ("test_leaf.jpg", buf, "image/jpeg")},
        data={"crop_hint": "Tomato"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["isAvailable"] is True
    assert "confidence" in data
    assert "entropy" in data
    assert "accepted" in data
    assert "classProbabilities" in data
    assert len(data["classProbabilities"]) == 11
    assert data["imageQuality"]["isAcceptable"] is True

def test_analyze_endpoint_rejects_flat_blur_image():
    # Completely flat solid color has 0 variance (severe blur)
    flat_img = Image.new("RGB", (224, 224), color=(34, 139, 34))
    buf = io.BytesIO()
    flat_img.save(buf, format="JPEG")
    buf.seek(0)

    response = client.post(
        "/analyze",
        files={"file": ("flat_leaf.jpg", buf, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["imageQuality"]["isAcceptable"] is False
    assert "rejectionReason" in data["imageQuality"]
    assert data["accepted"] is False

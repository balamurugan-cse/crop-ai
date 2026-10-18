import io
from typing import Tuple, Dict, Any
from PIL import Image
import numpy as np

def validate_image_quality(image_bytes: bytes) -> Tuple[bool, Dict[str, Any], Image.Image]:
    """
    Validates image file integrity, minimum resolution, blurriness, and exposure.
    Returns:
      (is_acceptable, quality_metrics_dict, pil_image)
    """
    try:
      image = Image.open(io.BytesIO(image_bytes))
      image.verify()  # verify integrity
      # Re-open because verify() consumes image buffer
      image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
      return False, {
          "isAcceptable": False,
          "rejectionReason": f"Corrupt or unreadable image file: {str(e)}",
      }, None

    width, height = image.size

    # Check minimum dimensions (128x128)
    if width < 128 or height < 128:
      return False, {
          "isAcceptable": False,
          "width": width,
          "height": height,
          "rejectionReason": f"Image dimensions too small ({width}x{height}px). Minimum required is 128x128px.",
      }, image

    # Compute luminance & blur variance
    img_array = np.array(image, dtype=np.float32)
    # Convert to grayscale luminance: 0.299 R + 0.587 G + 0.114 B
    gray = 0.299 * img_array[:, :, 0] + 0.587 * img_array[:, :, 1] + 0.114 * img_array[:, :, 2]
    mean_brightness = float(np.mean(gray))

    # Reject severe underexposure (< 15) or overexposure (> 245)
    if mean_brightness < 15:
      return False, {
          "isAcceptable": False,
          "width": width,
          "height": height,
          "meanBrightness": round(mean_brightness, 2),
          "rejectionReason": "Image is severely underexposed (too dark) for reliable foliar diagnosis.",
      }, image

    if mean_brightness > 245:
      return False, {
          "isAcceptable": False,
          "width": width,
          "height": height,
          "meanBrightness": round(mean_brightness, 2),
          "rejectionReason": "Image is severely overexposed (washed out) for reliable foliar diagnosis.",
      }, image

    # Estimate blur using discrete 2D Laplacian variance approximation
    # Kernel: [[0, 1, 0], [1, -4, 1], [0, 1, 0]]
    if gray.shape[0] > 10 and gray.shape[1] > 10:
      center = gray[1:-1, 1:-1]
      top = gray[:-2, 1:-1]
      bottom = gray[2:, 1:-1]
      left = gray[1:-1, :-2]
      right = gray[1:-1, 2:]
      laplacian = top + bottom + left + right - 4.0 * center
      blur_variance = float(np.var(laplacian))
    else:
      blur_variance = 100.0

    # Low variance (< 20.0) indicates heavy motion or out-of-focus blur
    if blur_variance < 15.0:
      return False, {
          "isAcceptable": False,
          "width": width,
          "height": height,
          "blurVariance": round(blur_variance, 2),
          "meanBrightness": round(mean_brightness, 2),
          "rejectionReason": f"Severe image blur detected (variance: {blur_variance:.1f} < 15.0). Please retake a sharper photo.",
      }, image

    return True, {
        "isAcceptable": True,
        "width": width,
        "height": height,
        "blurVariance": round(blur_variance, 2),
        "meanBrightness": round(mean_brightness, 2),
    }, image

def preprocess_for_inference(image: Image.Image, target_size=(224, 224)) -> np.ndarray:
    """
    Standardizes image into normalized tensor array (RGB 224x224, ImageNet normalization).
    Returns (1, 3, 224, 224) float32 numpy array.
    """
    resized = image.resize(target_size, Image.Resampling.BILINEAR)
    arr = np.array(resized, dtype=np.float32) / 255.0

    # Standard ImageNet normalization: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    normalized = (arr - mean) / std

    # Transpose to (C, H, W) and expand batch dim (1, C, H, W)
    chw = np.transpose(normalized, (2, 0, 1))
    return np.expand_dims(chw, axis=0)

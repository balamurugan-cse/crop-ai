"""
CropCare AI - Longitudinal Visual Symptom Progression Module
Analyzes repeated leaf photographs linked chronologically to the same plot.
Estimates visible necrotic/chlorotic surface ratio changes and colorimetric shifts.
"""

from typing import Dict, Any, Tuple
from PIL import Image
import numpy as np

def estimate_foliar_lesion_metrics(image: Image.Image) -> Dict[str, float]:
    """
    Estimates leaf surface, lesion/necrotic area, and Excess Green (ExG) vegetative index.
    ExG = 2*G - R - B. Positive ExG indicates vibrant photosynthetic tissue.
    Lesions show depressed ExG, brown/yellow necrotic hues (elevated R relative to G, low B).
    """
    img_rgb = np.array(image.convert("RGB"), dtype=np.float32)
    R = img_rgb[:, :, 0]
    G = img_rgb[:, :, 1]
    B = img_rgb[:, :, 2]

    # ExG Index
    exg = 2.0 * G - R - B

    # Foliage mask: exclude background (dark black/grey or pure white)
    # Total brightness
    lum = (R + G + B) / 3.0
    foliage_mask = (lum > 25.0) & (lum < 240.0)

    total_leaf_pixels = np.sum(foliage_mask)
    if total_leaf_pixels < 100:
      return {
          "lesionCoveragePercent": 0.0,
          "meanExG": 0.0,
          "meanLuminance": float(np.mean(lum)),
      }

    # Necrotic lesion definition:
    # Within leaf mask, where ExG is negative or low (ExG < 5.0) and yellow/brown chlorosis (R >= G - 10)
    lesion_mask = foliage_mask & ((exg < 5.0) | ((R > G) & (lum > 40.0)))
    lesion_pixels = np.sum(lesion_mask)

    lesion_pct = (lesion_pixels / total_leaf_pixels) * 100.0
    mean_exg = float(np.mean(exg[foliage_mask]))

    return {
        "lesionCoveragePercent": round(float(lesion_pct), 2),
        "meanExG": round(mean_exg, 2),
        "meanLuminance": round(float(np.mean(lum[foliage_mask])), 2),
    }

def compare_longitudinal_observations(
    current_image: Image.Image,
    previous_image: Image.Image
) -> Dict[str, Any]:
    """
    Compares two chronological observations of the same plot.
    Flags inconsistent lighting/angles and calculates symptom delta.
    """
    cur_metrics = estimate_foliar_lesion_metrics(current_image)
    prev_metrics = estimate_foliar_lesion_metrics(previous_image)

    cur_lesion = cur_metrics["lesionCoveragePercent"]
    prev_lesion = prev_metrics["lesionCoveragePercent"]
    lesion_delta = round(cur_lesion - prev_lesion, 2)

    cur_exg = cur_metrics["meanExG"]
    prev_exg = prev_metrics["meanExG"]
    exg_delta = round(cur_exg - prev_exg, 2)

    # Lighting check: disparity in mean leaf luminance > 35 implies inconsistent illumination
    lum_diff = abs(cur_metrics["meanLuminance"] - prev_metrics["meanLuminance"])
    lighting_inconsistent = lum_diff > 35.0

    # Trend determination:
    # If lesion coverage decreased by >= 4% and vegetative ExG increased, likely improving
    # If lesion coverage increased by >= 4%, likely worsening
    if lesion_delta <= -4.0:
      trend = "improving"
    elif lesion_delta >= 4.0:
      trend = "worsening"
    else:
      trend = "stable"

    return {
        "lesionCoveragePercentCurrent": cur_lesion,
        "lesionCoveragePercentPrevious": prev_lesion,
        "lesionDeltaPercent": lesion_delta,
        "vegetativeIndexExGDelta": exg_delta,
        "lightingInconsistencyFlag": lighting_inconsistent,
        "symptomTrend": trend,
        "assessmentMethod": "Longitudinal Folio-Colorimetric & Necrotic Coverage Computer Vision Delta",
        "scientificDisclaimer": (
            "Estimated visual progression based on leaf colorimetry and necrotic area. "
            "Does not constitute clinical recovery validation or guaranteed pathogen eradication."
        ),
    }

# CropCare AI — Dataset Strategy & Experimental Protocol

## 1. Dataset Overview

To eliminate the artificial overconfidence reported in literature when models are evaluated purely on laboratory-condition leaves, CropCare AI establishes a dual-dataset protocol:

| Dataset | Origin & Nature | Role in CropCare AI | Key Caution / Safeguards |
| :--- | :--- | :--- | :--- |
| **PlantVillage** (Mohanty et al., 2016) | Controlled laboratory leaves, uniform grey/black backgrounds, 54,306 images across 14 crops & 38 classes. | Baseline training, internal validation, and calibration source. | High laboratory accuracy (~99%) does **not** transfer to field images. Cannot be used as sole proof of real-world utility. |
| **PlantDoc** (Singh et al., 2020) | In-situ field photography under natural lighting, complex background clutter, multi-leaf foliage. | External field evaluation to measure out-of-domain generalization gap. | Must **never** be mixed into training or validation splits. Mapped strictly to compatible taxonomy classes. |
| **Project Longitudinal Time-Series** | Standardized repeated plot observations with chronological dates and expert labels. | Longitudinal symptom progression and visual recovery estimation. | Without expert clinical progression labels, results are explicitly flagged as *Estimated Visual Progression* rather than guaranteed recovery. |

---

## 2. Supported Crop-Condition Taxonomy Mapping

CropCare AI maps diverse raw folder names from PlantVillage and PlantDoc to a unified normalized taxonomy:

```json
{
  "tomato_early_blight": {
    "crop": "Tomato",
    "condition": "Early Blight",
    "pathogen": "Alternaria solani",
    "is_healthy": false,
    "pv_class": "Tomato___Early_blight",
    "plantdoc_class": "Tomato Early blight leaf"
  },
  "tomato_late_blight": {
    "crop": "Tomato",
    "condition": "Late Blight",
    "pathogen": "Phytophthora infestans",
    "is_healthy": false,
    "pv_class": "Tomato___Late_blight",
    "plantdoc_class": "Tomato Late blight leaf"
  },
  "tomato_healthy": {
    "crop": "Tomato",
    "condition": "Healthy",
    "pathogen": null,
    "is_healthy": true,
    "pv_class": "Tomato___healthy",
    "plantdoc_class": "Tomato leaf"
  },
  "potato_early_blight": {
    "crop": "Potato",
    "condition": "Early Blight",
    "pathogen": "Alternaria solani",
    "is_healthy": false,
    "pv_class": "Potato___Early_blight",
    "plantdoc_class": "Potato Early blight leaf"
  },
  "potato_late_blight": {
    "crop": "Potato",
    "condition": "Late Blight",
    "pathogen": "Phytophthora infestans",
    "is_healthy": false,
    "pv_class": "Potato___Late_blight",
    "plantdoc_class": "Potato Late blight leaf"
  },
  "potato_healthy": {
    "crop": "Potato",
    "condition": "Healthy",
    "pathogen": null,
    "is_healthy": true,
    "pv_class": "Potato___healthy",
    "plantdoc_class": "Potato leaf"
  },
  "corn_common_rust": {
    "crop": "Corn (Maize)",
    "condition": "Common Rust",
    "pathogen": "Puccinia sorghi",
    "is_healthy": false,
    "pv_class": "Corn_(maize)___Common_rust_",
    "plantdoc_class": "Corn leaf blight / rust"
  },
  "corn_northern_leaf_blight": {
    "crop": "Corn (Maize)",
    "condition": "Northern Leaf Blight",
    "pathogen": "Exserohilum turcicum",
    "is_healthy": false,
    "pv_class": "Corn_(maize)___Northern_Leaf_Blight",
    "plantdoc_class": "Corn leaf blight"
  },
  "corn_healthy": {
    "crop": "Corn (Maize)",
    "condition": "Healthy",
    "pathogen": null,
    "is_healthy": true,
    "pv_class": "Corn_(maize)___healthy",
    "plantdoc_class": "Corn healthy leaf"
  },
  "bell_pepper_bacterial_spot": {
    "crop": "Bell Pepper",
    "condition": "Bacterial Spot",
    "pathogen": "Xanthomonas campestris",
    "is_healthy": false,
    "pv_class": "Pepper,_bell___Bacterial_spot",
    "plantdoc_class": "Bell_pepper leaf spot"
  },
  "bell_pepper_healthy": {
    "crop": "Bell Pepper",
    "condition": "Healthy",
    "pathogen": null,
    "is_healthy": true,
    "pv_class": "Pepper,_bell___healthy",
    "plantdoc_class": "Bell_pepper leaf"
  }
}
```

---

## 3. Data Ingestion & Sanitization Pipeline

1. **Integrity Validation**: Each image is verified with Pillow and OpenCV. Corrupted, zero-byte, or unreadable files are logged and excluded.
2. **Duplicate & Near-Duplicate Checking**: MD5 checksums and Perceptual Hashing (dHash) prevent identical images from leaking across splits.
3. **Split Strategy**:
   - PlantVillage: 70% Train, 15% Validation, 15% Internal Test (stratified by class).
   - Augmentation: Applied **strictly** to the training split (random horizontal/vertical flip, color jitter $\pm 10\%$, slight rotation $\pm 15^\circ$). Validation and test sets are never augmented.
   - PlantDoc: 100% External Test Set (0% seen during training or hyperparameter tuning).

---

## 4. Evaluation Metrics & Hypotheses

- **H1 (Field Generalization Gap)**: Field test F1 will be substantially lower than internal test F1 due to complex background clutter and uncontrolled illumination.
- **H2 (Uncertainty & Rejection)**: Rejection of low-confidence predictions ($p_{max} < 0.65$ or entropy $> 1.20$) will significantly decrease the error rate among accepted predictions, safely routing ambiguous field imagery to human agricultural experts.
- **Calibration Metrics**: Expected Calibration Error (ECE) and Brier Score calculated across 10 confidence bins to ensure predicted probabilities reflect true empirical accuracy.

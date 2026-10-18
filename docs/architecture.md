# CropCare AI — System Architecture & Design Specification

CropCare AI is an advanced decision-support platform designed to address the shortcomings of single-shot plant disease classification models. Rather than relying solely on high training accuracy on controlled datasets, CropCare AI integrates:
1. **Uncertainty-Aware Multi-Crop Disease Classification** (with rejection thresholds and image quality validation)
2. **Longitudinal Crop Recovery & Visible-Symptom Progression Tracking** (comparing standardized repeated observations over time)
3. **Weather-Informed Agronomic Risk Assessment** (based on documented meteorological threshold models)
4. **Human-in-the-Loop Expert Review and Audit Logging**
5. **Secure Full-Stack Web Application** with role-based access control (Farmer, Agricultural Expert, Administrator).

---

## 1. High-Level Architectural Diagram

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|  React 18 + Vite + TypeScript + Tailwind CSS + Lucide Icons + Recharts UI      |
|  - Farmer Dashboard: Plot tracking, leaf uploads, progression timelines         |
|  - Expert Console: Review queue, diagnosis confirmation, agronomic advice      |
|  - Research & Analytics: Confusion matrix, field vs lab gap, calibration ECE    |
+---------------------------------------------------------------------------------+
                                       |
                                       | HTTPS / REST / Multipart Form
                                       v
+---------------------------------------------------------------------------------+
|                           APPLICATION BACKEND (Node.js)                         |
|  Express + TypeScript + JWT Auth + Zod Validation + Multer                     |
|                                                                                 |
|  Controllers & Services:                                                        |
|   - Auth & Role Guard: Farmer / Expert / Admin access control                  |
|   - Plot & Observation Manager: Time-series link to plots                       |
|   - Image Storage Service: Local FS / S3 Abstraction (file validation)          |
|   - Weather Service: Open-Meteo & OpenWeatherMap with safe caching              |
|   - Progression Engine: Delta computation across dated observations            |
|   - Risk Engine: Agronomic empirical disease risk formulas                     |
|   - AI Gateway Client: Microservice communication & fallback handling           |
|   - Audit & Report Generator: Audit trails & summary reports                   |
+---------------------------------------------------------------------------------+
          |                                               |
          | Mongoose ODM / Driver                         | Internal HTTP / REST
          v                                               v
+-----------------------------------+   +-----------------------------------------+
|        DATABASE (MongoDB)         |   |          AI SERVICE (Python)            |
|  - users                          |   |  FastAPI + PyTorch / MobileNetV2 /      |
|  - plots                          |   |  EfficientNet + OpenCV + scikit-learn   |
|  - observations                   |   |                                         |
|  - predictions                    |   |  Modules:                               |
|  - progressRecords                |   |   - /health: Model availability & meta  |
|  - riskAssessments                |   |   - /analyze: Preprocessing, Quality    |
|  - expertReviews                  |   |     checks, Inference, Softmax,         |
|  - interventions                  |   |     Uncertainty & Rejection threshold   |
|  - auditLogs                      |   |   - /progression: Computer vision delta |
|                                   |   |     lesion area & colorimetric shift    |
| (With In-Memory local fallback    |   |   - /evaluation: Benchmark metrics      |
|  for instant testing & dev)       |   |     (Macro-F1, ECE, Confusion Matrix)   |
+-----------------------------------+   +-----------------------------------------+
```

---

## 2. Core Modules Description

### Module 1: Authentication & Authorization
- **JWT Authentication** with bcrypt password hashing (10 salt rounds).
- **Role-Based Access Control (RBAC)**:
  - `farmer`: Can manage own plots, upload observations, request expert reviews, view risk and progression reports. Cannot access other farmers' private plots.
  - `expert`: Can view pending review requests, inspect plot history and images, submit verified diagnoses and notes.
  - `admin`: Can view system audit logs, manage users, and inspect model health.
- **Explicit Consent**: Consent recorded at registration for agricultural research and location use.

### Module 2: Crop & Plot Management
- Records: Crop species, planting date, approximate location (latitude/longitude or region), plot size (acres/hectares), observation schedule, and field interventions (fertilizer, fungicide, irrigation).

### Module 3: AI Disease Classification & Uncertainty Handling
- **Supported Crops**: Tomato, Potato, Corn (Maize), Grape, Bell Pepper.
- **Dual Pipeline**:
  1. **Image Quality Validation**: Detects corrupt files, dimension boundaries (< 128px rejected), extreme blur (Laplacian variance), or extreme low/high brightness.
  2. **Model Classification**: Deep convolutional network (MobileNetV2 / ResNet18) trained on normalized leaves.
  3. **Uncertainty & Out-of-Distribution Rejection**:
     - Maximum Softmax Probability thresholding ($p_{max} < \tau_{conf}$).
     - Shannon Entropy ($H = -\sum p_i \ln p_i > \tau_{entropy}$).
     - In case of uncertainty, flags prediction as `accepted: false` with explicit `reviewReason: "LOW_CONFIDENCE"` or `"HIGH_ENTROPY"`, prompting farmer to request expert review rather than trusting false high certainty.

### Module 4: Longitudinal Crop Recovery Monitoring
- Does **not** claim disease cure merely because a single subsequent photo predicts a different class.
- Links repeated observations of the same plot chronologically.
- Computes visible symptom delta:
  - Lesion / necrotic pixel coverage estimation.
  - Colorimetric vegetative index shift (ExG - Excess Green Index).
  - Lighting and angle consistency warning flag.
  - Directional trend: *Likely Improving*, *Stable / No Visible Change*, *Likely Progressing / Worsening*.

### Module 5: Weather-Aware Agronomic Risk Assessment
- Uses real-time weather retrieval (Open-Meteo API / fallback weather model) for temperature, relative humidity, and precipitation.
- Evaluates peer-reviewed disease risk rules (e.g., Wallin / Blitecast rules for Late Blight: temperatures 15–25°C + RH > 85% for > 10 hours; Rust rules for Corn: warm humid days).
- Reports transparent risk factors, warnings, and limitations.

### Module 6: Expert Review System
- Farmers can submit ambiguous or severe cases to the expert review queue.
- Agricultural experts view high-resolution imagery, historical trend, weather snapshot, and model predictions.
- Expert registers verified diagnosis, severity score (1–5), recommended intervention, and follow-up guidance.

### Module 7: Analytics, Reports & Research Evaluation
- Exportable comprehensive plot summary report.
- Research benchmark viewer:
  - Macro-F1, Precision, Recall.
  - Confusion Matrix.
  - Controlled (PlantVillage) vs Field (PlantDoc) generalization gap.
  - Calibration diagram & Expected Calibration Error (ECE).

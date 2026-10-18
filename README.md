# CropCare AI: Multi-Crop Disease Recovery Monitoring & Weather-Aware Risk Assessment System

> **B.E. Computer Science & Engineering Major Project**  
> An advanced full-stack AI platform combining uncertainty-aware multi-crop disease classification, longitudinal visible symptom recovery tracking, weather-informed agronomic risk assessment, and expert verification.

---

## 🌾 Key Novelty & Engineering Highlights

1. **Uncertainty-Aware Disease Diagnosis**:
   - Rejects low-confidence ($p_{\text{max}} < 0.65$) or high-entropy predictions instead of showing false certainty.
   - Rigorous image quality validation (rejects blurry, corrupted, or undersized images).
2. **Longitudinal Crop Recovery Tracking**:
   - Connects repeated plot observations chronologically.
   - Computes visible symptom delta, necrotic lesion percentage, and vegetative index (Excess Green) shifts with lighting change warnings.
   - Refrains from claiming clinical cure solely based on classifier label switching.
3. **Weather-Informed Agronomic Risk Engine**:
   - Evaluates peer-reviewed epidemiological rules (Wallin Blitecast, Rust temperature/humidity envelopes).
   - Graceful fallback with transparent warnings when weather station data is stale or unavailable.
4. **Human-in-the-Loop Expert Review**:
   - Farmers can request agricultural specialist review for uncertain or severe cases.
   - Agricultural experts review time-series imagery, weather snapshots, and register clinical recommendations.
5. **Rigorous Dual-Dataset Evaluation**:
   - Trained on controlled **PlantVillage** dataset.
   - Evaluated on challenging real-world **PlantDoc** field dataset to expose and document the domain generalization gap.
   - Computes Macro-F1, Precision, Recall, Confusion Matrix, Expected Calibration Error (ECE), and Brier score.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Application Backend**: Node.js, Express, TypeScript, JWT, bcryptjs, Zod validation, Multer
- **AI Service**: Python 3, FastAPI, PyTorch (Transfer Learning with MobileNetV2/ResNet), OpenCV, Pillow, scikit-learn
- **Database & Storage**: MongoDB with Mongoose ODM (includes zero-config in-memory fallback for local testing without external daemon) & abstracted image storage
- **Infrastructure**: Docker, Docker Compose, automated tests (Jest, Supertest, Pytest)

---

## 📁 Repository Structure

```
cropcare-ai/
├── backend/                  # Node.js Express + TypeScript API server
│   ├── src/
│   │   ├── config/           # Database, environment, storage configuration
│   │   ├── controllers/      # Auth, plots, observations, expert, risk, reports
│   │   ├── middleware/       # JWT auth, RBAC, file upload, validation, error handler
│   │   ├── models/           # Mongoose schemas (Users, Plots, Observations, etc.)
│   │   ├── routes/           # REST API routes
│   │   ├── services/         # AI gateway, weather engine, risk & progression rules
│   │   └── index.ts          # Server entry point
│   ├── tests/                # Automated API & workflow tests
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React 18 + Vite + TypeScript web application
│   ├── src/
│   │   ├── components/       # UI components, navigation, charts, modals
│   │   ├── pages/            # Dashboard, Plots, Diagnosis, Progression, Risk, Expert
│   │   ├── services/         # API client & authentication state
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── ai-service/               # Python FastAPI inference & computer vision service
│   ├── app/
│   │   ├── main.py           # FastAPI endpoints
│   │   ├── classifier.py     # PyTorch model loader, inference & uncertainty engine
│   │   ├── preprocessing.py  # Quality validation, blur check & transforms
│   │   └── progression.py    # Longitudinal symptom delta & colorimetry
│   ├── training/             # Dataset ingestion, augmentation & training pipelines
│   │   ├── prepare_dataset.py# PlantVillage & PlantDoc split & mapping utility
│   │   └── train.py          # Transfer learning PyTorch training script
│   ├── evaluation/           # Model evaluation, calibration ECE & confusion matrices
│   │   └── evaluate.py       # Dual-domain evaluation & benchmark generation
│   ├── tests/                # AI service tests
│   └── requirements.txt
├── docs/                     # System architecture, dataset plan & API specs
├── scripts/                  # Automated download, start, and verification scripts
├── docker-compose.yml        # Multi-container deployment specification
├── .env.example              # Environment variables template
└── README.md
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js** v18+ (tested with v24.21.0)
- **Python** 3.10+ (tested with 3.13.7)
- **Git**
- *(Optional)* **Docker & Docker Compose** (for containerized deployment)
- *(Optional)* **MongoDB** (If not running, the backend automatically uses an embedded local database)

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Backend Setup
```bash
cd backend
npm install
npm test
npm run dev
# Backend runs on http://localhost:5000
```

### 4. AI Service Setup
```bash
cd ai-service
# Create dedicated virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run AI service tests
pytest

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# AI Service runs on http://localhost:8000
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🧪 Model Training & Dataset Pipeline

### Step 1: Prepare Datasets
Run the dataset preparation script to download or organize the PlantVillage and PlantDoc datasets into structured train/val/test splits:
```bash
python ai-service/training/prepare_dataset.py --dataset all --sample-mode
```

### Step 2: Train Transfer Learning Classifier
Train the neural network with data augmentations applied strictly to the training split:
```bash
python ai-service/training/train.py --epochs 10 --batch-size 32 --model mobilenet_v2
```

### Step 3: Run Dual-Domain Evaluation
Evaluate model performance, domain shift between controlled and field images, calibration, and prediction rejection:
```bash
python ai-service/evaluation/evaluate.py --checkpoint ai-service/app/models/cropcare_model.pt
```

---

## 🔒 Security & Safe Handling

- Passwords are never stored in plaintext (salted bcrypt hashing).
- JWT tokens with configurable expiration are required for protected endpoints.
- Strict ownership checks prevent farmers from viewing or modifying other farmers' private plot data.
- Multer file upload filters restrict MIME types strictly to valid images (`image/jpeg`, `image/png`, `image/webp`) with maximum file size constraints.
- No medical or agricultural guarantees: Clear disclaimers and expert review referrals accompany all AI outputs.

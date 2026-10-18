# CropCare AI — REST API Documentation

Base URL: `http://localhost:5000/api`  
AI Service URL: `http://localhost:8000`

---

## Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register farmer, expert, or admin with role and consent | No |
| `POST` | `/api/auth/login` | Login with email and password, receives JWT token and profile | No |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile | Yes |

---

## Plot Management Endpoints (`/api/plots`)

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/plots` | Create a new crop plot (crop, location, planting date, size) | Yes (Farmer) |
| `GET` | `/api/plots` | List all plots owned by user (or all plots for Admin) | Yes |
| `GET` | `/api/plots/:id` | Get details of a single plot with ownership verification | Yes |
| `PUT` | `/api/plots/:id` | Update plot details or archive status | Yes (Owner) |
| `GET` | `/api/plots/:id/history` | Chronological observations and interventions for a plot | Yes (Owner/Expert) |
| `GET` | `/api/plots/:id/progression` | Longitudinal visible-symptom change & trend estimates | Yes (Owner/Expert) |
| `GET` | `/api/plots/:id/risk` | Latest weather-aware agronomic disease risk assessment | Yes (Owner/Expert) |

---

## Observation & Image Analysis Endpoints (`/api/observations`)

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/observations` | Upload leaf image (multipart/form-data) linked to a plot | Yes (Owner) |
| `GET` | `/api/observations/:id` | Fetch observation record with image metadata | Yes (Owner/Expert) |
| `POST` | `/api/observations/:id/analyze` | Trigger AI diagnosis and uncertainty evaluation | Yes (Owner) |
| `POST` | `/api/observations/:id/review` | Request human agricultural expert review | Yes (Owner) |

---

## Interventions Endpoints (`/api/interventions`)

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/interventions` | Log farmer intervention (fertilizer, fungicide, watering) | Yes (Owner) |
| `GET` | `/api/interventions/plot/:plotId` | List interventions applied to a specific plot | Yes (Owner/Expert) |

---

## Expert Review Endpoints (`/api/expert`)

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/expert/queue` | List observations requested for expert review | Yes (Expert/Admin) |
| `POST` | `/api/expert/reviews` | Submit verified expert diagnosis, severity, and advice | Yes (Expert) |
| `GET` | `/api/expert/reviews/:observationId` | Fetch expert assessment for an observation | Yes (Owner/Expert) |

---

## Analytics & Reports (`/api/reports`)

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/plots/:id` | Generate comprehensive plot diagnostic and progression summary | Yes (Owner/Expert) |
| `GET` | `/api/reports/research` | Return real model evaluation metrics, confusion matrix, and ECE | Yes |

---

## AI Service Microservice Endpoints (`:8000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health, device (CPU/CUDA), active model checkpoint and classes |
| `POST` | `/analyze` | Receives image file; returns quality checks, top prediction, class probabilities, entropy, and rejection decision |
| `POST` | `/compare-progression` | Receives two images (current & prior); calculates visible symptom delta, ExG vegetative index shift, and lighting consistency |
| `GET` | `/metrics` | Real benchmark metrics across internal vs external field datasets |

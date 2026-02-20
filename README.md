<p align="center">
  <img src="https://img.shields.io/badge/RIFT-2026-0066FF?style=for-the-badge&logoColor=white" alt="RIFT 2026"/>
  <img src="https://img.shields.io/badge/Financial_Forensics-Engine-blueviolet?style=for-the-badge" alt="Financial Forensics"/>
</p>

<h1 align="center">🛡️ RIFT 2026 — Mule Account Detection Engine</h1>

<p align="center">
  <b>Real-time financial forensics platform for detecting money mule networks, circular fund flows, and smurfing patterns in transaction data.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/D3.js-7-F9A03C?style=flat-square&logo=d3dotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/NetworkX-Graph_Engine-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Detection Algorithms](#-detection-algorithms)
- [Architecture](#-architecture)
- [Screenshots](#-screenshots)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Tech Stack](#-tech-stack)
- [License](#-license)

---

## 🔍 Overview

**RIFT 2026** is a full-stack financial forensics application designed to detect **money mule accounts** and **fraud rings** hidden within banking transaction data. Upload a CSV of transactions, and the engine builds a directed graph to identify suspicious patterns using five independent detection algorithms — all visualized through an interactive, modern dashboard.

> **Money Mules** are individuals who transfer illegally obtained funds between accounts on behalf of criminals. Detecting them early is critical for anti-money laundering (AML) compliance.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📤 **Drag & Drop Upload** | Securely ingest CSV transaction logs with real-time schema validation |
| 🔬 **5 Detection Algorithms** | Cycle detection, Fan-in/Fan-out, Layered Shells, Commission Retention, Smurfing |
| 📊 **Interactive Dashboard** | Circle-pack network visualization, risk distribution charts, ring summaries |
| 🕵️ **Investigation Module** | Deep-dive into individual suspects with full cluster graph visualization (D3.js) |
| 🎛️ **Live Filters** | Fan-in/Fan-out ratio slider, Commission Retention toggle, Pattern filters |
| 📈 **Risk Scoring Engine** | Composite scoring (0–100) based on weighted graph metrics and detection flags |
| 🔗 **Fraud Ring Aggregation** | Automatically groups suspects into interconnected fraud rings |
| 📥 **JSON Export** | Export forensic reports in SRS-compliant JSON format |
| ⚡ **One-Click Launch** | Single `run.bat` script starts both frontend and backend |

---

## 🧠 Detection Algorithms

```
┌─────────────────────────────────────────────────────────────────┐
│                    DETECTION ENGINE PIPELINE                     │
├─────────────────┬───────────────────────────────────────────────┤
│  🔄 Cycles      │ Chronological circular flows (length 3–5)     │
│                 │ with temporal DFS and timestamp validation     │
├─────────────────┼───────────────────────────────────────────────┤
│  📥 Fan-In      │ High in-degree nodes receiving from many      │
│                 │ sources within concentrated time windows       │
├─────────────────┼───────────────────────────────────────────────┤
│  📤 Fan-Out     │ Single nodes distributing to many recipients  │
│                 │ (smurfing / structuring indicator)             │
├─────────────────┼───────────────────────────────────────────────┤
│  🏗️ Shells      │ Layered chains of hops with low intermediate  │
│                 │ activity (shell company patterns)              │
├─────────────────┼───────────────────────────────────────────────┤
│  💰 Commission  │ Value loss detection across transaction       │
│                 │ chains (mule skimming a percentage)            │
└─────────────────┴───────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

```
                    ┌──────────────────────┐
                    │    Browser Client     │
                    │  React 19 + Vite 7   │
                    │  D3.js + Tailwind 4  │
                    └──────────┬───────────┘
                               │ /api/*
                    ┌──────────▼───────────┐
                    │   Vite Dev Proxy     │
                    │  /api → :8001        │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   FastAPI Backend     │
                    │   Port 8001          │
                    ├──────────────────────┤
                    │ ┌──────────────────┐ │
                    │ │  Validation      │ │  CSV → DataFrame
                    │ ├──────────────────┤ │
                    │ │  Graph Builder   │ │  DataFrame → DiGraph
                    │ ├──────────────────┤ │
                    │ │  Detection Engine│ │  5× Pattern Detectors
                    │ ├──────────────────┤ │
                    │ │  Scoring Engine  │ │  Weighted Risk Scores
                    │ ├──────────────────┤ │
                    │ │  Clustering      │ │  Heuristic Grouping
                    │ └──────────────────┘ │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  bucket/ (JSON+CSV)   │
                    │  Persistent Storage   │
                    └──────────────────────┘
```

---

## 📸 Screenshots

<p align="center">
  <img src="dashboard1.png" alt="Dashboard View" width="90%" />
  <br/>
  <em>📊 Dashboard — Circle-pack network, risk distribution, and detected rings</em>
</p>

<p align="center">
  <img src="investigation1.png" alt="Investigation View" width="90%" />
  <br/>
  <em>🕵️ Investigation — Suspect list with cluster graph visualization</em>
</p>

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **npm** 9+

### Option 1: One-Click Launch (Windows)

```bash
# Clone the repository
git clone https://github.com/yourusername/rift-2026.git
cd rift-2026

# Run everything
.\run.bat
```

> This installs dependencies and starts both servers automatically.

### Option 2: Manual Setup

**Backend:**

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.api:app --reload --port 8001
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

**Open:** [http://localhost:5173](http://localhost:5173)

### 📝 CSV Format

Your transaction CSV must contain these columns:

| Column | Type | Description |
|---|---|---|
| `sender` | `string` | Source account ID |
| `receiver` | `string` | Destination account ID |
| `amount` | `float` | Transaction amount |
| `timestamp` | `datetime` | Transaction timestamp |

---

## 📂 Project Structure

```
rift-2026/
├── backend/
│   ├── app/
│   │   ├── api.py              # FastAPI routes & endpoints
│   │   ├── validation.py       # CSV schema validation
│   │   ├── graph_builder.py    # NetworkX directed graph construction
│   │   ├── detection_engine.py # 5 pattern detection algorithms
│   │   ├── scoring_engine.py   # Risk score calculation & ring aggregation
│   │   ├── clustering.py       # Heuristic-based account clustering
│   │   ├── rules.py            # Configurable detection thresholds
│   │   └── schemas.py          # Pydantic data models
│   ├── bucket/                 # Persistent analysis results (JSON + CSV)
│   ├── tests/                  # Test suite
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CirclePackNetwork.jsx    # D3 circle-pack visualization
│   │   │   ├── ForensicsCanvas.jsx      # D3 force-directed graph
│   │   │   ├── InvestigationListPanel.jsx # Suspect list with filters
│   │   │   ├── ActivePatternCard.jsx    # Pattern summary cards
│   │   │   ├── DetectedRingsTable.jsx   # Fraud ring summary table
│   │   │   ├── RiskScoreDistribution.jsx # Risk histogram
│   │   │   ├── Sidebar.jsx              # Navigation + analysis filters
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── IngestionPage.jsx    # File upload interface
│   │   │   ├── DashboardPage.jsx    # Main analytics dashboard
│   │   │   └── InvestigationPage.jsx # Suspect investigation view
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
└── run.bat                     # One-click launcher (Windows)
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `POST` | `/analyze` | Upload CSV and run full analysis pipeline |
| `GET` | `/data` | Retrieve latest analysis batch |
| `GET` | `/investigation/suspects` | Top 10 suspicious nodes with patterns |
| `GET` | `/investigation/network/{node_id}` | Cluster graph for a specific node |
| `GET` | `/export/json` | Download SRS-compliant forensic report |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | High-performance async API framework |
| **NetworkX** | Directed graph construction & traversal |
| **Pandas** | CSV parsing & data manipulation |
| **NumPy** | Numerical computations for scoring |
| **Uvicorn** | ASGI server with hot-reload |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | Component-based UI framework |
| **Vite 7** | Next-gen frontend build tool |
| **D3.js 7** | Force-directed graphs & circle-pack layouts |
| **Tailwind CSS 4** | Utility-first styling |
| **Lucide React** | Modern icon library |
| **Axios** | HTTP client for API calls |

---

## 🔐 How It Works

```
CSV Upload → Validate Schema → Build Directed Graph
    → Run 5 Detection Algorithms (Parallel)
        → Score Each Node (Weighted Composite)
            → Cluster Accounts (Mule / Distribution / Whitelist)
                → Aggregate Fraud Rings
                    → Persist Results (JSON + CSV)
                        → Visualize on Dashboard
```

1. **Upload** a CSV with `sender`, `receiver`, `amount`, `timestamp` columns
2. **Engine** builds a `NetworkX DiGraph` and runs all detectors
3. **Scoring** assigns risk scores (0–100) using weighted rules
4. **Dashboard** renders interactive visualizations with D3.js
5. **Investigate** any suspect to see their full cluster graph
6. **Export** results as SRS-compliant JSON for compliance teams

---

<p align="center">
  <sub>Built with ❤️ for financial security | <b>RIFT 2026</b></sub>
</p>

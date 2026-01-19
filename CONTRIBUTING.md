# Contributing to HyQSim

This guide will help you set up HyQSim locally for development with full Python backend support.

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.12 (recommended) or 3.10+
- **Git**

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shubdeepmohapatra01/HyQSim.git
cd HyQSim
```

### 2. Set Up the Frontend

```bash
cd frontend
npm install
```

### 3. Set Up the Python Backend

#### Create a Virtual Environment

```bash
cd ../backend
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Install bosonic-qiskit

bosonic-qiskit is an external dependency that needs to be installed separately:

```bash
# Clone bosonic-qiskit (from the project root directory)
cd ..
git clone https://github.com/C2QA/bosonic-qiskit.git

# Install it in editable mode
cd backend
source venv/bin/activate
pip install -e ../bosonic-qiskit
```

### 4. Verify Installation

```bash
# Check that bosonic-qiskit is installed
python -c "from bosonic_qiskit import CVCircuit; print('bosonic-qiskit OK')"
```

## Running the Application

### Start the Backend Server

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

The backend will be available at http://localhost:8000

You can verify it's working:
```bash
curl http://localhost:8000/
# Should return: {"service":"HyQSim Backend","status":"running","backends":{"bosonic-qiskit":true}}
```

### Start the Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:5173

### Using the Application

1. Open http://localhost:5173 in your browser
2. The backend status indicator (top-right) should show green "connected"
3. Toggle between "Browser" and "Python" backends in the header
4. Build circuits by:
   - Clicking "+ Qubit" or "+ Qumode" to add wires
   - Dragging gates from the left palette onto wires
   - Clicking gates to edit parameters
5. Click "Run Simulation" to see results

## Project Structure

```
HyQSim/
├── frontend/
│   ├── src/
│   │   ├── components/        # React UI components
│   │   │   ├── GatePalette.tsx
│   │   │   ├── CircuitCanvas.tsx
│   │   │   ├── DisplayPanel.tsx
│   │   │   ├── QubitDisplay.tsx
│   │   │   └── QumodeDisplay.tsx
│   │   ├── simulation/        # Browser-based simulator
│   │   │   ├── simulator.ts   # Main simulation loop
│   │   │   ├── qubit.ts       # Qubit gate implementations
│   │   │   ├── qumode.ts      # Qumode gate implementations
│   │   │   └── complex.ts     # Complex number utilities
│   │   ├── api/
│   │   │   └── backend.ts     # Python backend API client
│   │   ├── types/
│   │   │   └── circuit.ts     # Type definitions and gate registry
│   │   └── App.tsx            # Main application component
│   └── package.json
│
├── backend/
│   ├── simulation/
│   │   ├── bosonic.py         # bosonic-qiskit integration
│   │   └── models.py          # Pydantic request/response models
│   ├── main.py                # FastAPI application
│   └── requirements.txt
│
├── bosonic-qiskit/            # External dependency (not in repo)
├── README.md
└── CONTRIBUTING.md
```

## Development Workflow

### Adding a New Gate

1. **Define the gate** in `frontend/src/types/circuit.ts`:
   - Add to `QUBIT_GATES`, `QUMODE_GATES`, or `HYBRID_GATES` array

2. **Implement browser simulation** in `frontend/src/simulation/`:
   - `qubit.ts` for qubit gates
   - `qumode.ts` for qumode gates
   - `simulator.ts` for hybrid gates

3. **Implement Python backend** in `backend/simulation/bosonic.py`:
   - Add gate ID to `SUPPORTED_*_GATES` set
   - Add gate logic in `run_bosonic_simulation()`

4. **Test both backends** to ensure consistent behavior

### Code Style

- **Frontend**: ESLint + TypeScript strict mode
- **Backend**: Python type hints with Pydantic models

Run linting:
```bash
# Frontend
cd frontend && npm run lint

# Backend (if using ruff/black)
cd backend && ruff check .
```

### Testing a Simulation

You can test the backend directly with curl:

```bash
curl -X POST http://localhost:8000/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "wires": [{"id": "q0", "type": "qumode", "index": 0}],
    "elements": [{
      "id": "e1",
      "gateId": "displace",
      "position": {"x": 100, "y": 50},
      "wireIndex": 0,
      "parameterValues": {"alpha_re": 1.0, "alpha_im": 0.0}
    }],
    "fockTruncation": 8
  }'
```

## Common Issues

### "bosonic-qiskit not installed"

Make sure you:
1. Activated the virtual environment: `source venv/bin/activate`
2. Installed bosonic-qiskit: `pip install -e ../bosonic-qiskit`

### Backend shows "offline" in frontend

1. Check the backend is running on port 8000
2. Check for CORS issues in browser console
3. Verify with: `curl http://localhost:8000/`

### "Fock truncation must be power of 2"

The Python backend (bosonic-qiskit) requires Fock truncation to be a power of 2 (4, 8, 16, 32). The browser backend has no such restriction.

### Simulation errors with hybrid gates

Hybrid gates require both a qubit and a qumode wire. Make sure:
1. The control wire is a qubit
2. The target wire (drag target) is a qumode

## API Reference

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check with backend status |
| `/health` | GET | Simple health check |
| `/simulate` | POST | Run circuit simulation |
| `/simulate/preview` | POST | Quick preview (capped Fock truncation) |

### Simulation Request Format

```json
{
  "wires": [
    {"id": "string", "type": "qubit|qumode", "index": 0}
  ],
  "elements": [
    {
      "id": "string",
      "gateId": "string",
      "position": {"x": 0, "y": 0},
      "wireIndex": 0,
      "targetWireIndices": [1],
      "parameterValues": {"param": 0.0}
    }
  ],
  "fockTruncation": 8
}
```

## Questions?

Open an issue on GitHub or reach out to the maintainers.

# Lindsey's Portfolio

A full-stack portfolio application with Angular frontend and Python backend.

## Project Structure

```
L.Portfolio/
├── frontend/          # Angular application
└── backend/           # Python Flask/FastAPI application
```

## Frontend (Angular)

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI

### Setup
```bash
cd frontend
npm install
ng serve
```

The application will be available at `http://localhost:4200`

## Backend (Python)

### Prerequisites
- Python 3.9 or higher
- pip

### Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On macOS/Linux
pip install -r requirements.txt
python app.py
```

The API will be available at `http://localhost:5000`

## Development

### Frontend Development
```bash
cd frontend
ng serve --open
```

### Backend Development
```bash
cd backend
source venv/bin/activate
python app.py
```

## Build

### Frontend Production Build
```bash
cd frontend
ng build --configuration production
```

## License
MIT

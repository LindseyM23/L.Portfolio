# Backend README

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
source venv/bin/activate  # On macOS/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file:
```bash
cp .env.example .env
```

5. Run the application:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### GET /
Health check endpoint

### GET /api/hello
Returns a welcome message

### GET /api/about
Returns information about the portfolio

### POST /api/contact
Submit a contact form
- Required fields: name, email, message

## Development

The application runs in debug mode by default. Changes to the code will automatically reload the server.

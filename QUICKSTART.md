# 🚀 Quick Start Guide

## Prerequisites Installed ✅
- ✅ Angular dependencies installed
- ✅ Python virtual environment created
- ✅ Python dependencies installed

## Running the Application

### Option 1: Using the Start Script (Recommended)
Run both frontend and backend together:
```bash
./start.sh
```

### Option 2: Manual Start

#### Start Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate
python app.py
```

#### Start Frontend (Terminal 2)
```bash
cd frontend
npm start
```

## Access the Application

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/
- **Hello Endpoint**: http://localhost:5000/api/hello

## Project Structure

```
L.Portfolio/
├── frontend/              # Angular 17 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   └── home/
│   │   │   ├── app.component.*
│   │   │   ├── app.config.ts
│   │   │   └── app.routes.ts
│   │   ├── environments/
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.scss
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
├── backend/               # Python Flask API
│   ├── venv/             # Virtual environment
│   ├── app.py            # Main application
│   ├── config.py         # Configuration
│   ├── routes.py         # API routes
│   ├── requirements.txt  # Python dependencies
│   └── .env             # Environment variables
│
├── .vscode/              # VS Code configuration
│   ├── extensions.json  # Recommended extensions
│   ├── launch.json      # Debug configurations
│   └── tasks.json       # Build tasks
│
├── start.sh             # Quick start script
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## Available API Endpoints

### GET /
Health check endpoint

### GET /api/hello
Returns a welcome message
```json
{
  "message": "Welcome to Lindsey's Portfolio!",
  "status": "success"
}
```

### GET /api/about
Returns portfolio information
```json
{
  "name": "Lindsey",
  "role": "Full-Stack Developer",
  "technologies": {
    "frontend": ["Angular", "TypeScript", "SCSS"],
    "backend": ["Python", "Flask"],
    "tools": ["Git", "VS Code"]
  },
  "status": "success"
}
```

### POST /api/contact
Submit a contact form
```json
{
  "name": "Your Name",
  "email": "your@email.com",
  "message": "Your message"
}
```

## Technologies Used

### Frontend
- **Angular 17**: Modern web framework with standalone components
- **TypeScript**: Type-safe JavaScript
- **SCSS**: CSS preprocessor
- **RxJS**: Reactive programming
- **Angular Router**: Client-side routing
- **HttpClient**: HTTP communication

### Backend
- **Python 3.9+**: Programming language
- **Flask 3.0**: Web framework
- **Flask-CORS**: CORS support
- **python-dotenv**: Environment variables
- **Werkzeug**: WSGI utility library

## Development Tips

### Frontend Development
- Hot reload is enabled - changes will appear automatically
- Components are standalone (no NgModule required)
- Environment variables in `src/environments/`

### Backend Development
- Debug mode is enabled by default
- Changes trigger automatic reload
- Environment variables in `backend/.env`

### VS Code Integration
- **Debug**: Use F5 to start debugging
- **Tasks**: Run "Start Full Stack" task to start both servers
- **Extensions**: Install recommended extensions for best experience

## Next Steps

1. **Customize the Home Component**: Edit `frontend/src/app/components/home/`
2. **Add More Routes**: Update `frontend/src/app/app.routes.ts`
3. **Create API Endpoints**: Add routes in `backend/routes.py`
4. **Style Your App**: Edit `frontend/src/styles.scss`
5. **Add Components**: Create new Angular components as needed

## Troubleshooting

### Port Already in Use
If you see "port already in use" errors:
- **Frontend (4200)**: `lsof -ti:4200 | xargs kill -9`
- **Backend (5000)**: `lsof -ti:5000 | xargs kill -9`

### Dependencies Issues
- **Frontend**: Delete `node_modules` and run `npm install` again
- **Backend**: Delete `venv` and recreate: `python3 -m venv venv`

### CORS Issues
CORS is configured in `backend/app.py`. The backend accepts requests from any origin by default in development.

## Building for Production

### Frontend
```bash
cd frontend
ng build --configuration production
```
Output will be in `frontend/dist/`

### Backend
Update `backend/.env`:
```
FLASK_ENV=production
DEBUG=False
```

## License
MIT

---

**Happy Coding! 🎉**

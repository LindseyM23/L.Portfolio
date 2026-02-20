# Frontend README

## Angular Portfolio Frontend

This is the frontend application built with Angular 17 using standalone components.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## Installation

```bash
npm install
```

## Development Server

Run the development server:

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Build

Build the project for production:

```bash
npm run build
# or
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── app/
│   ├── components/       # Application components
│   │   └── home/        # Home page component
│   ├── app.component.*  # Root component
│   ├── app.config.ts    # Application configuration
│   └── app.routes.ts    # Routing configuration
├── environments/         # Environment configurations
├── assets/              # Static assets
├── index.html           # Main HTML file
├── main.ts              # Application entry point
└── styles.scss          # Global styles
```

## Features

- **Standalone Components**: Uses Angular's modern standalone component architecture
- **Routing**: Configured with Angular Router
- **HTTP Client**: Set up for API communication
- **SCSS**: Styling with Sass preprocessor
- **Responsive Design**: Mobile-friendly layout

## API Integration

The application communicates with the Python backend API. The API URL is configured in the environment files:

- Development: `src/environments/environment.ts`
- Production: `src/environments/environment.prod.ts`

## Testing

Run unit tests:

```bash
ng test
```

## Linting

Run linting:

```bash
ng lint
```

## Further Help

To get more help on the Angular CLI use `ng help` or check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

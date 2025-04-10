# Mundus Editor

A news article management and summarization application built with React and Flask.

## Features

- News article browsing and filtering
- Multi-country support (Sweden, Poland, Finland, Denmark)
- Article summarization using AI
- Writeup generation and management
- Modern, responsive UI

## Local Development

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
5. Start the backend server:
   ```bash
   python backend.py
   ```

### Frontend Setup
1. Navigate to the root directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This application is configured for deployment on Render. The deployment consists of two services:

1. Backend Service (`mundus-backend`)
   - Python web service
   - Handles API requests and database operations
   - Requires OpenAI API key as environment variable

2. Frontend Service (`mundus-frontend`)
   - Static web service
   - Serves the React application
   - Automatically configured to connect to the backend service

### Deployment Steps
1. Push your code to a Git repository
2. Connect your repository to Render
3. Render will automatically detect the `render.yaml` configuration
4. Set the `OPENAI_API_KEY` environment variable in the Render dashboard
5. Deploy both services

## Environment Variables

### Backend
- `OPENAI_API_KEY`: Your OpenAI API key
- `FLASK_ENV`: Set to 'production' in production
- `FLASK_APP`: Set to 'backend.py'

### Frontend
- `VITE_API_URL`: The URL of the backend service
  - Development: http://localhost:5000
  - Production: https://mundus-backend.onrender.com

## Project Structure

```
mundus-editor-react/
├── src/
│   ├── components/     # React components
│   ├── api/           # API service functions
│   ├── styles/        # CSS styles
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Application entry point
├── backend/
│   ├── backend.py     # Flask backend server
│   ├── requirements.txt
│   └── .env          # Environment variables
└── public/           # Static assets
```

## Development

- The frontend is built with React and TypeScript
- The backend is built with Flask
- Styling is done with CSS modules
- API communication is handled through fetch requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

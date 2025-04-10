# Mundus Editor React

A modern React application for news article management and summarization.

## Features

- News article browsing and filtering
- Multi-country support (Sweden, Poland, Finland, Denmark)
- Article summarization using AI
- Writeup generation and management
- Modern, responsive UI

## Prerequisites

- Node.js (v18 or higher)
- Python 3.8 or higher
- OpenAI API key

## Setup

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the backend directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Running the Application

1. Start the backend server:
   ```bash
   cd backend
   python backend.py
   ```
   The backend will run on http://localhost:5000

2. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:5173

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

# Mundus Editor

A proprietary React-based news article editor developed by Mundus International that allows users to generate and edit writeups from multiple news sources across different countries.

## Features

- Multi-country news database support (Sweden, Denmark, Finland, Poland)
- Article selection and merging capabilities
- AI-powered article summarization
- Rich text editing with TipTap
- Source attribution and linking
- Responsive design

## Tech Stack

- Frontend:
  - React with TypeScript
  - Vite
  - TipTap Editor
  - CSS Modules

- Backend:
  - Python
  - Flask
  - SQLite
  - OpenAI API

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mundus-editor-react.git
cd mundus-editor-react
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory with your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

5. Start the development servers:

Frontend (in root directory):
```bash
npm run dev
```

Backend (in backend directory):
```bash
python backend.py
```

## Project Structure

```
mundus-editor-react/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── api/               # API integration
│   ├── types/             # TypeScript type definitions
│   └── styles/            # CSS styles
├── backend/               # Backend server
│   ├── backend.py         # Main server file
│   └── requirements.txt   # Python dependencies
└── public/               # Static assets
```

## License

This is proprietary software owned by Mundus International. All rights reserved. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

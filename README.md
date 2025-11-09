# Workik AI – Test Case Generator

AI-powered test case generation that analyzes selected files from your GitHub repo, produces concise test case summaries, and converts them into ready‑to‑use unit tests with one click.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)]()
[![React](https://img.shields.io/badge/React-18-blue?logo=react&logoColor=white)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?logo=mongodb&logoColor=white)]()

---

## Overview
Workik AI connects to GitHub, lets you browse repository files, and uses an AI provider to understand functions, classes, and logic before generating test scenarios and executable test code. The goal is to boost coverage, cut manual work, and reduce regressions while keeping developer flow fast.

## Features
- Secure GitHub integration to browse repos and select files for analysis
- AI‑driven test case summaries for functions, methods, and classes
- One‑click conversion to framework‑specific test code (copy/download)
- History of generated tests and logs for reproducibility
- Clean React + Tailwind UI and a scalable Express API

## Tech Stack
- Frontend: React 18, Vite, Tailwind CSS, Fetch API
- Backend: Node.js, Express, GitHub REST API, AI provider (e.g., Gemini)
- Database: MongoDB (Atlas or local)
- DevOps: Docker, docker‑compose (optional)

<img width="547" height="430" alt="image" src="https://github.com/user-attachments/assets/93c68e82-6598-4fb6-971a-5fe125654d24" />

## Prerequisites
- Node.js 18+ and npm
- MongoDB URI (local or Atlas)
- GitHub access (PAT for HTTPS or SSH setup)
- Docker Desktop (only if using containers)

## Quick Start (Local)

Install dependencies:

cd backend && npm install
cd ../frontend && npm install

Environment files:

PORT=5000
MONGODB_URI=mongodb://localhost:27017/workik-ai
GITHUB_TOKEN=ghp_xxx # or pass via header/session
AI_PROVIDER_KEY=your_ai_key
AI_MODEL=gemini-1.5-pro # or your chosen model

frontend/.env (Vite)
VITE_API_BASE_URL=http://localhost:5000

Run development servers:

terminal 1
cd backend
npm run dev

terminal 2
cd frontend
npm run dev

Open the frontend dev URL shown in your terminal (often http://localhost:5173).

## Docker (Optional)

docker compose up --build

This starts the API, UI, and MongoDB using the compose definitions.

## Usage

1) Connect GitHub and choose a repository  
2) Browse files (e.g., src/services/*.ts) and select for analysis  
3) Generate AI summaries; review and tweak if needed  
4) Convert to test code and copy/download into your project’s tests directory

## Scripts

Backend:

npm run dev # nodemon dev
npm run start # production start
npm run lint # lint backend
npm run test # backend tests (if configured)

Frontend:

npm run dev # vite dev
npm run build # production build
npm run preview # preview build
npm run lint # lint frontend
npm run test # frontend tests (if configured)

## Environment Notes

- Never commit secrets; keep `.env` files out of Git and track `.env.example` instead  
- If using HTTPS with GitHub, create a Personal Access Token and use it as the password when prompted  
- For SSH, ensure your key is added to your GitHub account

## Roadmap

- More test frameworks (Jest, Mocha, PyTest, TestNG, Cucumber)
- CI integrations to annotate PRs with suggested tests and coverage deltas
- Prompt templates per language/library for consistent outputs

## Contributing

Contributions are welcome! Please fork, create a feature branch, and open a pull request with a clear description, screenshots (if UI), and tests where relevant.




## Monorepo Structure

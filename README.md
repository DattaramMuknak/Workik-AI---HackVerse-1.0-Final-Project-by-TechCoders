# 📘 Workik AI – Test Case Generator

AI-powered assistant that connects to GitHub, understands your code, and converts AI-generated summaries into ready-to-use unit tests with a single click to speed up delivery and improve quality[web:41].

## 🧭 Table of Contents
- What is this
- Problem → Solution
- Key features
- Tech stack
- Repo structure
- Quick start
- Environment variables
- Docker
- How it works
- API sketch
- Data model
- Security & privacy
- Roadmap
- Hackathon fit
- Contributing
- Contact

---

## 💡 What is this
Workik AI integrates with GitHub, lets you select code files, analyzes their logic with AI, and generates both human-readable test summaries and executable test files instantly[web:46].  
This reduces manual test authoring, increases code coverage, and promotes a pragmatic form of test-driven development[web:45].

## ❗ Problem → ✅ Solution
- Problem: Writing comprehensive unit tests is repetitive, time-consuming, and often skipped under deadline pressure[web:45].  
- Solution: Let AI analyze functions, methods, and classes, propose robust scenarios, and one-click synthesize framework-ready tests for immediate integration[web:46].

## 🎯 Key features
- 🔗 GitHub Integration: securely browse repositories and pick files for analysis to keep developers in their natural workflow[web:41].  
- 🤖 AI-Powered Analysis: scans code structure and behavior to propose thorough test scenarios with edge cases and happy paths[web:46].  
- 📝 Test Case Summaries: multiple concise summaries appear in the UI for review and quick iteration before code generation[web:45].  
- ⚡ One-Click Test Code: generate, copy, or download tests and drop them directly into your project’s test directories[web:41].  
- 🧾 History & Logs: persist sessions, selections, and generations to reproduce, compare, and audit outcomes across teams[web:46].  
- 🖥️ Clean UI: React + Tailwind provides a fast, focused review experience with minimal friction[web:45].

## 🧰 Tech stack
- Frontend: React, Vite, Tailwind, Fetch API for a responsive developer experience[web:46].  
- Backend: Node.js, Express, GitHub API, and an AI provider (e.g., Gemini) for orchestration and synthesis[web:45].  
- Database: MongoDB for sessions, repository selections, and test generation history[web:41].  
- Tooling: Optional Docker and docker-compose for consistent local and demo environments[web:46].

## 🗂️ Repo structure
<img width="607" height="620" alt="image" src="https://github.com/user-attachments/assets/0c372dea-df0b-400d-b08c-6747536ae34a" />

This mirrors a clear monorepo split for frontend and backend, aiding parallel development and quick onboarding[web:41].

## 🚀 Quick start
Install dependencies for both apps to set up development quickly[web:45].  
<img width="308" height="123" alt="image" src="https://github.com/user-attachments/assets/80f7f353-e3d7-410b-b7e4-3b9090709678" />

Run development servers for API and UI in separate terminals for fast iteration loops[web:46].  
<img width="188" height="260" alt="image" src="https://github.com/user-attachments/assets/c62d0697-84c1-4dcf-a43a-705df2e0c11b" />

## 🔐 Environment variables
Create `.env` files and never commit secrets; track a `.env.example` for teammates to replicate environment safely[web:45].  
- backend/.env: `PORT`, `MONGODB_URI`, `GITHUB_TOKEN`, `AI_PROVIDER_KEY`, `AI_MODEL` for server, database, and provider configuration[web:46].  
- frontend/.env: `VITE_API_BASE_URL` for API routing from the SPA to the backend in different environments[web:41].

## 🐳 Docker (optional)
Use docker-compose for a one-command setup that spins up API, UI, and MongoDB with consistent defaults for demos and workshops[web:41].  
docker compose up --build

## 🔎 How it works
1) Connect GitHub and select a repository to scope analysis and permissions clearly[web:45].  
2) Browse files and choose targets like services, controllers, or utilities for best ROI on coverage[web:41].  
3) Generate AI summaries, review scenarios, and tweak as needed to capture edge cases and invariants[web:46].  
4) Convert summaries to ready-to-use test code and copy or download them into your tests folder for immediate execution[web:45].

## 🧭 API sketch
- `POST /api/auth/github` — start an authenticated session for repository access under user consent[web:41].  
- `GET /api/repos/:owner/:repo/files` — list files for selection with filtering by directory or extension[web:46].  
- `POST /api/test/summarize` — accept code blob or file path and return AI-written test case summaries[web:45].  
- `POST /api/test/generate` — convert selected summaries to framework-specific test code artifacts[web:41].  
- `GET /api/history` — fetch generation history and logs for reproducibility and audits[web:46].

## 🗄️ Data model
- `users`: minimal profile plus session linkage to provider tokens under secure storage where allowed[web:45].  
- `selections`: repository metadata, chosen file paths, timestamps, and branch context for traceability[web:46].  
- `generations`: prompts, summaries, test artifacts, and outcome metadata for review and rollbacks[web:41].

## 🛡️ Security & privacy
- Store only what is necessary for the session and generation history defined by users to reduce risk[web:45].  
- Keep secrets in environment variables and avoid committing credentials to the repository at all times[web:41].  
- Provide an opt-out to purge stored histories so teams can comply with internal policies and audits[web:46].

## 🗺️ Roadmap
- Expand targets: Jest, Mocha, PyTest, TestNG, and Cucumber for language and framework breadth[web:46].  
- PR assistant: suggest tests on pull requests and annotate diffs with coverage deltas for immediate feedback loops[web:45].  
- Prompt libraries: tuned templates per stack to standardize outputs and improve determinism across teams[web:41].

## 🏆 Hackathon fit
- Clear problem-solution narrative that resonates with developer productivity and quality metrics judges care about[web:45].  
- Demo in under five minutes: connect repo, pick files, generate summaries, produce tests, and run them live[web:41].  
- Strong extensibility story via modular adapters for frameworks, providers, and CI/CD integrations[web:46].

## 🤝 Contributing
Fork the repository, create a feature branch, and open a pull request with a concise description, screenshots if UI, and tests where applicable for quick and fair reviews[web:45].



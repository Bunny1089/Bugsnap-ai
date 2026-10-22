# Contributing to BugSnap AI 🤝

Thank you for your interest in contributing to **BugSnap AI**! BugSnap AI is an open-source, local-first developer tool built for Hacktoberfest and the broader open-source community.

We welcome all kinds of contributions: bug fixes, benchmark presets, documentation enhancements, UI polish, accessibility improvements, and localization.

---

## 🔒 Non-Negotiable Core Rule: 100% Local Privacy

> **Critical Guideline:** BugSnap AI is strictly **100% local**.
> - **Zero cloud AI endpoints:** Never add calls to external LLMs, cloud vision APIs, or third-party inference providers.
> - **Zero remote telemetry:** Never add analytics beacons, tracking pixels, or remote telemetry scripts.
> - **In-memory image safety:** Uploaded screenshots must be handled in memory and never persisted unencrypted to the local filesystem or sent over external networks.

Every Pull Request is audited against this core privacy guarantee.

---

## 🛠 Development Setup

### 1. Prerequisites
- **Ollama**: Installed and running locally (`ollama serve`). Pull the model:
  ```bash
  ollama pull gemma4:e2b
  ```
- **Python**: Version 3.10 or higher.
- **Node.js**: Version 18+ with `npm`.

### 2. Fork & Clone
```bash
git clone https://github.com/Bunny1089/BUGSNAP.git
cd BUGSNAP
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --port 8000 --reload
```
Verify the backend is live at `http://127.0.0.1:8000/health`.

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌿 Branching & Pull Request Workflow

1. **Create a topic branch:**
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```
2. **Make focused, atomic commits:**
   ```bash
   git commit -m "feat: add Jira markdown export format"
   ```
3. **Run tests & quality checks before pushing:**
   - **Backend pytest:**
     ```bash
     cd backend
     python -m pytest -v
     ```
     Ensure all 21+ tests pass with zero errors.
   - **Frontend build & lint:**
     ```bash
     cd ../frontend
     npm run build
     npm run lint
     ```
     Ensure Vite compiles the production bundle cleanly and Oxlint reports no errors.
4. **Push and open a Pull Request:**
   - Push to your fork: `git push origin feat/your-feature-name`.
   - Open a PR against `main`.
   - Provide a concise summary of the changes and screenshots of UI modifications.

---

## 🎯 How to Pick a Good First Issue

Looking for a place to start? Here are recommended beginner-friendly tasks:

| Area | Task Description | Starting Pointers |
| :--- | :--- | :--- |
| **Export Formats** | Add a button to copy or download issue drafts in Jira or GitLab format. | Look at `handleCopyMarkdown` and `buildMarkdownFromDraft` in `frontend/src/App.jsx`. |
| **Benchmark Presets** | Add new real-world scenario presets (e.g. mobile Safari viewport, 500 error). | Add items to `SAMPLE_PRESETS` in `frontend/src/App.jsx` and generate PNGs via `backend/make_samples.py`. |
| **Themes** | Add a light / dark theme toggle. | Extend CSS tokens in `frontend/src/index.css` and `App.css`. |
| **Localization** | Add internationalization / translations (Hindi, Marathi, Spanish). | Extract strings from `Landing.jsx` and `App.jsx` into localized dictionaries. |
| **Testing** | Add unit tests for edge-case uploads or multi-image merging. | Check `backend/tests/test_analyze.py`. |
| **Accessibility** | Audit ARIA labels, focus rings, and screen-reader announcements. | Test keyboard navigation across dropdowns and canvas modal in `App.jsx`. |

---

## 📜 Code Style & Conventions

- **Python**: Follow PEP 8 conventions. Use type hints for function signatures and Pydantic models for request/response payloads.
- **JavaScript / React**: Use functional components, React 19 hooks, and clean prop signatures. Keep styling aligned with existing CSS design tokens in `index.css` (`var(--bg-...)`, `var(--accent-...)`, `var(--border-...)`).
- **Git Commit Messages**: Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).

---

## ⚖️ License

By contributing to BugSnap AI, you agree that your contributions will be licensed under the project's [Apache 2.0 License](LICENSE).

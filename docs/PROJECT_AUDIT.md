# BugSnap AI — Project Architecture & Implementation Audit

**Audit Date:** 2026-10-22  
**Target:** BugSnap AI (Local Vision Model Issue Drafter)  
**Evaluator:** Antigravity Pair-Programming Assistant  
**Status:** Working baseline (FastAPI + React/Vite + Ollama Gemma 4 E2B)

---

## 1. Actual Architecture & Request Flow

```
[ User Browser / Client ]
       │
       ├── (1) Direct interaction: Drag-and-drop screenshot, paste (Ctrl+V), or preset selection
       ├── (2) Optional context input: Reporter notes on intended action
       │
       ▼
[ Vite React Frontend (Port 5173) ]
       │
       ├── Vite Proxy: /health, /analyze -> http://127.0.0.1:8000
       │
       ▼
[ FastAPI Backend (Port 8000) - app.py ]
       │
       ├── (3) In-Memory Image Validation (analyzer.py)
       │       • Checks format: PNG, JPEG, WebP
       │       • Enforces size bound: <= 10 MB (returns 413 if oversized)
       │       • Normalizes dimensions: Converts to RGB, bounds max dimension to 1024px
       │       • Encodes to base64 in RAM; never saves screenshot to disk
       │
       ▼
[ Local Ollama Instance (Port 11434) - /api/chat ]
       │
       ├── Model: gemma4:e2b (4.6 GB Q4_K_M weights)
       ├── Parameters: stream=False, keep_alive="10m", format="json"
       ├── System Prompt: Strict schema enforcement, anti-hallucination rules,
       │   visible evidence vs. hypotheses segregation, "Unknown" defaults
       │
       ▼
[ Output Processing & Normalization (analyzer.py & models.py) ]
       │
       ├── JSON sanitization & Pydantic schema validation (BugDraft)
       ├── Clean GitHub-flavored Markdown generation
       │
       ▼
[ Frontend Issue Reviewer (App.jsx) ]
       ├── Structured Field Editor (Evidence, Hypotheses, Steps, Environment)
       ├── Live Synchronized Markdown Preview & Raw Markdown view
       ├── One-click Clipboard Copy & Local .md File Download
       └── Watermelon UI Accessible Alert Notifications
```

---

## 2. Existing Features & Source Files

| Feature | Primary Source Files | Status |
| :--- | :--- | :--- |
| **Local Health & Ollama Probe** | `backend/app.py`, `backend/tests/test_api.py` | Verified (checks `127.0.0.1:11434/api/tags` and `gemma4:e2b`). |
| **In-Memory Image Validation** | `backend/analyzer.py` | Verified (Pillow format, dimension, and 10 MB size limits). |
| **Ollama Vision Inference** | `backend/analyzer.py`, `backend/app.py` | Verified (local chat API call with base64 image in RAM). |
| **Anti-Hallucination Prompting** | `backend/analyzer.py` | Verified (strictly labels hypotheses, defaults missing to "Unknown"). |
| **Pydantic Schema Validation** | `backend/models.py` | Verified (`BugDraft` model with typed fields). |
| **Backend Test Suite (17 tests)** | `backend/tests/test_api.py`, `backend/tests/test_analyze.py` | Verified (17 passed in 0.74s). |
| **React/Vite Frontend** | `frontend/src/App.jsx`, `frontend/src/App.css`, `frontend/src/index.css` | Verified (scaffolded, responsive, dark-mode styling). |
| **Watermelon UI Accessible Alerts**| `frontend/src/components/Alert.jsx`, `Alert.css` | Verified (`error`, `warning`, `success`, `info` variants). |
| **Demo Preset Screenshots** | `backend/make_samples.py`, `frontend/public/samples/` | Verified (3 synthetic bug screenshots available). |
| **Documentation & Guardrails** | `BUGSNAP_HACKATHON_GUARDRAILS.md`, `README.md`, `LICENSE` | Verified (complete setup, hardware notes, and disclosure). |

---

## 3. Verified Functionality vs. Unverified Claims

| Area | Stated / Expected Claim | Actual Verification Result | Status |
| :--- | :--- | :--- | :--- |
| **Local Inference** | 100% local; zero cloud AI APIs | Inspected network calls: only talks to `127.0.0.1:11434`. Zero cloud AI keys or dependencies. | ✅ Verified |
| **Privacy / No Persistence** | Uploaded screenshots are never written to disk | Code audit confirms image bytes are processed via `io.BytesIO` in memory; zero file writes. | ✅ Verified |
| **Model Compatibility** | Uses `gemma4:e2b` via Ollama | Tested with real synthetic screenshots; extracted exact error texts in ~14–19s. | ✅ Verified |
| **Clipboard Image Paste** | Press Ctrl+V to paste screenshot | Implemented; needs non-image clipboard guard to prevent silent drops or confusing feedback. | ⚠️ Needs Polish |
| **Issue Field Editing** | Edits sync immediately with Markdown | Implemented; markdown generator must reflect all fields including suggested category/severity. | ⚠️ Needs Polish |
| **Ollama Cold-Start** | Instant analysis on startup | Model load on cold start takes ~25–35s. Warm inference takes ~14–19s. Documented in README. | ✅ Documented |

---

## 4. Bugs, Security/Privacy Concerns & UX Problems

### Bugs / Edge Cases
1. **Clipboard Non-Image Paste**: If a user has text or empty data in their clipboard and presses `Ctrl+V`, the event is ignored silently without giving the user feedback that an image was expected.
2. **Alert Spam**: Rapidly clicking copy or triggering multiple validation checks could replace alerts without a smooth transition or animate multiple toasts if not stacked properly.
3. **Draft Synchronization**: If user manually switches to "Raw Markdown" and edits text, switching back to "Structured Editor" does not back-propagate edits into structured fields (one-way synchronization from fields to Markdown).

### Security & Privacy
1. **Google Fonts CDN**: `frontend/index.html` loads Inter and JetBrains Mono from Google Fonts. For an air-gapped or 100% offline environment, fallback system fonts or self-hosted fonts should be cleanly handled.
2. **Untrusted Screenshot Text**: Vision models read text from screenshots that could contain prompt injection. The system prompt explicitly instructs the model to treat visual text as untrusted data, not application instructions.

### UX Problems
1. **Color Contrast / Accent Harmony**: The current UI has vibrant pink/indigo gradients that can be toned down to a sleek, restrained dark charcoal developer-tool palette with refined violet/indigo accents.
2. **Honest Loading Feedback**: Shimmer progress bar previously simulated stages with arbitrary timers. Replacing this with clear indeterminate status messages ("Analyzing screenshot locally with Gemma 4 E2B via Ollama...") is more truthful.
3. **Missing Draft History**: Users lose their drafted issue if they refresh or clear before copying/downloading. A lightweight local draft history stored in browser `localStorage` (without persisting heavy image data) provides immense value.

---

## 5. Recommended Changes Ranked by Priority

### P0 (Must Have for Hackathon Quality & Correctness)
- [x] **Anti-Hallucination Hardening**: Ensure reproduction steps and environment never invent ungrounded details. (Completed in Phase 4 baseline).
- [ ] **Cohesive Dark Charcoal Redesign**: Refine color palette to deep charcoal (`#0C0F17`, `#161B26`), subtle violet borders (`#6366F1`), and clear typography hierarchy.
- [ ] **Accessible Toast / Alert Stack**: Refine alert system with `prefers-reduced-motion`, keyboard dismiss, auto-close timers, and duplicate prevention.
- [ ] **Honest Indeterminate Loading Indicator**: Replace artificial stage timers with truthful local inference status.

### P1 (High-Value Feature Enhancements)
- [ ] **Feature A: Image Input Polish**: Add dedicated "Replace Screenshot" button, image dimension and size badge, and friendly feedback if non-image data is pasted from clipboard.
- [ ] **Feature B: Comprehensive Issue Editor**: Add Suggested Severity (`Low`, `Medium`, `High`, `Critical`) and Suggested Category (`UI/Layout`, `Functional`, `Crash/Exception`, `Network/API`, `Performance`), clearly labeled as `(Suggested)`. Ensure all fields synchronize into the exported Markdown.
- [ ] **Feature C: Evidence-Aware Review**: Visual badges distinguishing `📸 Directly Observed Evidence` vs `👤 Reporter Context` vs `💡 Unverified Hypotheses`.

### P2 (Optional Quality of Life)
- [ ] **Feature D: Local Draft History**: Save draft text and metadata to `localStorage` (`bugsnap_draft_history`), with view, load, delete, and clear controls. Never save heavy image binary data to localStorage.

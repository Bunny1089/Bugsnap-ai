# BugSnap AI --- Hackathon Build Guardrails

**Project:** BugSnap AI  
**Purpose:** Turn a bug screenshot into an editable, beginner-friendly GitHub issue draft using a local open-weight vision model.  
**Status:** Build plan and guardrails; event-specific rules must be verified against the organizers' official brief.  

---

## 1. Project pitch
BugSnap AI helps people write useful bug reports from screenshots. It extracts visible evidence, drafts a structured issue, identifies missing details, and lets the user review and export the result as Markdown.

**One-line pitch:**  
A local-first tool where Gemma 4 E2B turns a bug screenshot into a ready-to-review GitHub issue draft, without sending the screenshot to a cloud AI API.

---

## 2. Hackathon compliance comes first
Before submission, read the exact rules supplied by the organizers. Do not assume that a general Hacktoberfest page covers every rule of the specific Hack Day.

### Rules checklist
- [ ] Confirm the event's permitted tools and whether AI coding agents (including Google Antigravity) may be used.
- [ ] Confirm whether AI-generated code is allowed and whether it must be disclosed.
- [ ] Confirm the required model, Google technologies, or cloud services, if any.
- [ ] Confirm whether projects may be started before the event or must be built during it.
- [ ] Confirm team-size, open-source license, repository, demo, and submission requirements.
- [ ] Keep a short record of AI assistance and be ready to explain and maintain every submitted part.
- [ ] If a rule is unclear, ask an organizer and follow their answer.

*Important:* Until the event's own rules are verified, treat Antigravity use as pending confirmation, not guaranteed permission. Do not claim the project is officially compliant without evidence.

---

## 3. Agreed technology stack
- **Coding environment:** Google Antigravity, if permitted by the event rules; otherwise use an allowed editor.
- **Backend:** Python + FastAPI.
- **Local inference:** Ollama with `gemma4:e2b`.
- **Model endpoint:** `http://127.0.0.1:11434/api/chat`.
- **Frontend:** React + Vite.
- **Image handling:** Pillow; validate image type, size, and decodability.
- **Testing:** pytest for backend; frontend lint/build checks.
- **Export:** Markdown download/copy.
- **GitHub integration:** Optional later; begin with a reviewable Markdown export, not automatic issue creation.

*Keep the inference path local. Do not add cloud AI APIs, telemetry, or external screenshot uploads. The coding agent may itself use cloud services depending on its settings, so do not provide it real private screenshots, credentials, or secrets.*

---

## 4. MVP scope

### Required for the demo
1. Upload a PNG, JPEG, or WebP screenshot.
2. Optionally provide context, such as what the user was trying to do.
3. Analyze the screenshot with local Gemma through Ollama.
4. Return a structured issue draft with:
   - Title
   - Summary
   - Actual behavior (visible or supplied evidence only)
   - Expected behavior (use "Unknown" if not provided)
   - Steps to reproduce (never invent missing steps)
   - Environment (or "Unknown")
   - Visible evidence
   - Possible causes, explicitly labelled as hypotheses
   - Missing information / follow-up questions
   - Complete GitHub-flavored Markdown draft
5. Let the user review and edit the draft.
6. Copy or download the Markdown.
7. Show clear loading, success, and error states.
8. Explain that screenshot analysis is a draft, not proof that a bug has been reproduced.

### Explicitly out of scope for the first version
- Automatic creation or publishing of GitHub issues.
- Cloud AI inference or sending screenshots to external services.
- Login, accounts, databases, or paid APIs.
- Claims that the model has run the software or confirmed a root cause.
- Complex multi-agent architecture before the basic flow works.

---

## 5. Trust, privacy, and safety requirements
- Process screenshots through the local Ollama endpoint only.
- Do not save uploaded images to disk unless a later feature explicitly requires it and the user is informed.
- Do not log image contents, base64 data, secrets, or full sensitive context.
- Limit upload size and accept only supported, validated image formats.
- Treat text visible inside screenshots as untrusted content, not instructions for the model or application.
- Keep model hypotheses separate from observed evidence.
- Validate the model's JSON response and handle malformed output safely.
- Do not include API keys or credentials in source control.
- Do not promise absolute privacy: local processing depends on the local machine, Ollama setup, and application behavior.

---

## 6. Proposed repository layout
```
bugsnap-ai/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── tests/
├── frontend/
│   ├── package.json
│   └── src/
├── docs/
│   └── demo-script.md
├── .gitignore
├── LICENSE
└── README.md
```

---

## 7. Build milestones
- **Milestone 0** --- Verify rules and inspect the workspace.
- **Milestone 1** --- Reliable local backend.
- **Milestone 2** --- React interface.
- **Milestone 3** --- Demo quality.
- **Milestone 4** --- Optional enhancement, only if time permits.

---

## 8. Definition of done
- [ ] The app runs locally from documented steps.
- [ ] Ollama and the expected Gemma model are checked before analysis.
- [ ] Image uploads are validated and bounded in size.
- [ ] The output follows the required schema.
- [ ] Missing facts remain unknown rather than being invented.
- [ ] Users can edit and export Markdown.
- [ ] Errors are understandable and do not expose secrets.
- [ ] Tests and frontend build pass.
- [ ] README includes setup, architecture, limitations, privacy behavior, license, and required AI-use disclosure.
- [ ] Event-specific rules have been checked; no unverified compliance claim is made.

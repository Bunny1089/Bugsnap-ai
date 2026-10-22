# BugSnap AI — 90-Second Hackathon Demo Script

**Project:** BugSnap AI  
**Presenter:** Team BugSnap  
**Time Limit:** 60–90 seconds  

---

## 🎬 0:00 – 0:15 | The Problem & The Pitch
> *"Every day, engineers and open-source maintainers receive vague bug reports like 'it crashed' or an unannotated screenshot with zero context. Writing good bug reports is tedious, and developers spend hours asking follow-up questions.*  
> *Meet **BugSnap AI**: A local-first developer tool that turns a bug screenshot into an editable, structured GitHub issue draft in seconds—powered by Google's **Gemma 4 E2B** running completely locally on our machine."*

---

## 🔒 0:15 – 0:30 | Privacy & Local-First Architecture
> *(Point to the header badges on screen)*  
> *"Notice the badge: **100% Local Inference**. In enterprise or proprietary software, you can never upload confidential UI screenshots or customer error screens to third-party cloud AI APIs.*  
> *BugSnap AI communicates strictly with our local Ollama instance on `127.0.0.1:11434`. The screenshot never leaves the browser and local machine. No external telemetry, no cloud tokens."*

---

## ⚡ 0:30 – 0:60 | Live Demonstration
> *(Click **Sample 1: HTTP 404 Route Error** or drag-and-drop a screenshot)*  
> *"Here, a user encountered an API error when visiting billing settings. We add an optional one-sentence note, then click **Analyze Screenshot with Gemma 4 E2B**.*  
> *(Watch loading progress bar)*  
> *"Gemma 4 E2B reads the visual evidence locally. Notice how strictly it adheres to our hackathon guardrails:*  
> 1. *In the green card, **Visible Evidence** is strictly what is seen in the image: HTTP 404, the exact route `/api/v1/billing/subscriptions`, and the cluster name.*  
> 2. *In the amber card, **Hypotheses** are explicitly labeled as unverified possible causes—never confused with confirmed facts.*  
> 3. *It never invents non-existent steps; missing reproduction details are labeled as Unknown or phrased as follow-up questions."*

---

## 📋 0:60 – 0:80 | Interactive Review & Export
> *(Switch between **Structured Editor**, **Markdown Preview**, and **Raw Markdown**)*  
> *"The user has full control to edit any field before filing the bug. With one click on **Copy Markdown** or **Download .md**, you get a complete GitHub-flavored issue template ready to paste straight into GitHub issues or Jira."*

---

## 🏁 0:80 – 0:90 | Conclusion & Impact
> *"BugSnap AI bridges the gap between end users who take screenshots and developers who need reproducible bug reports—private, honest, and running 100% locally with Gemma 4 E2B. Thank you!"*

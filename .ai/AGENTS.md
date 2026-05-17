# **🤖 AGENTS.md: Global AI Interaction Rules**

This document defines the behavioral model and technical constraints for all AI agents working on the **Offline Billing System**.

---

## **1. Core Identity**
You are the **Lead Software Architect** and primary engineering engine for this system. Every block of code you write, design, or modify must be:
* **Production-Ready:** Code must be highly minimal, clean, robustly structured, self-documenting, and free of placeholder scripts or comments.
* **Offline-First:** Under no circumstances should there be calls to external networks or servers, except during initial package installation stages.
* **Config-Driven:** Every user interface layout, form generation, theme value, database field variance, or system feature must read from `config.json` rules dynamically.

---

## **2. Technical Non-Negotiables**

### **A. System Security & Architecture**
* **Strict IPC Isolation:** You **MUST** route all file reads, writes, execution tasks, and SQLite database actions through Electron's `contextBridge` inside `preload.js`. 
* **Zero Direct Access:** Never expose raw `ipcRenderer`, `fs`, `path`, or shell access directly to the React frontend.

### **B. Structural Modularity**
* Keep the main Electron processes (`main/`) completely decoupled from the React layout rendering processes (`src/`).
* Communicate exclusively using custom event mappings across the IPC boundary.

### **C. Relational Data Integrity**
* All SQLite queries must execute inside explicit transactional structures (`db.transaction()`).
* Build secure, fallback try-catch error traps for all backend manager actions and return standardized error objects across the IPC interface.

### **D. Aesthetic Rendering & styling**
* Use **Tailwind CSS** for rapid, premium, modern, responsive user interface styling.
* Adapt colors and features using runtime states linked to `config.json` changes.

### **E. Persistence Protocols**
* Use local **SQLite** (`better-sqlite3`) for user accounts, catalog products, and transaction records.
* Use lightweight **JSON** files (`config.json`) for general application settings and dynamic behaviors.

---

## **3. AI Agent Communication Protocol**

### **A. Check the Config First**
Before starting any development task, review how changes in `config.json` affect the desired output. Always structure components to handle toggled feature flags gracefully.

### **B. Incremental Execution**
Always finalize and fully test one stage of the `PROJECT_BLUEPRINT.md` and check off tasks in `TASKS.md` before proceeding to successive items.

### **C. Proactive Self-Correction**
If at any point during code analysis or editing you identify a violation of the secure IPC pattern, hardcoded config assumptions, or raw dependencies in the UI, you are authorized and required to patch the infraction immediately.

### **D. The "Halt & Ask" Protocol**
You **MUST** adhere to the strict Halt & Ask execution cycle:
1. **Complete a Single Task:** Focus and write complete, production-grade code for exactly one designated subtask from `TASKS.md`.
2. **Execute Live Verification:** Proactively launch terminal servers and use browser subagents to run real visual and functional tests.
3. **Report and Halt:** Present the test status and visual screenshots. You **MUST HALT** your turn and ask the user for explicit confirmation before marking the task complete or starting the next item. Do not auto-run.

---
*Created on 2026-05-16*

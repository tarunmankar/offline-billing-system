# **🚀 Billing Pro 2026: Offline-First, Config-Driven Billing System**

Welcome to **Billing Pro 2026**, a high-performance, desktop billing application built for Windows. The application operates under a **"single codebase, dynamic personality"** philosophy—allowing a single installation package to completely adapt its user interface, workflows, custom transaction fields, and hardware integration layout at boot time based on an external dynamic configuration file.

---

## **📂 Core Tech Stack**
* **Desktop Shell:** Electron (Secured via Preload Context Isolation and IPC Sandboxing)
* **Frontend UI:** React + Vite + Tailwind CSS + Framer Motion (Kinetic animations)
* **State Engines:** React context managers (`ConfigContext`, `AuthContext`)
* **Persistence Layer:** SQLite (`better-sqlite3`) optimized with Write-Ahead Logging (`WAL` mode)

---

## **🔒 AI Brain Context Map (`.ai/`)**
The master specifications, design constraints, and technical directives are tracked inside the `/.ai` folder. Refer to these files as the absolute **Single Source of Truth** for development:

* **🧠 [00_PRD.md](.ai/00_PRD.md) (Product Seed):** Core vision, functional modules, and retail persona specifications (Pharmacy vs. Grocery).
* **⚙️ [ARCHITECTURE_MASTER.md](.ai/ARCHITECTURE_MASTER.md) (Engine Wiring):** Physical process separation guidelines, backend feature managers, and secure IPC boundaries.
* **🗃️ [SCHEMA.md](.ai/SCHEMA.md) (Database Blueprint):** SQLite relational tables DDL, custom JSON attribute specifications, indexes, and migrations.
* **📜 [AGENTS.md](.ai/AGENTS.md) (AI Constitution):** Structural guidelines, data transaction constraints, and operational laws for AI interactions.
* **💻 [GEMINI.md](.ai/GEMINI.md) (Environment Overrides):** Windows development configurations, TypeScript instructions, and diagnostic logs locations.
* **🗺️ [PROJECT_BLUEPRINT.md](.ai/PROJECT_BLUEPRINT.md) (Folder & Screens Map):** Complete project file layout blueprints and React view component descriptions.
* **📋 [TASKS.md](.ai/TASKS.md) (Interactive Roadmap):** Tick list of development progress checkpoints and next-up tasks.
* **🐛 [ERROR_LOGS.md](.ai/ERROR_LOGS.md) (Diagnostic Memory Bank):** Resolved historical anomalies ledger.
* **📝 [PROJECT_WORKFLOW_CHECKLIST.md](.ai/PROJECT_WORKFLOW_CHECKLIST.md) (Workflow & Git Guide):** Strict Halt & Ask rules, testing protocols, and manual Git controls.

---

## **🛠️ Developer Quick-Start Guide**

### **1. Install Dependencies**
First, clone this repository, navigate to the folder, and run:
```bash
npm install
```

### **2. Launch Development Environment**
To start the Vite UI server and boot the sandboxed Electron application in parallel:
```bash
npm run dev
```

### **3. Validate IPC Channels**
To verify communication integrity and transactional database capabilities:
```bash
npm run test:ipc
```

### **4. Package Desktop App**
To compile a production-ready, self-contained Windows executable (`.exe`) via `electron-builder`:
```bash
npm run build
```

---

## **🛡️ Core Engineering Constraints**
1. **Never Hardcode Visual Details:** Every color scheme, title text, custom inventory input field, and receipt layout must adapt from [config.json](config.json).
2. **Absolute Sandboxing:** The React UI process has zero access to Node.js APIs or direct SQLite connections. All commands must travel through `preload.js` exposed under `window.electronAPI`.
3. **100% Offline-First:** Do not import remote tracking libraries, dynamic icons, or remote stylesheets. Every asset must compile locally from inside `node_modules` or `assets/`.
4. **Transactions are Mandatory:** Any database write action must be processed inside a structured SQL transaction boundary to secure the local database from power disruptions.

---
*For development guidelines and interactive protocols, refer to [.antigravityrules](.antigravityrules) in the project root.*

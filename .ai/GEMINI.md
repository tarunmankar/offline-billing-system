# **🌌 GEMINI.md: Antigravity Agent Overrides**

Special operational rules and development guidelines optimized specifically for the **Google Antigravity** environment.

---

## **1. Environment Awareness**
* **Operating System:** Windows
* **Tech Stack:** Electron + React + TypeScript + Vite + SQLite
* **Local Storage Schema:**
  * **Development:** Root directory `db/` directory pathing.
  * **Production:** Native system persistent path via Electron's `app.getPath('userData')` system call.

---

## **2. Interactive Development Workflow**

### **A. Development Server Preview Hook**
* When rendering and previewing UI layers locally, verify that the Electron window bootstrap process loads the dynamic localhost port active under the **Vite dev server** (e.g. `http://localhost:5173`) instead of attempting to load static index files.
* Provide clean fallbacks to `dist/index.html` once compilation scripts run.

### **B. Main Process Error Capture**
* Redirect all standard error output and unhandled exception exceptions in the Electron Main process to a local file at:
  `logs/main.log`
* This enables rapid diagnostics and debugging directly inside the local work workspace.

---

## **3. Engineering Style Overrides**

### **A. Absolute Typing**
* Write all Electron Main process backend files, managers, and service classes strictly using **TypeScript** (`.ts`).
* Strictly avoid `any` declarations. Maintain comprehensive interface typing across IPC structures.

### **B. React State Hydration**
* Maintain single-instance contexts for globally shared parameters.
* Provide custom React hooks (`useConfig`, `useFeature`, `useAuth`) to access global configurations safely inside render elements.

### **C. Premium Kinetic Aesthetics**
* The user interface must feel exceptionally premium and responsive.
* Implement custom page changes, alert slide-ins, and button hover states using **Framer Motion** physics-based transitions to align with Antigravity design benchmarks.

---

## **4. Primary CLI Execution Command Scripts**
Execute the following commands in the workspace using the local terminal runner:

* **Start Active Dev Environment:** `npm run dev` (Runs Vite server and boots Electron shell in parallel)
* **Compile Clean Product Build:** `npm run build`
* **Run IPC Integration Verification:** `npm run test:ipc`

---
*Created on 2026-05-16*

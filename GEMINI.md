# **🌌 GEMINI.md: Antigravity Agent Overrides**

Special instructions for the Google Antigravity environment.

## **1. Environment Awareness**
- **OS:** Windows
- **Project Type:** Electron + React + SQLite (Offline Desktop App)
- **Local Storage:** Use `app.getPath('userData')` for production data storage, but keep a local `db/` folder for development.

## **2. Development Workflow**
- **Tooling:** Use `npx` for initialization. Prefer `vite` for the frontend build tool.
- **Previews:** When the user asks for a preview, ensure the Electron main process is correctly configured to load the Vite dev server URL.
- **Error Handling:** Log Electron main process errors to a local `logs/main.log` file for easier debugging.

## **3. Code Style Overrides**
- **Types:** Use TypeScript for all Main process logic (`.ts`).
- **Hooks:** Use custom hooks (e.g., `useConfig`) to access configuration globally in React.
- **Animations:** Use Framer Motion for premium-feel transitions (as per Antigravity design standards).

## **4. Specific Commands**
- To start dev: `npm run dev`
- To build: `npm run build`
- To test IPC: `npm run test:ipc`

# **🗺️ PROJECT_BLUEPRINT.md: Development Roadmap**

This document tracks the execution of the project based on the **Architecture Master.md**.

## **Phase 1: Project Setup & AI Configuration ✅**
- [x] Create directory structure.
- [x] Generate `AGENTS.md` and `GEMINI.md`.
- [x] Initialize `PROJECT_BLUEPRINT.md`.

## **Phase 2: The Foundation 🚧**
- [ ] Initialize Electron + React + Vite + Tailwind structure.
- [ ] Set up SQLite with `better-sqlite3`.
- [ ] Implement `ConfigManager` (Main) and `ConfigContext` (Renderer).
- [ ] Implement `AuthManager` (Main) and `AuthContext` (Renderer).

## **Phase 3: Dynamic UI Logic ⏳**
- [ ] Create Dynamic Sidebar (Config-driven).
- [ ] Create Dynamic Product Form (Config-driven custom fields).
- [ ] Implement Theme Switching (Light/Dark).

## **Phase 4: Core Billing Features ⏳**
- [ ] Billing Page: Barcode scanning, dynamic rows, GST calculations.
- [ ] Print Manager: Thermal vs. A4 support.
- [ ] Inventory Management with Expiry Tracking.

## **Phase 5: Reliability & Maintenance ⏳**
- [ ] Automated SQLite Backups.
- [ ] Factory Reset Logic.
- [ ] Final Packaging with Electron Builder.

---
*Last Updated: 2026-05-16*

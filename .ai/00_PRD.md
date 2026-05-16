# **🧠 00_PRD.md: Product Requirements Document (Master Seed)**

## **1. Executive Summary**
The **Offline Billing System** (Billing Pro 2026) is a high-performance, configuration-driven, 100% offline desktop application designed to run on Windows. The core system architecture operates under a "single codebase, dynamic personality" philosophy, where the entire application dynamically alters its user interface, workflows, validation logic, and hardware behavior at runtime based on an external `config.json` file. 

This enables a single deployment package to serve completely different retail niches—such as pharmacies (requiring expiry date tracking, drug batch numbers, and dosage metadata) and grocery stores (requiring weight-based scaling, barcode quick-adds, and bulk inventory features)—without changing a single line of compiled code.

---

## **2. System Vision & Business Objectives**
* **Dynamic Domain Adaptability:** Instantly transition the application behavior between pharmacy, grocery, garment, or general retail configurations.
* **100% Offline-First Resilience:** Zero reliance on remote APIs or internet connectivity. All operations—including user authentication, database persistence, transaction history, and printing—must occur entirely on the local client machine.
* **Extreme Performance:** In a high-traffic billing environment, transaction processing must be instantaneous. Barcode scans must resolve to cart additions in under 50ms.
* **Strict Hardware Integration:** Native support for ESC/POS thermal printers (80mm/58mm) and standard desktop laser printers (A4 size invoices) derived completely from user configuration.
* **Enterprise-Grade Security:** Hardened Electron desktop wrapper adhering to strict IPC isolation guidelines.

---

## **3. User Personas & Use Cases**

### **A. Owner / Admin**
* **Goal:** Oversee shop setup, customize tax rules, manage inventory, view sales metrics, configure custom metadata fields, handle database backups, and manage cashier accounts.
* **Key Needs:** Full configuration control, advanced reports, inventory edit privileges, factory reset capability.

### **B. Cashier / Operator**
* **Goal:** Process sales as fast as possible, scan barcodes, take payments, issue receipts, and manage credit logs for customers.
* **Key Needs:** High-speed keyboard navigation, minimal clicks, automatic focus on search/barcode fields, clean dark mode to reduce eye strain during long shifts.

---

## **4. Detailed Functional Requirements**

### **Module 1: Config-Driven Core (The Brain)**
* **Dynamic UI Rendering:** The sidebar menus, form inputs, receipt formats, and operational features (e.g., expiry alerts) must read from `config.json` at initialization.
* **Fallback Mechanisms:** If the local `config.json` is missing or corrupt, the system must write and load a `default_config.json` containing secure fallback configurations.
* **Dynamic Custom Fields:** Products must accept arbitrary metadata fields defined in `config.json` (such as `Batch No` or `Expiry Date`). The Product Entry Form must dynamically generate UI input fields based on this configuration array.

### **Module 2: Secure Offline Authentication & Authorization**
* **Local Role-Based Access Control (RBAC):** Two primary roles: `Admin` and `Cashier`. 
* **State Persistence:** Secure, offline user session state in React via context (`AuthContext`) driven by encrypted verification in the Electron Main process.
* **Authentication Storage:** Secure salted hashing for passwords inside the local SQLite database.

### **Module 3: Dynamic Billing Engine & Cart Management**
* **Keyboard-First Design:** Complete cart navigation, quantity adjustment, and checkout processes must be operable using keyboard shortcuts (e.g., `F1` for billing, `F12` to checkout, `Arrow keys` for cart navigation).
* **High-Speed Searching:** Seamlessly search products by scanning barcodes (auto-focus active) or through real-time fuzzy text searching.
* **Dynamic Taxation & Calculations:** 
  * Real-time calculation of Item Totals, CGST/SGST/VAT, discounts, and round-offs.
  * Dynamically load tax terms (e.g., `GST` vs. `VAT` vs. `Tax`) from the configuration file.
  * Implement exact mathematical round-offs to prevent precision loss.

### **Module 4: Hardware & Printing Management**
* **Thermal Printing (ESC/POS):** If `config.billing_settings.print_format` is `"thermal"`, compile and send raw ESC/POS commands directly to the receipt printer (80mm or 58mm).
* **A4 Invoice Printing:** If set to `"A4"`, render a clean, professional, responsive invoice page in a hidden background window and trigger native PDF print dialogs.
* **Configurable Layouts:** The printed receipt header, logo, and tax breakdowns must reflect the `config.json` rules.

### **Module 5: Inventory & Expiry Tracking**
* **Stock Levels:** Real-time stock decrementing upon transaction completion.
* **Custom Field Metadata:** Store inventory metadata as clean JSON strings within SQLite.
* **Expiry & Low-Stock Alerts:** If `expiry_tracking` or `inventory_management` is enabled in features, run automated daily shelf-life checks and show prominent warnings for items nearing expiry.

### **Module 6: Offline Credit Ledger (Udhaar Book)**
* **Customer Ledgers:** Basic double-entry record keeping for credit clients.
* **Outstanding Balances:** Track unpaid transactions and map payments against historical credit.

### **Module 7: Reliability & System Administration**
* **Automated Database Backups:** Create a lightweight background scheduler that exports a stamped SQLite copy to a `backups/` directory every 24 hours.
* **Factory Reset Engine:** Admin-authenticated utility to wipe local SQLite database files, recreate tables, and rewrite standard `config.json` presets.

---

## **5. Non-Functional Requirements**

### **A. Architecture & Performance**
* **Sub-100ms UI Latency:** Zero UI blocks. All database work and file operations must occur asynchronously inside Electron's Main process.
* **SQLite Durability:** Execute database writes inside strict transactions (`better-sqlite3` transactions) to prevent data corruption in case of unexpected power losses.

### **B. Security & Sandbox Controls**
* **Preload Isolation:** The renderer process (React) has absolutely no direct access to `better-sqlite3`, `fs`, `path`, or shell executions.
* **Context Bridge:** All actions occur over a strictly vetted secure channel using Electron's `contextBridge` exposing dedicated, non-malleable API endpoints under `window.electronAPI`.
* **Zero External Calls:** Absolutely no external Content Delivery Network (CDN) resources, tracking scripts, or google fonts may be fetched dynamically. All font assets, stylesheets, icons, and libraries must be packaged locally.

---

## **6. Visual & Aesthetic Architecture**
* **Premium Dark Mode:** Sleek, glassmorphism-based theme utilizing carefully tailored HSL colors (deep grays, soft blues, and muted neon accents).
* **Harmonious Transitions:** Micro-interactions and state changes animated smoothly with `Framer Motion`.
* **Professional Typography:** Local Google Fonts integration (e.g., `Inter` or `Outfit`) for high-contrast legibility.

---
*Document Status: ACTIVE | Seed Draft 2026-05-17*

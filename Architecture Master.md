# **🚀 Architecture Master: Config-Driven Billing System (2026)**

### **Target Tool: Google Antigravity / Cursor | Stack: Electron \+ React \+ SQLite**

This document serves as the **Single Source of Truth** for the AI Agent. All development tasks must align with the vision and rules defined here.

## **1\. Project Vision: The Core Engine**

The goal is to build a **Modular, Config-Driven Billing System** for Windows.

* **Single Codebase:** One version of the code for all clients.  
* **Dynamic Personality:** The app changes its UI and logic (e.g., Pharmacy vs. Grocery) based on an external config.json.  
* **100% Offline:** Data is stored locally in SQLite; no internet required.  
* **User Management:** Role-based access (Owner/Admin vs. Cashier).

## **2\. System Configuration (config.json)**

The config.json file is the "brain" of the app. Every feature must check this file before rendering.

{  
  "shop\_info": {  
    "name": "Default Shop",  
    "type": "pharmacy",   
    "tax\_label": "GST/VAT",  
    "logo\_path": "assets/logo.png"  
  },  
  "theme": {  
    "mode": "dark",  
    "primary\_color": "\#2563eb"  
  },  
  "features": {  
    "user\_auth": true,  
    "barcode\_scanner": true,  
    "expiry\_tracking": true,  
    "thermal\_printing": true,  
    "inventory\_management": true,  
    "credit\_ledger": true  
  },  
  "custom\_fields": \[  
    { "label": "Batch No", "key": "batch" },  
    { "label": "Expiry Date", "key": "expiry" }  
  \],  
  "billing\_settings": {  
    "print\_format": "A4",  
    "round\_off": true,  
    "tax\_breakdown": true  
  }  
}

## **3\. Core AI Instructions (GEMINI.md Rules)**

*AI must follow these rules strictly:*

1. **Config-Driven:** Do NOT hardcode labels or feature visibility. Derive everything from config.json.  
2. **IPC Isolation:** Frontend (React) must never touch the database. All queries happen in the Main Process.  
3. **Local Asset Handling:** All images (logos) and database files must stay in AppData or the project root.  
4. **Hardware Ready:** AI must implement pos-printer logic for Thermal and window.print for A4 based on config.  
5. **Fail-Safe:** If config.json is missing, use default\_config.json.

## **4\. Project Structure**

The project must follow this organizational hierarchy:

/billing-pro-2026  
├── config/                \# JSON Templates for different niches  
├── main/                  \# Electron Main Process (Backend)  
│   ├── db/                \# SQLite connection & migration logic  
│   ├── managers/          \# Feature Managers (Config, Print, Auth)  
│   └── preload.js         \# Security bridge (Context Bridge)  
├── src/                   \# React Frontend (UI)  
│   ├── context/           \# ConfigContext & AuthContext  
│   ├── components/        \# Reusable UI Components  
│   ├── hooks/             \# useConfig, useFeature, etc.  
│   └── pages/             \# Login, Billing, Inventory, Reports  
├── assets/                \# Local images, icons, and default configs  
├── AGENTS.md              \# Global Rules for AI Agents  
├── GEMINI.md              \# Antigravity/Agent Manager Overrides  
└── PROJECT\_BLUEPRINT.md   \# Generated Development Map

## **5\. Database Schema (SQLite)**

* **Users Table:** id, username, password\_hash, role (Admin/Cashier).  
* **Products Table:** id, name, price, stock, metadata (JSON for custom fields).  
* **Sales Table:** id, user\_id, total\_amount, tax\_total, tax\_details (JSON string for CGST/SGST breakdown), timestamp.  
* **Sale\_Items Table:** sale\_id, product\_id, quantity, rate, tax\_percent.

## **6\. Implementation Roadmap & AI Prompts**

### **Phase 1: Project Setup & AI Configuration**

* **Prompt 1.1:** Read this document. Create the **Project Structure** as defined in Section 4\. Generate AGENTS.md and GEMINI.md. Set rules for offline development.  
* **Prompt 1.2:** Generate a PROJECT\_BLUEPRINT.md as an internal map for your development steps.

### **Phase 2: The Foundation**

* **Prompt 2.1:** Initialize Electron \+ React \+ Vite \+ Tailwind structure.  
* **Prompt 2.2:** Build ConfigManager.ts and AuthManager.ts in the main process.  
* **Prompt 2.3:** Create ConfigContext and AuthContext in React for state management.

### **Phase 3: Dynamic UI Logic**

* **Prompt 3.1:** Build a dynamic Sidebar. Hide/Show menu items based on config.features and user.role.  
* **Prompt 3.2:** Create a ProductForm that renders input fields dynamically based on config.custom\_fields.

### **Phase 4: Core Billing Features**

* **Prompt 4.1:** Develop the BillingPage. Implement barcode auto-focus, dynamic row addition, and real-time calculation with GST breakdown.  
* **Prompt 4.2:** Build a PrintManager in the main process. Logic: If config.billing\_settings.print\_format \=== 'thermal', use pos-printer, else use standard PDF print.  
* **Prompt 4.3:** Create an ExpiryAlert widget that triggers only if expiry\_tracking is true.

### **Phase 5: Reliability & Maintenance**

* **Prompt 5.1:** Implement an automated 24-hour backup service for the SQLite database.  
* **Prompt 5.2:** Create a 'Factory Reset' feature to restore default\_config.json.

## **7\. Deployment Strategy**

* Package using electron-builder.  
* Same EXE for all. Customize via the local config.json.
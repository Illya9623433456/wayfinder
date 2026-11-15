# WayFinder AI — Warsaw Transit & Eco-Planner (Full-Stack MVP)

> Recruitment project for the Xelerit Winter Internship: **Winter Internship: Python / Java / C# Developer**  
> **Author:** Illia Naumenko

---

## 1. Project Overview & Features

**WayFinder** is a modern, full-stack web application (MVP) designed to facilitate intelligent urban transit planning with a strong focus on ecology, comfort, and real-world public transportation data.

### Key Features:
* **Smart Route Planner (AI & Live ZTM Integration):** Finds optimal connections (trams, buses, metro, suburban trains) using real stops and live GPS positions from the official City of Warsaw Open Data API (`dane.um.warszawa.pl`).
* **Eco CO₂ Tracker:** Automatically calculates and aggregates saved kilograms of carbon dioxide and the number of eco-friendly journeys made by the user.
* **Ride History:** A dedicated archive view of completed trips with filtering by transport mode (`All modes`, `Tram`, `Bus`, `Metro`, `Train`) and item deletion.
* **Settings & Preferences:** 
* Theme switching (Light / Dark mode).
* Real-time language switcher (**PL / EN** powered by `react-i18next`).
* Font size scaling (`Small / Medium / Big`).
* Simulation of live route push notifications.

---

## 2. Technical Stack & Architecture

* **Back-end:** 
  * **Python & FastAPI** – High-performance REST API handling CRUD operations for trips, authentication, and integration with Warsaw's municipal transport APIs.
  * **SQLAlchemy & SQLite** (`wayfinder.db`) – Lightweight database setup requiring no external server configuration.
* **Front-end:** 
  * **React & Vite** utilizing **React Router** for SPA routing and **i18next** for internationalization.
  * Modern, responsive UI/UX optimized for mobile viewports (PWA-style interface).
* **Architecture:** 
  * Clean separation of concerns with distinct `backend/` and `frontend/` directories in the repository.

---

## 3. Local Setup Instructions

To run the project locally, follow these steps in your terminal:

### Prerequisites:
* **Python** (version 3.10+)
* **Node.js** (version 18+)

### Step A: Run the Back-end (API)
1. Navigate to the backend directory:
   ```bash
   cd backend

# Create and activate a virtual environment (optional but recommended):

python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies:
pip install fastapi uvicorn sqlalchemy pydantic

# Start the development server:
uvicorn main:app --reload --port 8000
The API will be available at: http://localhost:8000 

# Step B: Run the Front-end (React Client)
# In a new terminal window, navigate to the frontend directory:

cd frontend

# Install npm packages:

npm install

# Start the client application:

npm run dev
The application will open in your browser at: http://localhost:5173

4. AI Assistance & Developer Tools
During the development of this project, AI coding assistants and models were utilized to streamline the workflow:

API Logic & Integration: Used AI to scaffold the ZTM Warsaw API integration endpoints and the route calculation logic.

UI/UX Refactoring: Assisted in refining CSS styles and React components (e.g., custom dropdown filters for transport modes and responsive PL/EN language pills).

Code Quality: Automated detection and fixing of linter warnings (ESLint) and asynchronous state handling in React hooks.
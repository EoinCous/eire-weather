# ÉireWeather 🌤️

ÉireWeather is a modern, responsive, dark-themed weather Progressive Web App (PWA) tailored for tracking live forecasts, active Met Éireann warnings, and high-performance precipitation radar data across Ireland. Built with React and Tailwind CSS on the frontend and backed by a Spring Boot REST API, it combines lightning-fast client-side caching with interactive map visualizations.

---

## 🚀 Features

- **Precipitation Radar**:
  - **Dashboard Preview**: A non-interactive static card showing the latest radar snapshot with a "Tap to Expand" prompt.
  - **Fullscreen Radar View (`/precipitation-radar`)**: Dedicated fullscreen map route featuring smooth 2-hour historical playback controls (Play/Pause, custom timeline step indicators) powered by Leaflet.
- **Current Weather Conditions**: Real-time display of temperature, weather conditions, precipitation levels, and local observation timestamps.
- **Location Auto-Detection & Search**:
  - Automatically fetch weather for your current GPS coordinates.
  - Search any town, city, or village in Ireland using forward and reverse geocoding.
- **24-Hour Forecast & Interactive Charts**: Scrollable hourly carousel and temperature/rainfall charts for upcoming hours.
- **10-Day Daily Forecast**: Visual range bars illustrating minimum and maximum temperatures across the next 10 days.
- **Detailed Daily Breakdown**: Clickable daily items navigating to deep hourly breakdowns (`react-router-dom`).
- **Weather Alerts**: Integration with official Met Éireann weather warnings.

---

## 🔌 APIs & Data Sources

- **RainViewer API**: Delivers real-time historical precipitation tile manifests and radar frames with smart 5-minute `sessionStorage` caching to prevent rate-limiting (`429 Too Many Requests`).
- **Stadia Maps**: Provides high-performance dark-themed base map tiles (`alidade_smooth_dark`) configured with domain authentication for production.
- **OpenStreetMap Nominatim API**: Handles location search and reverse geocoding.
- **Met Éireann**: Official Irish meteorological data and weather warning integration.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS (with mobile safe-area inset support and PWA configuration)
- **Mapping**: Leaflet (`react-leaflet` / vanilla Leaflet integration with custom tile layer opacity management)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: React Router (`react-router-dom`)
- **Deployment**: Vercel (configured with SPA rewrites and zero-cache control headers for service workers)

### **Backend**
- **Framework**: Java / Spring Boot
- **API Architecture**: RESTful Services (`/api/v1/weather/*`)

---

## 🏗️ Architecture & Deployment

ÉireWeather utilizes a decoupled, cloud-native deployment strategy to ensure high availability, low latency, and automated delivery:

- **Frontend (Vercel)**: 
  - Deployed globally on Vercel’s Edge Network with automated Git-based CI/CD.
  - Configured with SPA rewrites (`vercel.json`) and Progressive Web App (PWA) caching.
- **Backend (AWS EC2 & Docker)**:
  - The Spring Boot REST API is containerised using **Docker** for consistent runtime environments.
  - Hosted on an **AWS EC2** instance.
- **CI/CD Pipeline (GitHub Actions)**:
  - Automated workflows handle backend build verification, Docker image packaging, and deployment routines on every push to main.

---

## ⚙️ Getting Started & Setup

### Prerequisites
- Node.js & npm (for the frontend)
- Java JDK & Maven / Maven Wrapper (for the Spring Boot backend)

### 1. Clone the Repository
git clone [https://github.com/your-username/eire-weather.git](https://github.com/your-username/eire-weather.git)
cd eire-weather

### 2. Run the Backend
cd backend
./mvnw spring-boot:run

### 3. Run the Frontend
- Open a new terminal tab and run:
cd frontend
npm install
npm run dev

The application will be accessible locally at http://localhost:5173
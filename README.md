# ÉireWeather 🌤️

ÉireWeather is a modern, responsive, dark-themed weather Progressive Web App (PWA) for live forecasts, active Met Éireann warnings, and precipitation radar across Ireland. Built with React and Tailwind CSS, with a Spring Boot REST API, it combines client-side caching with interactive map visualisations.

---

## 🚀 Features

- **Precipitation Radar**:
  - **Dashboard Preview**: A non-interactive static card showing the latest radar snapshot with a "Tap to Expand" prompt.
  - **Fullscreen Radar View (`/precipitation-radar`)**: Dedicated fullscreen map route featuring smooth 2-hour historical playback controls (Play/Pause, custom timeline step indicators) powered by Leaflet.
- **Current Weather Conditions**: Displays temperature, conditions, precipitation, and the timestamp of the latest forecast.
- **Location Auto-Detection & Search**:
  - Automatically fetch weather for your current GPS coordinates.
  - Search any town, city, or village in Ireland using forward and reverse geocoding.
- **24-Hour Forecast & Interactive Charts**: Scrollable hourly carousel and temperature/rainfall charts for upcoming hours.
- **10-Day Daily Forecast**: Visual range bars illustrating minimum and maximum temperatures across the next 10 days.
- **Detailed Daily Breakdown**: Clickable daily items navigating to deep hourly breakdowns (`react-router-dom`).
- **Weather Alerts**: Integration with official Met Éireann weather warnings.
- **AI Summaries**: Generate a summary of current conditions, a selected day, or the 10-day outlook using OpenAI.

---

## 🔌 APIs & Data Sources

- **RainViewer API**: Provides historical precipitation tile manifests and radar frames, with 5-minute `sessionStorage` caching to reduce repeated requests.
- **Stadia Maps**: Provides dark-themed base map tiles (`alidade_smooth_dark`).
- **OpenStreetMap Nominatim API**: Handles location search and reverse geocoding.
- **Met Éireann**: Official Irish meteorological data and weather warning integration.
- **Open-Meteo**: UV-index and air-quality forecast data.
- **OpenAI**: AI-generated weather summaries for a location and forecast period.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS (with mobile safe-area inset support and PWA configuration)
- **Mapping**: Leaflet (`react-leaflet` / vanilla Leaflet integration with custom tile layer opacity management)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: React Router (`react-router-dom`)

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
  - The workflow builds the backend, packages a Docker image, and deploys it to EC2 when backend or workflow files change on `main`.

---

## ⚙️ Getting Started & Setup

### Prerequisites
- Node.js & npm (for the frontend)
- Java JDK & Maven / Maven Wrapper (for the Spring Boot backend)
- An OpenAI API key to use AI summaries (optional)

### 1. Clone the Repository
```sh
git clone https://github.com/EoinCous/eire-weather.git
cd eire-weather
```

### 2. Run the Backend
Set `OPENAI_API_KEY` in your environment if you want to use AI summaries. For example, in PowerShell:
```powershell
$env:OPENAI_API_KEY = "your-api-key"
```

Then start the backend from the `backend` directory:
```sh
cd backend
# macOS/Linux
./mvnw spring-boot:run
# Windows
.\mvnw.cmd spring-boot:run
```

### 3. Run the Frontend
In a new terminal, run:
```sh
cd frontend
npm install
npm run dev
```

The application will be available at http://localhost:5173. The Vite development server proxies API requests to the backend at http://localhost:8080.

## Setup iOS PWA on Home Screen
On your iPhone or iPad, open the deployed website in Safari, tap **Share**, then **Add to Home Screen**.
# ÉireWeather 🌤️

ÉireWeather is a modern, responsive weather dashboard tailored for tracking weather forecasts and Met Éireann warnings across Ireland. Built with React and Tailwind CSS on the frontend and backed by a Spring Boot REST API, it delivers clean visual charts, location search, detailed hourly forecasts, and full 10-day weather trends.

---

## 🚀 Features

- **Current Weather Conditions**: Real-time display of current temperature, weather conditions, and precipitation.
- **Location Auto-Detection & Search**:
  - Automatically fetch weather for your current GPS coordinates.
  - Search any city, town, or village using the OpenStreetMap Nominatim Geocoding API.
- **24-Hour Forecast & Interactive Charts**: Scrollable hourly carousel and temperature/rainfall charts for upcoming hours.
- **10-Day Daily Forecast**: Visual range bars illustrating minimum and maximum temperatures across the next 10 days.
- **Detailed Daily Breakdown**: Clickable daily items that navigate to an hourly breakdown for any chosen day (`react-router-dom`).
- **Weather Alerts**: Real-time weather warnings integration.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React.js (Vite / CRA)
- **Styling**: Tailwind CSS
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: React Router (`react-router-dom`)
- **Geocoding API**: OpenStreetMap (Nominatim Reverse & Forward Geocoding)


### **Backend**
- **Framework**: Java / Spring Boot
- **API Architecture**: RESTful Services (`/api/v1/weather/*`)

## Setup
Clone repository
cd backend
./mvnw spring-boot:run

cd frontend
npm install
npm run dev

http://localhost:5173
# Weather App

A modern, responsive weather application that provides current conditions, historical data, and forecasts for cities worldwide.

## Features

- 🔍 **Smart City Search** - Real-time autocomplete with city suggestions
- 🌤️ **Current Weather** - Live weather conditions with detailed metrics
- 📅 **Date Selection** - View weather for past, present, or future dates
- 📊 **Detailed Metrics** - Temperature, humidity, wind speed, UV index
- 🗓️ **5-7 Day Forecast** - Extended weather predictions with visual indicators
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Technology Stack

- **Build Tool**: Vite v6.3.5
- **Styling**: Tailwind CSS v4.1.8 with DaisyUI v5.0.43
- **Language**: Vanilla JavaScript (ES6+ modules)
- **Weather API**: WeatherAPI.com

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd weather-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Usage

1. **Search for a city**: Type at least 4 characters to see city suggestions
2. **Select a date** (optional): Use the date picker to view weather for specific dates
3. **View weather data**: The app will display:
   - Current conditions with temperature and weather icon
   - Detailed metrics (humidity, wind, UV index)
   - 5-7 day forecast

## Project Structure

```
weather-app/
├── index.html              # Main HTML file
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── public/                 
│   └── vite.svg           # Favicon
└── src/
    ├── main.js            # Application entry point
    ├── style.css          # Tailwind CSS imports
    ├── weather.js         # Main weather app logic
    └── weatherApiClient.js # Weather API client
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Configuration

The app uses WeatherAPI.com for weather data. The API key is currently hardcoded in the application. For production use, consider moving it to environment variables.

## Features in Detail

### Weather Information Display
- **Temperature**: Current, feels like, high/low
- **Conditions**: Visual weather icons with descriptions
- **Humidity**: Percentage display
- **Wind Speed**: In mph
- **UV Index**: With severity indicators (Low, Moderate, High, etc.)

### Date Handling
- **Past dates**: Shows historical weather data
- **Current date**: Displays real-time conditions
- **Future dates**: Shows forecast (up to 7 days, extended forecasts require premium API)

## Limitations

- API key is hardcoded (security consideration for production)
- Extended forecasts (15-300 days) require premium API access
- No data persistence - fetches fresh data each time

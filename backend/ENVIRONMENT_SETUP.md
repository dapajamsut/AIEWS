# Environment Setup Guide

## 🔑 Required Environment Variables

### Backend (.env)

```bash
# OpenWeatherMap API Configuration
OPENWEATHER_API_KEY=your_api_key_here
OPENWEATHER_LAT=-6.1744
OPENWEATHER_LON=106.8229

# Default region coordinates (Jakarta Pusat)
# These are used when no region parameter is provided
```

### Frontend (.env.local)

```bash
# Optional - Usually not needed as API calls go through Laravel backend
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📋 Step-by-Step Setup

### 1. Get OpenWeatherMap API Key

1. Visit [openweathermap.org](https://openweathermap.org)
2. Create a free account
3. Go to API Keys section
4. Copy your API key (free tier includes current weather data)

### 2. Update .env File

```bash
# Linux/macOS
nano .env

# Windows
type .env  # view current content
# Then edit with your editor
```

Add/Update:
```
OPENWEATHER_API_KEY=abc123def456ghi789jkl
OPENWEATHER_LAT=-6.1744
OPENWEATHER_LON=106.8229
```

### 3. Verify Setup

Test the API endpoint:
```bash
curl -H "apikey: pikel2" http://localhost:8000/api/regions

curl -H "apikey: pikel2" http://localhost:8000/api/weather
```

Expected response (if API key is valid):
```json
{
  "current_weather": { ... },
  "condition": "normal",
  "thresholds": { ... }
}
```

## 🚀 Running the Application

### Start Backend Server

```bash
# Terminal 1: Start Laravel server on port 8000
php artisan serve

# Test: curl http://localhost:8000/api/weather -H "apikey: pikel2"
```

### Start Frontend Dev Server

```bash
# Terminal 2: Start Next.js on port 3000
cd frontend
npm run dev

# Open: http://localhost:3000
```

## ✅ Verification Checklist

- [ ] OpenWeatherMap account created
- [ ] API key added to `.env`
- [ ] Laravel server running on port 8000
- [ ] Next.js server running on port 3000
- [ ] Dashboard loads without errors
- [ ] Region selector appears in header
- [ ] Selecting region updates weather data
- [ ] Console shows no "Tidak dapat memuat data cuaca" errors

## 🔧 Troubleshooting

### Error: "Failed to fetch weather data from OpenWeatherMap"

**Causes:**
1. Invalid API key
2. API key not yet activated (wait 10 minutes after creation)
3. Rate limit exceeded (free tier: 60 calls/minute)

**Solution:**
```bash
# Verify API key
curl "https://api.openweathermap.org/data/2.5/weather?lat=-6.1744&lon=106.8229&appid=YOUR_API_KEY"

# Should return weather data (not errors)
```

### Error: "Tidak dapat memuat data cuaca" in Console

**Check:**
1. API key in `.env` is correct
2. Backend server running
3. Network requests returning 200 status
4. Response has `current_weather` field

**Debug:**
```javascript
// Open browser DevTools Console
// Check Network tab for /api/weather response
// Verify response has expected structure
```

### Region Selector Not Appearing

**Check:**
1. Frontend rebuilt: `npm run build` in frontend folder
2. Browser cache cleared
3. No TypeScript errors in build output

**Solution:**
```bash
cd frontend
npm run build
npm run dev
```

## 📊 API Response Structure

Current weather data includes:
```json
{
  "current_weather": {
    "temp": 28,
    "humidity": 75,
    "pressure": 1010,
    "wind_speed": 15,
    "weather_main": "Clouds",
    "weather_description": "scattered clouds",
    "rain_1h": 0
  },
  "condition": "normal",
  "thresholds": {
    "wind": 10,
    "rain": 5,
    "temp": 28,
    "humidity": 65,
    "pressure": 1015
  },
  "region": "jakarta_pusat",
  "location": {
    "latitude": -6.1744,
    "longitude": 106.8229
  }
}
```

## 🌍 Weather Conditions

Sistem automatically determines weather condition:

| Condition | Criteria |
|-----------|----------|
| **kering** (Dry) | Low wind, no rain, normal temp |
| **normal** | Stable conditions |
| **berangin** (Windy) | Wind speed > threshold |
| **hujan** (Rain) | Rain detected, light to moderate |
| **hujan_deras** (Heavy Rain) | Heavy rainfall detected |

Thresholds adjust based on condition.

## 📱 Device Testing

### Mobile
```bash
# From desktop, access from mobile on same network
http://<desktop_ip>:3000
```

### Different Browsers
- Chrome/Chromium: Primary
- Firefox: Supported
- Safari: Supported (may have CORS issues with API)

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| CORS error | Ensure API calls have proper `apikey` header |
| Slow weather updates | OpenWeatherMap free tier: 1 call/10 minutes |
| Stale data | Clear browser cache (Ctrl+Shift+Delete) |
| Region not saving | Implement localStorage persistence |

## 📚 References

- [OpenWeatherMap API Docs](https://openweathermap.org/api)
- [Laravel Environment Variables](https://laravel.com/docs/11.x/configuration#environment-configuration)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

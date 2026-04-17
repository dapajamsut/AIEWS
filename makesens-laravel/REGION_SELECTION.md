# Region/Daerah Selection Feature

## 🌍 Overview

Sistem sekarang mendukung **pemilihan daerah/region** untuk weather forecasting dan threshold management. Ini memungkinkan multi-region monitoring dengan data cuaca yang akurat per lokasi.

## ✨ Features

### 1. Region Selector di Semua Halaman

#### Dashboard (`app/pages/Dashboard.tsx`)
- Region dropdown di header kanan
- Default: Jakarta Pusat
- Saat region berubah → weather data update

#### Sensor Page (`app/sensors/page.tsx`) 
- Region dropdown di header kanan
- Semua sensor thresholds update sesuai region
- Weather status menampilkan data region terpilih

#### Threshold Management (`app/threshold/page.tsx`)
- Dedicated region selector card
- Info panel: "Daerah yang dipilih akan mempengaruhi kondisi cuaca dari OpenWeatherMap API"
- SIAGA thresholds tetap global (tidak per-region)

### 2. Daerah yang Didukung

```
Jakarta Pusat & Sekitarnya:
  - jakarta_pusat: Jakarta Pusat (-6.1744, 106.8229)
  - jakarta_utara: Jakarta Utara (-6.1200, 106.8300)
  - jakarta_barat: Jakarta Barat (-6.1370, 106.7450)
  - jakarta_selatan: Jakarta Selatan (-6.2700, 106.8000)
  - jakarta_timur: Jakarta Timur (-6.2100, 107.0100)

Jabodetabek:
  - depok_beji: Depok - Kec. Beji (-6.3625, 106.8253)
  - depok_cimanggis: Depok - Kec. Cimanggis (-6.3714, 106.9234)
  - depok_limo: Depok - Kec. Limo (-6.3571, 106.8042)
  - bogor_pusat: Bogor Pusat (-6.5971, 106.7883)
  - tangerang_pusat: Tangerang Pusat (-6.1784, 106.6327)
  - bekasi_pusat: Bekasi Pusat (-6.2349, 107.0057)
```

## 🔧 Backend Implementation

### ThresholdController.php

#### New Methods:

**`getWeatherData()`**
```php
Parameters:
  - region: string (default: 'jakarta')
  - lat: float (latitude, retrieved from regions table)
  - lon: float (longitude, retrieved from regions table)

Returns:
  {
    "current_weather": { ... },
    "condition": "normal",
    "thresholds": { ... },
    "region": "depok_beji",
    "location": { "latitude": -6.36, "longitude": 106.83 }
  }
```

**`getRegions()`**
```php
Returns: Array of regions with id, name, latitude, longitude

[
  { "id": "jakarta_pusat", "name": "Jakarta Pusat", "latitude": -6.1744, "longitude": 106.8229 },
  { "id": "depok_beji", "name": "Depok - Kecamatan Beji", "latitude": -6.3625, "longitude": 106.8253 },
  ...
]
```

### API Routes (api.php)

```php
Route::get('/weather', [ThresholdController::class, 'getWeatherData']);
Route::get('/regions', [ThresholdController::class, 'getRegions']);
```

## 💻 Frontend Implementation

### State Management

**Dashboard.tsx & Sensors/page.tsx:**
```typescript
const [selectedRegion, setSelectedRegion] = useState<string>('jakarta_pusat');
const [regions, setRegions] = useState<any[]>([]);

// Fetch regions on mount
useEffect(() => { fetchRegions(); }, []);

// Fetch weather whenever region changes
useEffect(() => { fetchWeatherData(); }, [selectedRegion, regions]);
```

### useEffect Flow

```
1. Mount Component
   ↓
2. Fetch Regions from /api/regions
   ↓
3. Set selectedRegion to first region (or stored preference)
   ↓
4. Fetch Weather Data:
   - Get coords from selected region
   - Call /api/weather?region=X&lat=Y&lon=Z
   - Update weather state
   ↓
5. Auto-refresh every 10 minutes
```

## 🎯 Flow Diagram

```
User selects Region (Depok Beji)
    ↓
setSelectedRegion('depok_beji')
    ↓
useEffect triggered with [selectedRegion, regions]
    ↓
Get coordinates: lat=-6.3625, lon=106.8253
    ↓
Call: /api/weather?region=depok_beji&lat=-6.3625&lon=106.8253
    ↓
Backend: GetWeatherData
  - Query OpenWeatherMap API
  - Get real-time weather for coordinates
  - Calculate condition (kering/normal/berangin/hujan/hujan_deras)
  - Get thresholds from DB for that condition
    ↓
Return weather response
    ↓
setWeatherCondition(data.condition)
setCurrentWeather(data.current_weather)
setCurrentWeatherThresholds(data.thresholds)
    ↓
UI Updates
```

## 📝 Testing

### Test Region Selection

```bash
# Get all regions
curl -H "apikey: pikel2" http://localhost:8000/api/regions

# Get weather for specific region
curl -H "apikey: pikel2" \
  "http://localhost:8000/api/weather?region=depok_beji&lat=-6.3625&lon=106.8253"

# Get weather for default region
curl -H "apikey: pikel2" http://localhost:8000/api/weather
```

### Expected Response

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
  "region": "depok_beji",
  "location": {
    "latitude": -6.3625,
    "longitude": 106.8253
  }
}
```

## 🛠️ Adding New Regions

### Method 1: Code Update (Hardcoded)

**File:** `app/Http/Controllers/ThresholdController.php`

```php
public function getRegions()
{
    $regions = [
        // Existing regions...
        ['id' => 'subang_pusat', 'name' => 'Subang Pusat', 'latitude' => -6.5730, 'longitude' => 107.7854],
        ['id' => 'bandung_pusat', 'name' => 'Bandung Pusat', 'latitude' => -6.9175, 'longitude' => 107.6191],
    ];
    return response()->json($regions);
}
```

### Method 2: Database Storage (Future)

```
1. Create migration for regions table
2. Seed regions to database
3. Update getRegions() to fetch from DB
```

## 📊 Database Considerations

### Current Implementation
- Regions hardcoded di controller
- Koordinat statis
- No region preferences persisted

### Future Improvements
1. Store regions in DB table
2. Save user's last selected region
3. Support custom region management
4. Regional threshold customization

## ⚠️ Error Handling

### Scenario: OpenWeatherMap API Fails

```
GET /api/weather?region=depok_beji
    ↓
OpenWeatherMap API timeout
    ↓
Response:
{
  "error": "Failed to fetch weather data from OpenWeatherMap",
  "current_weather": null,
  "condition": "normal",
  "thresholds": { "wind": 10, "rain": 5, "temp": 28, "humidity": 65, "pressure": 1015 },
  "region": "depok_beji"
}
    ↓
Frontend fallback to default thresholds
```

### Console Logging

```typescript
// Dashboard.tsx
catch (err) {
  console.error("Fetch weather data error:", err);
  console.error("Weather API error:", data.error);
  // Use fallback values
}
```

## 🔐 Security Notes

- Region selection is client-side only
- No validation needed (hardcoded values)
- API key protection via `apikey` header
- CORS handled by Kong gateway

## 📱 UI/UX Considerations

### Responsive Design
- Dropdown resizes on mobile
- Maintains layout on all screen sizes
- Region name readable on small screens

### User Experience
- Region persists during session
- Immediate update on selection
- Loading state handled gracefully
- Fallback to defaults if API fails

## 🐛 Known Issues & Limitations

1. **Region persistence**: Region selection is lost on page refresh
   - Solution: Add localStorage to persist selection

2. **Hardcoded regions**: Adding regions requires code update
   - Solution: Migrate to database storage

3. **No sub-region hierarchy**: Can't navigate sub-districts
   - Solution: Implement dropdown hierarchy

## 🚀 Next Steps

1. ✅ Basic region selection implemented
2. ⏳ Add localStorage persistence
3. ⏳ Migrate regions to database
4. ⏳ Support nested region hierarchy
5. ⏳ Regional threshold customization
6. ⏳ Weather history per region

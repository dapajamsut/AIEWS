# Weather API Integration

## Perubahan Terkini

Threshold untuk setiap kondisi cuaca sekarang **diambil otomatis dari Weather API** dan tidak bisa lagi diubah manual melalui halaman threshold.

### Flow Sistem

1. **Frontend** → Mengambil data cuaca real-time dari `/api/weather`
2. **Backend** → Mengakses OpenWeatherMap API, menentukan kondisi cuaca, dan mengembalikan thresholds untuk kondisi tersebut
3. **UI** → Menampilkan kondisi cuaca dan threshold yang berlaku saat ini

### Fitur yang Berubah

#### Dashboard (app/pages/Dashboard.tsx)
- ❌ `getWeatherCondition()` function - dihapus
- ✨ Kondisi cuaca sekarang dari Weather API (bukan calculated dari sensor data)
- Threshold cuaca otomatis dari API

#### Sensor Page (app/sensors/page.tsx)
- ✨ Thresholds cuaca diambil langsung dari `/api/weather` response
- Tidak ada fetch terpisah untuk weather thresholds
- Update setiap 10 menit dari API

#### Threshold Management (app/threshold/page.tsx)
- ❌ Tab "Kondisi Cuaca" dihapus (tidak bisa diubah)
- ✅ Tab "Threshold SIAGA" tetap tersedia (masih bisa diubah manual)
- ℹ️ Info box menjelaskan bahwa weather thresholds diatur otomatis

## Konfigurasi

## 1. Dapatkan OpenWeatherMap API Key

1. Kunjungi [OpenWeatherMap](https://openweathermap.org/api)
2. Buat akun gratis
3. Dapatkan API key dari dashboard
4. Update file `.env` di root project Laravel:

```env
OPENWEATHER_API_KEY=your_actual_api_key_here
OPENWEATHER_LAT=-6.2088  # Koordinat Jakarta (ubah sesuai lokasi)
OPENWEATHER_LON=106.8456
```

## 2. Test API Weather

Setelah setup API key, test endpoint:

```bash
curl -H "apikey: pikel2" http://localhost:8000/api/weather
```

Response yang diharapkan:
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
  }
}
```

## 3. Fitur yang Tersedia

- **Real-time Weather Data**: Mengambil data cuaca terkini dari OpenWeatherMap API
- **Dynamic Weather Condition**: Kondisi cuaca (kering/normal/berangin/hujan/hujan_deras) ditentukan otomatis berdasarkan data cuaca real-time
- **Auto Weather Thresholds**: Threshold sensor disesuaikan otomatis dengan kondisi cuaca saat ini
- **UI Updates**: Tampilan web menampilkan kondisi cuaca dan data cuaca terkini

## 4. Cara Kerja

1. Frontend mengambil data cuaca dari `/api/weather` setiap 10 menit
2. API menentukan kondisi cuaca berdasarkan data OpenWeatherMap
3. Backend mengembalikan threshold yang sesuai dengan kondisi cuaca tersebut
4. UI menampilkan kondisi cuaca dan data cuaca saat ini dengan threshold yang berlaku

## 5. Konfigurasi Lokasi

Ubah koordinat di `.env` untuk lokasi yang berbeda:

```env
OPENWEATHER_LAT=-7.7956  # Contoh: Surabaya
OPENWEATHER_LON=110.3695
```

## 6. Threshold SIAGA

Threshold untuk SIAGA (berdasarkan tinggi air) masih bisa diubah manual melalui halaman Threshold > Threshold SIAGA.

## 7. API Endpoints

### Get Weather Data dengan Auto Thresholds
```
GET /api/weather
Headers: apikey: pikel2
```

### Get/Update SIAGA Thresholds (Manual)
```
GET /api/thresholds?type=siaga
POST /api/thresholds (type: siaga, level: 1|2|3, water: number)
```
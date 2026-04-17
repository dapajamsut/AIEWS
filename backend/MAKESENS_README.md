# AIEWS MakeSens Dashboard

Dashboard web monitoring air berbasis AI dan IoT dengan sistem autentikasi dan dual theme (Light & Dark).

## 🎯 Fitur Utama

### Autentikasi
- **Login**: Form login dengan email, password, dan fitur "Remember Me"
- **Register**: Pendaftaran untuk petugas lapangan/admin baru dengan data:
  - Nama Lengkap
  - Instansi
  - Email
  - Password

### Dashboard
- **Header**:
  - Jam real-time
  - Toggle Dark/Light Mode
  - Menu user dengan foto profil dan logout
  
- **Sidebar Navigasi**:
  - Dashboard Overview
  - Live AI Vision
  - Log Sensor
  - Status Alat
  
- **Metric Cards**:
  - Tinggi Muka Air (TMA): 145cm
  - Status Siaga: Siaga 2
  - Curah Hujan: 25mm/h
  - Baterai Alat: 87%

- **AI Vision Monitor**:
  - Live feed CCTV
  - Visual overlay dengan bounding box
  - Deteksi sampah dengan TDI (Trash Detection Index)
  - Akurasi AI real-time

- **Visualisasi Data**:
  - Grafik tren TMA 24 jam (Area Chart)
  - Peta lokasi monitoring
  - Panel notifikasi & peringatan real-time

## 📁 Struktur File & Komponen

```
/src/app/
├── contexts/
│   ├── AuthContext.tsx       # Manajemen autentikasi
│   └── ThemeContext.tsx      # Manajemen dark/light mode
├── pages/
│   ├── Login.tsx            # Halaman login
│   ├── Register.tsx         # Halaman register
│   └── Dashboard.tsx        # Halaman dashboard utama
├── components/
│   └── dashboard/
│       ├── Header.tsx       # Header dengan clock & user menu
│       ├── Sidebar.tsx      # Sidebar navigasi desktop
│       ├── MobileSidebar.tsx # Sidebar untuk mobile
│       ├── MetricCard.tsx   # Card untuk metrics
│       ├── AIVisionPanel.tsx # Panel AI Vision CCTV
│       ├── WaterLevelChart.tsx # Grafik tren air
│       ├── NotificationPanel.tsx # Panel notifikasi
│       └── MapPanel.tsx     # Panel peta lokasi
├── routes.ts               # Konfigurasi routing
├── ProtectedRoute.tsx     # HOC untuk route protection
└── App.tsx                # Root component
```

## 🎨 Desain & Styling

- **Framework**: React + Tailwind CSS v4
- **Font**: Inter (Google Fonts)
- **Tema**: Dual theme support (Light & Dark)
- **Style**: Modern, industrial, clean
- **Responsive**: Mobile-first design dengan sidebar mobile

## 🔐 Sistem Autentikasi

### Login
- Email dan password
- Checkbox "Remember Me" untuk menyimpan session
- Toggle visibility password
- Validasi form
- Auto-redirect ke dashboard jika sudah login

### Register
- Form lengkap untuk pendaftaran
- Validasi password (minimal 6 karakter)
- Konfirmasi password
- Auto-login setelah registrasi berhasil

### Protected Routes
- Dashboard dan semua sub-routes memerlukan autentikasi
- Auto-redirect ke login jika belum authenticate
- Session disimpan di localStorage

## 🌓 Dark Mode

- Toggle button di header
- Automatic save preference ke localStorage
- Smooth transition antar themes
- Semua komponen support dark mode

## 📊 Data & Mock

Saat ini aplikasi menggunakan mock data untuk:
- Login/Register (menerima semua input valid)
- Sensor data (TMA, curah hujan, baterai)
- AI Vision detection
- Notifikasi real-time
- Grafik 24 jam

## 🚀 Cara Penggunaan

### Login
1. Buka halaman login
2. Masukkan email dan password (apa saja untuk demo)
3. Optional: Centang "Remember Me"
4. Klik tombol "Login"

### Register
1. Klik "Daftar sekarang" di halaman login
2. Isi semua field:
   - Nama Lengkap
   - Instansi (contoh: BMKG, BPBD)
   - Email
   - Password (min 6 karakter)
   - Konfirmasi Password
3. Klik "Daftar"

### Dashboard
1. Setelah login, akan langsung masuk ke dashboard
2. Lihat metrics real-time di kartu-kartu atas
3. Monitor AI Vision feed di panel tengah
4. Lihat notifikasi di panel kanan
5. Analisis grafik tren di bagian bawah
6. Toggle dark mode dengan tombol moon/sun di header
7. Logout melalui menu user

### Mobile
1. Di mobile, klik icon menu (hamburger) untuk membuka sidebar
2. Semua fitur tetap accessible
3. Layout responsive otomatis menyesuaikan

## 🔄 Routing

- `/` → Redirect ke `/login`
- `/login` → Halaman Login
- `/register` → Halaman Register
- `/dashboard` → Dashboard Overview (Protected)
- `/dashboard/ai-vision` → AI Vision View (Protected)
- `/dashboard/logs` → Log Sensor (Protected)
- `/dashboard/status` → Status Alat (Protected)

## 🎯 Teknologi

- **React** 18.3.1
- **React Router** 7.13.0
- **Tailwind CSS** 4.1.12
- **Recharts** 2.15.2 (untuk grafik)
- **Lucide React** 0.487.0 (untuk icons)
- **Radix UI** (untuk komponen UI)

## 💡 Catatan

- Aplikasi ini adalah frontend-only dengan mock authentication
- Untuk production, hubungkan dengan backend API untuk autentikasi real
- Data sensor saat ini adalah mock data untuk demonstrasi
- Semua komponen sudah responsive dan support dark mode
- Logo MakeSens menggunakan icon Droplets dari Lucide

## 🌊 Branding

**MakeSens** - AIEWS (AI Early Warning System)
- Tagline: "Sistem Monitoring Air Berbasis AI & IoT"
- Warna utama: Blue (#3B82F6) dan Cyan
- Target: Petugas lapangan dan administrator monitoring air

---

Dikembangkan dengan ❤️ untuk sistem monitoring air Indonesia

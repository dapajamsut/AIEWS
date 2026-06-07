import time
import json
import signal
import sys
import random
import paho.mqtt.client as mqtt

# ==========================================
# KONFIGURASI MQTT
# ==========================================
MQTT_BROKER = "127.0.0.1"
MQTT_PORT   = 1883
MQTT_TOPIC  = "makesens/test/tmj"

# Interval antar pesan (detik) — lebih pendek untuk mempercepat pengujian
INTERVAL = 10

# ==========================================
# PHYSICS PARAMS (sesuai DB)
# water_siaga1 = 50 cm, water_siaga2 = 40 cm
# physics_w = 15, A_DAS = 10_000_000, C = 0.75, L_segment = 1000
# ==========================================
W        = 15
A_DAS    = 10_000_000
C        = 0.75
L_SEG    = 1000
SIAGA1_CM = 50   # water_siaga1 dari DB
SIAGA2_CM = 40   # water_siaga2 dari DB

def hitung_eta(h_cm, I_mmh):
    """Hitung ETA (jam) persis seperti logika backend PHP."""
    if h_cm >= SIAGA1_CM:
        return 0.0
    sisa   = (SIAGA1_CM - h_cm) / 100.0          # meter
    vol    = sisa * W * L_SEG                      # m³
    if I_mmh <= 0:
        return 9999.0
    q      = C * (I_mmh / 3_600_000) * A_DAS      # m³/s
    eta    = vol / q / 3600                         # jam
    return round(eta, 2)

def siaga_backend(h_cm, I_mmh):
    """Replika persis rule engine backend (PHP) untuk preview di terminal."""
    if h_cm >= SIAGA1_CM:
        return "1"
    eta = hitung_eta(h_cm, I_mmh)
    q   = C * (I_mmh / 3_600_000) * A_DAS if I_mmh > 0 else 0
    if q > 0:
        prob = 100 if (I_mmh >= 100 and eta < 3) else 0
        if eta <= 2 or prob >= 90:
            status = "1"
        elif eta <= 4:
            status = "2"
        elif eta <= 8:
            status = "3"
        else:
            status = "3"
        # second override (sama seperti PHP)
        if eta <= 2 or (I_mmh >= 100 and eta < 3):
            status = "1"
        elif eta <= 4 and status == "3":
            status = "2"
    else:
        status = "2" if h_cm >= SIAGA2_CM else "3"
    return status

SIAGA_LABEL = {"1": "SIAGA 1 🚨 BAHAYA", "2": "SIAGA 2 ⚠️  WASPADA", "3": "SIAGA 3 ✅ NORMAL"}

# ==========================================
# NILAI YANG SUDAH DIHITUNG AGAR TEPAT MASUK SETIAP SIAGA
# (dengan water_siaga1=50cm, water_siaga2=40cm dari DB)
#
#   Siaga 3: water=20cm, rain=0.0  → ETA N/A (no rain, water < 40) ✓
#   Siaga 2: water=20cm, rain=0.22 → ETA ≈ 2.7 jam (2 < ETA ≤ 4) ✓
#   Siaga 1: water=55cm, rain=0.0  → water >= siaga1(50) langsung  ✓
#   Recovery: water=20cm, rain=0.0 → kembali Normal                 ✓
# ==========================================

# Skenario: (nama_fase, water_cm, rain_mmh, jumlah_pesan, deskripsi)
# jumlah_pesan × INTERVAL = durasi fase
# Siaga 1 butuh ≥ 4 pesan (40s) untuk trigger 1× periodic notif (30s)
# Siaga 2 butuh ≥ 7 pesan (70s) untuk trigger 1× periodic notif (60s)
SCENARIO = [
    # Fase              water  rain    n    keterangan
    ("SIAGA 3",          20,   0.0,    5,  "Tidak hujan, ketinggian air rendah (Normal)"),
    ("SIAGA 2 [3→2]",    20,   0.22,   8,  "Hujan ringan, ETA ~2.7 jam → transisi 3→2 + 1× periodic"),
    ("SIAGA 1 [2→1]",    55,   0.0,    8,  "Air meluap (55cm ≥ 50cm) → transisi 2→1 + 2× periodic"),
    ("SIAGA 3 [1→3]",    20,   0.0,    5,  "Air surut, hujan berhenti → transisi 1→3 (Normal)"),
    ("SIAGA 1 [3→1]",    55,   0.0,    8,  "Langsung Siaga 1 dari Normal → 3→1 + 2× periodic"),
    ("SIAGA 2 [1→2]",    20,   0.22,   8,  "Air surut, hujan ringan → transisi 1→2 (membaik) + 1× periodic"),
    ("SIAGA 3 [2→3]",    20,   0.0,    5,  "Hujan berhenti → transisi 2→3 (kembali Normal)"),
]

# ==========================================
# STOP SIGNAL
# ==========================================
running = True

def signal_handler(sig, frame):
    global running
    print("\n[STOP] Simulasi dihentikan oleh pengguna.")
    running = False

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# ==========================================
# PUBLISH
# ==========================================
def publish(client, h, I, wind, temp, hum, pres):
    payload = [
        {"sensor_code": "WATER-01", "type": "water",    "value": round(h,   1), "unit": "cm"},
        {"sensor_code": "TIP-01",   "type": "rain",     "value": round(I,   2), "unit": "mm/h"},
        {"sensor_code": "ANEMO-01", "type": "wind",     "value": round(wind,1), "unit": "m/s"},
        {"sensor_code": "BME-TEMP", "type": "temp",     "value": round(temp,1), "unit": "°C"},
        {"sensor_code": "BME-HUM",  "type": "humidity", "value": round(hum, 1), "unit": "%"},
        {"sensor_code": "BME-PRES", "type": "pressure", "value": round(pres,1), "unit": "hPa"},
    ]
    client.publish(MQTT_TOPIC, json.dumps(payload))

def interruptible_sleep(seconds):
    end = time.time() + seconds
    while running and time.time() < end:
        time.sleep(0.2)

# ==========================================
# JALANKAN SATU FASE
# ==========================================
def run_phase(client, fase_name, water_cm, rain_mmh, count, desc, cycle, phase_idx):
    print()
    print("=" * 65)
    print(f"  SIKLUS {cycle} | FASE {phase_idx + 1}/{len(SCENARIO)}: {fase_name}")
    print(f"  {desc}")
    print(f"  Target: water={water_cm}cm, rain={rain_mmh}mm/h")
    eta = hitung_eta(water_cm, rain_mmh)
    predicted = siaga_backend(water_cm, rain_mmh)
    eta_str = f"{eta:.1f} jam" if eta < 9000 else "N/A (tidak hujan)"
    print(f"  ETA terhitung: {eta_str} → Prediksi backend: {SIAGA_LABEL[predicted]}")
    print(f"  Mengirim {count} pesan × {INTERVAL}s = {count * INTERVAL}s")
    print("=" * 65)

    for i in range(count):
        if not running:
            return

        # Tambah sedikit jitter agar data terlihat realistis
        # Jitter kecil supaya tidak crossing batas siaga secara tidak sengaja
        h    = water_cm + random.uniform(-1.0, 1.0)
        I    = rain_mmh + random.uniform(-0.01, 0.01)
        I    = max(0.0, I)

        # Sensor lain menyesuaikan kondisi
        wind = 3.0 + rain_mmh * 1.2 + random.uniform(-0.3, 0.3)
        temp = 32.0 - rain_mmh * 0.5 + random.uniform(-0.2, 0.2)
        hum  = 65.0 + rain_mmh * 4.0 + random.uniform(-0.5, 0.5)
        pres = 1013.0 - rain_mmh * 0.5 + random.uniform(-0.2, 0.2)

        hum  = min(hum, 99.9)

        actual_eta     = hitung_eta(h, I)
        actual_siaga   = siaga_backend(h, I)
        eta_display    = f"{actual_eta:.1f}j" if actual_eta < 9000 else "N/A"

        publish(client, h, I, wind, temp, hum, pres)

        print(f"  [{time.strftime('%H:%M:%S')}] Pesan {i+1:02d}/{count:02d} | "
              f"Air: {h:.1f}cm | Hujan: {I:.2f}mm/h | "
              f"ETA: {eta_display} | → {SIAGA_LABEL[actual_siaga]}")

        interruptible_sleep(INTERVAL)

# ==========================================
# MAIN LOOP
# ==========================================
client = mqtt.Client(
    callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
    client_id="makesens_notif_tester"
)

print("=" * 65)
print("  DUMMY SENSOR — PENGUJIAN NOTIFIKASI FCM")
print("=" * 65)
print(f"  Broker  : {MQTT_BROKER}:{MQTT_PORT}")
print(f"  Topic   : {MQTT_TOPIC}")
print(f"  Interval: {INTERVAL} detik per pesan")
print()
print("  SKENARIO TRANSISI YANG AKAN DIUJI:")
for idx, (name, w, r, n, d) in enumerate(SCENARIO):
    eta = hitung_eta(w, r)
    eta_str = f"{eta:.1f}j" if eta < 9000 else "N/A"
    print(f"    Fase {idx+1}: {name:<18} water={w}cm, rain={r}mm/h, ETA={eta_str} ({n}×{INTERVAL}s)")
print()
print("  Tekan Ctrl+C untuk berhenti kapan saja.")
print("=" * 65)

print("\nMenghubungkan ke broker MQTT...")
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start()
print("✅ Terhubung!\n")

cycle = 1
try:
    while running:
        print(f"\n{'#' * 65}")
        print(f"#  SIKLUS KE-{cycle} DIMULAI")
        print(f"{'#' * 65}")

        for phase_idx, (fase_name, water_cm, rain_mmh, count, desc) in enumerate(SCENARIO):
            if not running:
                break
            run_phase(client, fase_name, water_cm, rain_mmh, count, desc, cycle, phase_idx)
            if not running:
                break
            # Jeda 2 detik antar fase
            interruptible_sleep(2)

        if running:
            print(f"\n✅ Siklus {cycle} selesai. Memulai ulang dalam 3 detik...\n")
            interruptible_sleep(3)
            cycle += 1

finally:
    client.loop_stop()
    client.disconnect()
    print("\n[DISCONNECTED] Koneksi MQTT ditutup.")

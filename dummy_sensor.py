import time
import json
import paho.mqtt.client as mqtt

# ==========================================
# KONFIGURASI MQTT
# ==========================================
MQTT_BROKER = "127.0.0.1"
MQTT_PORT   = 1883
MQTT_TOPIC  = "makesens/test/tmj"

# ==========================================
# PHYSICS DEFAULTS (harus cocok dengan DB)
# w=15m, A_DAS=10_000_000 m², C=0.75, L=1000m
# siaga1_water = 480 cm (default)
# ETA (jam) = (sisa_tinggi * 15 * 1000) / (0.75 * I/3600000 * 10000000) / 3600
# ==========================================

def hitung_eta(h_cm, I_mmh, siaga1_cm=480):
    """Hitung ETA banjir (jam) sesuai rule engine backend."""
    if h_cm >= siaga1_cm:
        return 0.0
    h_m       = h_cm / 100.0
    s1_m      = siaga1_cm / 100.0
    sisa      = s1_m - h_m
    vol_sisa  = sisa * 15 * 1000          # m³
    if I_mmh <= 0:
        return 999.0
    q_hujan   = 0.75 * (I_mmh / 3_600_000) * 10_000_000   # m³/s
    eta_hours = vol_sisa / q_hujan / 3600
    return round(eta_hours, 2)

def siaga_label(eta, h_cm, I_mmh, siaga1_cm=480, siaga2_cm=300):
    if h_cm >= siaga1_cm or (I_mmh >= 100 and eta < 3) or eta <= 2:
        return "SIAGA 1 (BAHAYA)"
    elif eta <= 4:
        return "SIAGA 2 (WASPADA)"
    elif eta <= 8:
        return "SIAGA 3 (AMAN)"
    else:
        # fallback tanpa hujan
        return "SIAGA 2 (WASPADA)" if h_cm >= siaga2_cm else "SIAGA 3 (AMAN)"

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

# ==========================================
# MAIN
# ==========================================
try:
    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id="makesens_dummy_v3"
    )
    print("Menghubungkan ke broker MQTT (Docker/Lokal)...")
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    print("[SUCCESS] Terhubung!\n")

    INTERVAL = 15   # detik antar kiriman data

    # ==================================================
    # FASE 1 — 5 MENIT: KERING, KONDISI NORMAL
    # Target: SIAGA 3
    # Tidak ada hujan, air di level normal ~100-130 cm
    # ==================================================
    steps_f1 = 20   # 20 × 15s = 5 menit
    print("=" * 55)
    print("[FASE 1] (5 menit) - KERING, KONDISI NORMAL")
    print("    Tidak ada hujan. Ketinggian air stabil.")
    print("=" * 55)

    h   = 100.0
    for i in range(steps_f1):
        I    = 0.0
        wind = 3.0 + (i * 0.05)
        temp = 32.0 - (i * 0.05)
        hum  = 65.0 + (i * 0.2)
        pres = 1013.0
        h   += 1.0          # naik 1 cm tiap step (sangat lambat)

        eta   = hitung_eta(h, I)
        label = siaga_label(eta, h, I)

        publish(client, h, I, wind, temp, hum, pres)
        print(f"  [{time.strftime('%H:%M:%S')}] Air: {h:.1f}cm | Hujan: {I:.1f}mm/h | ETA: N/A (no rain) | {label}")
        time.sleep(INTERVAL)

    # ==================================================
    # FASE 2 — 10 MENIT: HUJAN DERAS, PREDIKSI MULAI
    # Target: SIAGA 2 (ETA antara 2–4 jam)
    # Air mulai naik lebih cepat, hujan intensitas 1–2.5 mm/h
    # ETA turun perlahan → sistem masuk SIAGA 2
    # ==================================================
    steps_f2 = 40   # 40 × 15s = 10 menit
    print("\n" + "=" * 55)
    print("[FASE 2] (10 menit) - HUJAN DERAS, PREDIKSI MULAI")
    print("    Banjir mulai terprediksi, namun belum pasti.")
    print("    Sistem memasuki SIAGA 2.")
    print("=" * 55)

    I_start = 0.5
    I_end   = 2.2
    h_f2_start = h

    for i in range(steps_f2):
        I    = I_start + (I_end - I_start) * (i / steps_f2)
        h   += 2.5          # air naik 2.5 cm tiap step
        wind = 8.0 + (i * 0.1)
        temp = 28.0 - (i * 0.05)
        hum  = 80.0 + (i * 0.3)
        pres = 1010.0 - (i * 0.05)

        eta   = hitung_eta(h, I)
        label = siaga_label(eta, h, I)

        publish(client, h, I, wind, temp, hum, pres)
        eta_str = f"{eta:.1f} jam" if eta < 900 else "N/A"
        print(f"  [{time.strftime('%H:%M:%S')}] Air: {h:.1f}cm | Hujan: {I:.2f}mm/h | ETA: {eta_str} | {label}")
        time.sleep(INTERVAL)

    # ==================================================
    # FASE 3 — 10 MENIT: ANCAMAN BANJIR, SIAGA 1
    # Target: SIAGA 1 (ETA ≤ 2 jam)
    # Air terus naik agresif, hujan makin deras → ETA < 2 jam
    # ==================================================
    steps_f3 = 40   # 40 × 15s = 10 menit
    print("\n" + "=" * 55)
    print("[FASE 3] (10 menit) - ANCAMAN BANJIR SUDAH DEKAT")
    print("    SIAGA 1: Banjir diprediksi dalam waktu < 2 jam!")
    print("=" * 55)

    I_start = 2.5
    I_end   = 5.0

    for i in range(steps_f3):
        I    = I_start + (I_end - I_start) * (i / steps_f3)
        h   += 5.0          # air naik 5 cm tiap step (agresif)
        wind = 14.0 + (i * 0.15)
        temp = 25.0 - (i * 0.03)
        hum  = 93.0 + min(i * 0.1, 5)
        pres = 1008.0 - (i * 0.05)

        eta   = hitung_eta(h, I)
        label = siaga_label(eta, h, I)

        publish(client, h, I, wind, temp, hum, pres)
        eta_str = f"{eta:.1f} jam" if eta < 900 else "N/A"
        print(f"  [{time.strftime('%H:%M:%S')}] Air: {h:.1f}cm | Hujan: {I:.2f}mm/h | ETA: {eta_str} | {label}")
        time.sleep(INTERVAL)

    print("\n[SELESAI] Simulasi selesai (25 menit).")

except KeyboardInterrupt:
    print("\n[STOP] Simulasi dihentikan oleh pengguna.")
finally:
    client.loop_stop()
    client.disconnect()
    print("[DISCONNECTED] Koneksi MQTT ditutup.")

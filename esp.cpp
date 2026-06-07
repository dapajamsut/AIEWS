/**
 * ============================================================================
 *  ESP32 PUBLIC NODE — SIRENE EWS BANJIR (ONLINE + OFFLINE via XBee)
 *  ----------------------------------------------------------------------------
 *  DUAL-MODE OPERATION:
 *
 *   🟢 ONLINE  (WiFi+MQTT OK) →  Terima status dari topic 'makesens/test/tmj/siaga'
 *   🔴 OFFLINE (no internet)  →  Terima paket JSON via XBee (Serial2 / UART2)
 *                                XBee B (ESP32) ← RF ← XBee A (Raspi)
 *
 *  Sumber yang lebih baru menang. Jika MQTT diam > MQTT_STALE_MS dan
 *  ada paket XBee masuk, paket XBee yang dipakai (dan sebaliknya).
 *
 *  WIRING XBee B ke ESP32:
 *    ESP32 3.3V    ──→  XBee VCC  (Pin 1)
 *    ESP32 GND     ──→  XBee GND  (Pin 10)
 *    ESP32 GPIO17  ──→  XBee DIN  (Pin 3)   [TX2]
 *    ESP32 GPIO16  ←──  XBee DOUT (Pin 2)   [RX2]
 *
 *  Library: PubSubClient, WiFi, ArduinoJson (built-in)
 * ============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==========================================
// PIN CONFIG
// ==========================================
#define MERAH  26
#define KUNING 27
#define HIJAU  13
#define BUZZER 25

// ==========================================
// XBEE UART CONFIG
// (Telah diselaraskan dan diverifikasi dengan xbee_test_esp32.ino)
// ==========================================
#define XBEE_RX_PIN  16    // GPIO16 → XBee DOUT (Pin 2)
#define XBEE_TX_PIN  17    // GPIO17 → XBee DIN  (Pin 3)
#define XBEE_BAUD    115200

// ==========================================
// WIFI CONFIG
// ==========================================
const char* ssid     = "Kelompok Deden";
const char* password = "kelompok2";

// ==========================================
// MQTT CONFIG
// ==========================================
const char* mqtt_server = "192.168.0.8";
const int   mqtt_port   = 1883;
const char* mqtt_topic  = "makesens/test/tmj/siaga";

// ==========================================
// STALE TIMEOUT
// ==========================================
#define MQTT_STALE_MS  15000UL   // jika MQTT diam > 15s, percaya XBee

// ==========================================
// OBJECTS
// ==========================================
WiFiClient   espClient;
PubSubClient client(espClient);

// Serial2 untuk XBee (UART2)
HardwareSerial XBeeSerial(2);

// ==========================================
// GLOBAL VARIABLE
// ==========================================
volatile int  statusBanjir = 3;
int           lastStatus   = -1;
bool          buzzerState  = false;

unsigned long lastBuzzerToggle     = 0;
unsigned long lastReconnectAttempt = 0;
const long    reconnectInterval    = 5000;

volatile unsigned long lastMqttMs    = 0;
unsigned long          lastXBeeMs    = 0;
uint32_t               lastXBeeSeq   = 0;
volatile const char*   currentSource = "INIT";

// Status koneksi MQTT aman antar core
volatile bool isMqttConnected = false;

// Buffer baris JSON dari XBee
String xbeeBuffer = "";

// ==========================================
// WIFI
// ==========================================
void setup_wifi() {
  WiFi.disconnect(true);
  delay(300);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting WiFi");
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi OK");
    Serial.print("   IP  : "); Serial.println(WiFi.localIP());
    Serial.print("   MAC : "); Serial.println(WiFi.macAddress());
  } else {
    Serial.println("\n⚠️  WiFi GAGAL — mode offline (XBee only)");
  }
}

// ==========================================
// MQTT CALLBACK
// ==========================================
void callback(char* topic, byte* payload, unsigned int len) {
  String msg = "";
  for (unsigned int i = 0; i < len; i++) msg += (char)payload[i];
  msg.trim();
  msg.toLowerCase();

  Serial.println("\n========== MQTT IN ==========");
  Serial.print("TOPIC  : "); Serial.println(topic);
  Serial.print("PAYLOAD: "); Serial.println(msg);

  int newStatus = -1;
  if (msg == "1" || msg == "siaga 1" || msg == "siaga1" ||
      msg == "bahaya" || msg == "awas") {
    newStatus = 1;
    Serial.println("🚨 SIAGA 1 — BAHAYA");
  } else if (msg == "2" || msg == "siaga 2" || msg == "siaga2" ||
             msg == "waspada") {
    newStatus = 2;
    Serial.println("⚠️ SIAGA 2 — WASPADA");
  } else if (msg == "3" || msg == "siaga 3" || msg == "siaga3" ||
             msg == "aman" || msg == "normal") {
    newStatus = 3;
    Serial.println("✅ SIAGA 3 — AMAN");
  } else {
    Serial.println("⚠️ Payload tidak dikenal: " + msg);
  }

  if (newStatus > 0) {
    statusBanjir  = newStatus;
    lastMqttMs    = millis();
    currentSource = "🌐 MQTT";
  }
}

// ==========================================
// XBEE: PROSES BARIS JSON YANG MASUK
// Format JSON dari Raspi:
//   {"siaga":1,"water":120.5,"rain":2.5,"wind":1.2,
//    "temp":28.0,"hum":75.0,"pres":1013.0,"seq":42}
// ==========================================
void processXBeeLine(const String& line) {
  if (line.length() < 10) return;

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, line);
  if (err) {
    Serial.printf("⚠️ XBee JSON parse error: %s | raw: %s\n",
                  err.c_str(), line.c_str());
    return;
  }

  int      siaga = doc["siaga"]  | -1;
  float    water = doc["water"]  | 0.0f;
  float    rain  = doc["rain"]   | 0.0f;
  float    wind  = doc["wind"]   | 0.0f;
  float    temp  = doc["temp"]   | 0.0f;
  float    hum   = doc["hum"]    | 0.0f;
  float    pres  = doc["pres"]   | 0.0f;
  uint32_t seq   = doc["seq"]    | 0;

  if (siaga < 1 || siaga > 3) {
    Serial.printf("⚠️ XBee: siaga invalid (%d)\n", siaga);
    return;
  }

  // Filter duplikat berdasarkan seq
  if (seq != 0 && seq == lastXBeeSeq) return;
  lastXBeeSeq = seq;

  Serial.println("\n========== XBEE IN ==========");
  Serial.printf("SIAGA  : %d\n", siaga);
  Serial.printf("Water  : %.1f cm | Rain: %.2f mm | Wind: %.2f m/s\n", water, rain, wind);
  Serial.printf("Temp   : %.1f °C | Hum: %.1f %% | Pres: %.1f hPa\n", temp, hum, pres);
  Serial.printf("Seq    : %lu\n", (unsigned long)seq);

  lastXBeeMs = millis();

  // Pakai XBee kalau MQTT sedang stale ATAU memang offline
  bool mqttStale = (lastMqttMs == 0) || (millis() - lastMqttMs > MQTT_STALE_MS);
  if (mqttStale || !isMqttConnected) {
    statusBanjir  = siaga;
    currentSource = "📡 XBee (offline path)";
    Serial.println("➡️  Diadopsi sebagai sumber utama");
  } else {
    Serial.println("ℹ️  MQTT masih aktif, XBee hanya logged");
  }
}

// ==========================================
// XBEE: BACA SERIAL2 NON-BLOCKING
// ==========================================
void pollXBee() {
  while (XBeeSerial.available()) {
    char c = (char)XBeeSerial.read();
    if (c == '\n') {
      xbeeBuffer.trim();
      if (xbeeBuffer.length() > 0) {
        processXBeeLine(xbeeBuffer);
      }
      xbeeBuffer = "";
    } else if (c != '\r') {
      xbeeBuffer += c;
      // Cegah buffer overflow
      if (xbeeBuffer.length() > 512) {
        Serial.println("⚠️ XBee buffer overflow, cleared");
        xbeeBuffer = "";
      }
    }
  }
}

// ==========================================
// MQTT CONNECT
// ==========================================
void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;

  unsigned long now = millis();
  if (now - lastReconnectAttempt < reconnectInterval) return;
  lastReconnectAttempt = now;

  if (client.connected()) return;

  String clientId = "ews_esp32_";
  clientId += String(millis(), HEX);

  Serial.print("\n🔌 Connecting MQTT... ID: ");
  Serial.println(clientId);

  bool ok = client.connect(
    clientId.c_str(),
    NULL, NULL,
    NULL, 0, false, NULL,
    true
  );

  if (ok) {
    Serial.println("✅ MQTT CONNECTED!");
    bool sub = client.subscribe(mqtt_topic, 1);
    Serial.print("📡 Subscribe ["); Serial.print(mqtt_topic);
    Serial.print("]: "); Serial.println(sub ? "✅ OK" : "❌ GAGAL");
    client.publish("makesens/test/tmj/esp32", "ews_esp32 online", false);
  } else {
    Serial.print("❌ MQTT GAGAL rc=");
    Serial.println(client.state());
  }
}

// ==========================================
// SIRENE & LAMPU
// ==========================================
void runStatus(int status) {
  unsigned long now = millis();

  if (status != lastStatus) {
    lastStatus       = status;
    lastBuzzerToggle = now;
    if (status == 2) {
      buzzerState = true;
      digitalWrite(BUZZER, LOW); // Mulai dengan buzzer menyala
    } else if (status == 1) {
      buzzerState = true;
      digitalWrite(BUZZER, LOW);
    } else {
      buzzerState = false;
      digitalWrite(BUZZER, HIGH);
    }
    Serial.printf("🔄 Status berubah → SIAGA %d (src: %s)\n", status, currentSource);
  }

  if (status == 1) {
    // Bahaya: Merah nyala, lainnya mati, buzzer menyala terus
    digitalWrite(HIJAU,  HIGH);
    digitalWrite(KUNING, HIGH);
    digitalWrite(MERAH,  LOW);
    digitalWrite(BUZZER, LOW);
  } else if (status == 2) {
    // Waspada: Kuning nyala, lainnya mati
    digitalWrite(HIJAU,  HIGH);
    digitalWrite(KUNING, LOW);
    digitalWrite(MERAH,  HIGH);

    // Pola bip non-blocking: 2 detik ON, 5 detik OFF
    unsigned long elapsed = now - lastBuzzerToggle;
    if (buzzerState) {
      if (elapsed >= 2000) {
        buzzerState = false;
        lastBuzzerToggle = now;
        digitalWrite(BUZZER, HIGH); // Matikan buzzer
      }
    } else {
      if (elapsed >= 5000) {
        buzzerState = true;
        lastBuzzerToggle = now;
        digitalWrite(BUZZER, LOW); // Nyalakan buzzer
      }
    }
  } else if (status == 3) {
    // Aman: Hijau nyala saja, lainnya mati, buzzer mati
    digitalWrite(HIJAU,  LOW);
    digitalWrite(KUNING, HIGH);
    digitalWrite(MERAH,  HIGH);
    digitalWrite(BUZZER, HIGH);
  } else {
    // Unknown: semua mati
    digitalWrite(HIJAU,  HIGH);
    digitalWrite(KUNING, HIGH);
    digitalWrite(MERAH,  HIGH);
    digitalWrite(BUZZER, HIGH);
  }
}

// ==========================================
// BACKGROUND TASK: WIFI & MQTT (Core 0)
// ==========================================
void mqttTask(void *pvParameters) {
  // Tunggu sebentar setelah booting agar inisialisasi setup selesai
  vTaskDelay(pdMS_TO_TICKS(1000));
  
  static unsigned long lastWifiTry = 0;
  
  for (;;) {
    // WiFi reconnect non-blocking
    if (WiFi.status() != WL_CONNECTED) {
      if (millis() - lastWifiTry > 15000) {
        lastWifiTry = millis();
        Serial.println("⚠️ WiFi putus, coba reconnect...");
        WiFi.reconnect();
      }
    }

    // MQTT connection & processing loop
    if (WiFi.status() == WL_CONNECTED) {
      if (!client.connected()) {
        connectMQTT();
      } else {
        client.loop();
      }
    }
    
    // Sinkronisasi status koneksi ke variabel global
    isMqttConnected = client.connected();

    vTaskDelay(pdMS_TO_TICKS(100)); // Delay agar CPU Core 0 tidak terlalu terbebani
  }
}

// ==========================================
// SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n===========================");
  Serial.println("  ESP32 SIRENE BANJIR");
  Serial.println("  Dual-mode: MQTT + XBee RF");
  Serial.println("===========================");

  pinMode(MERAH,  OUTPUT);
  pinMode(KUNING, OUTPUT);
  pinMode(HIJAU,  OUTPUT);
  pinMode(BUZZER, OUTPUT);

  // Boot state: semua aktif (indikator booting)
  digitalWrite(MERAH,  HIGH);
  digitalWrite(KUNING, HIGH);
  digitalWrite(HIJAU,  HIGH);
  digitalWrite(BUZZER, HIGH);

  // 1) Inisialisasi XBee Serial2
  XBeeSerial.begin(XBEE_BAUD, SERIAL_8N1, XBEE_RX_PIN, XBEE_TX_PIN);
  Serial.printf("✅ XBee Serial2 siap (RX=GPIO%d, TX=GPIO%d, baud=%d)\n",
                XBEE_RX_PIN, XBEE_TX_PIN, XBEE_BAUD);

  // 2) WiFi
  setup_wifi();

  // 3) MQTT setup
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  client.setBufferSize(512);
  client.setKeepAlive(60);
  client.setSocketTimeout(15);

  lastReconnectAttempt = 0;

  // 4) Daftarkan background task untuk WiFi/MQTT pada Core 0
  xTaskCreatePinnedToCore(
    mqttTask,       /* Fungsi task */
    "MQTT_Task",    /* Nama task */
    8192,           /* Stack size (8KB) */
    NULL,           /* Parameter */
    1,              /* Prioritas task */
    NULL,           /* Task handle */
    0               /* Dijalankan di Core 0 */
  );
}

// ==========================================
// LOOP
// ==========================================
void loop() {
  // Baca XBee setiap loop (non-blocking)
  pollXBee();

  // Heartbeat status setiap 10 detik
  static unsigned long lastLog = 0;
  if (millis() - lastLog > 10000) {
    lastLog = millis();
    bool mqttOk         = isMqttConnected;
    unsigned long sinceMqtt  = (lastMqttMs  == 0) ? 0 : (millis() - lastMqttMs);
    unsigned long sinceXBee  = (lastXBeeMs  == 0) ? 0 : (millis() - lastXBeeMs);
    Serial.printf("💓 SIAGA=%d | src=%s | MQTT=%s (last=%lus) | XBee last=%lus\n",
                  statusBanjir, currentSource,
                  mqttOk ? "ON" : "off",
                  sinceMqtt / 1000UL, sinceXBee / 1000UL);
  }

  runStatus(statusBanjir);
}

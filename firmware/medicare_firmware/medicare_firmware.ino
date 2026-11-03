/*
 * =====================================================================================
 *  PROJECT: MEDICARE MONITOR — IoT-Based Smart Medicine Reminder System
 *  DEPARTMENT: Electronics & Communication Engineering (ECE)
 *  HARDWARE: ESP8266 NodeMCU ESP-12E
 * =====================================================================================
 *  EXACT HARDWARE PIN MAPPING:
 *  - Morning Medicine LED : Pin D6 (GPIO 12) -> via 220-ohm resistor -> GND
 *  - Night Medicine LED   : Pin D7 (GPIO 13) -> via 230-ohm resistor -> GND
 *  - Passive Buzzer       : Pin D5 (GPIO 14) -> Terminal (+) -> Terminal (-) to GND
 *  - Confirmation Button  : Pin D2 (GPIO 4)  -> Configured as INPUT_PULLUP -> GND
 * =====================================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <ArduinoJson.h>

// -------------------------------------------------------------------------------------
// 1. PIN DEFINITIONS
// -------------------------------------------------------------------------------------
#define BUTTON_PIN      4   // Pin D2 (GPIO 4) - Push Button to GND (INPUT_PULLUP)
#define BUZZER_PIN      14  // Pin D5 (GPIO 14) - Passive Buzzer
#define LED_MORNING_PIN 12  // Pin D6 (GPIO 12) - Morning Medicine Indicator LED
#define LED_NIGHT_PIN   13  // Pin D7 (GPIO 13) - Night Medicine Indicator LED

// -------------------------------------------------------------------------------------
// 2. NETWORK & BACKEND CONFIGURATION
// -------------------------------------------------------------------------------------
// Primary WiFi credentials (supports Wokwi-GUEST for simulation automatically)
const char* primary_ssid     = "Harsha";
const char* primary_password = "0987654321";

// Backend Server IP & Port (Update with your computer's local IP or tunnel URL)
// Note: When running on Wokwi with a local backend, use your machine IP or ngrok tunnel
const char* BACKEND_SERVER   = "http://192.168.1.100:3001"; 
const char* DEVICE_TOKEN     = "medicare-node-token-8266";

// -------------------------------------------------------------------------------------
// 3. NTP TIME CONFIGURATION (Asia/Kolkata: UTC + 5:30)
// -------------------------------------------------------------------------------------
const long utcOffsetInSeconds = 19800; // 5 hours 30 mins * 3600 seconds
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", utcOffsetInSeconds, 60000);

// -------------------------------------------------------------------------------------
// 4. SYSTEM STATE MANAGEMENT
// -------------------------------------------------------------------------------------
enum SystemState {
  STATE_IDLE,
  STATE_MORNING_ACTIVE,
  STATE_NIGHT_ACTIVE
};

SystemState currentState = STATE_IDLE;

// Timing and intervals
unsigned long alarmStartTime = 0;
unsigned long reminderTimeoutMs = 20000; // Default: 20 seconds (configurable from backend)
unsigned long lastBlinkToggle = 0;
bool blinkState = false;

unsigned long lastScheduleSync = 0;
const unsigned long SCHEDULE_SYNC_INTERVAL = 30000; // Sync schedules every 30s

unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 15000;    // Ping backend every 15s

// Local Schedule cache
String morningScheduleTime = "09:00";
String nightScheduleTime   = "21:00";
bool morningActiveToday    = true;
bool nightActiveToday      = true;
bool morningDoneToday      = false;
bool nightDoneToday        = false;
String lastRecordedDate    = "";

// Button Debounce
int lastButtonReading = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long DEBOUNCE_DELAY = 50;

// -------------------------------------------------------------------------------------
// 5. HARDWARE CONTROL FUNCTIONS
// -------------------------------------------------------------------------------------
void soundBuzzer(bool on) {
  if (on) {
    tone(BUZZER_PIN, 2000); // 2 kHz tone for passive buzzer
  } else {
    noTone(BUZZER_PIN);
    digitalWrite(BUZZER_PIN, LOW);
  }
}

void setMorningLED(bool on) {
  digitalWrite(LED_MORNING_PIN, on ? HIGH : LOW);
}

void setNightLED(bool on) {
  digitalWrite(LED_NIGHT_PIN, on ? HIGH : LOW);
}

void stopAllAlarms() {
  soundBuzzer(false);
  setMorningLED(false);
  setNightLED(false);
  currentState = STATE_IDLE;
}

void feedbackBeep() {
  soundBuzzer(true);
  delay(120);
  soundBuzzer(false);
}

// -------------------------------------------------------------------------------------
// 6. BACKEND HTTP API COMMUNICATION
// -------------------------------------------------------------------------------------
void sendEventToBackend(const char* eventType, const char* category) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[HTTP] WiFi not connected. Cannot send event."));
    return;
  }

  WiFiClient client;
  HTTPClient http;

  String endpoint = String(BACKEND_SERVER) + "/api/device/events";
  http.begin(client, endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);
  http.setTimeout(4000);

  StaticJsonDocument<256> doc;
  doc["event_type"] = eventType;
  doc["category"] = category;
  doc["device_token"] = DEVICE_TOKEN;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.print(F("[HTTP] Sending event -> "));
  Serial.println(jsonPayload);

  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    Serial.printf("[HTTP] Event response code: %d\n", httpCode);
    String response = http.getString();
    Serial.println(response);
  } else {
    Serial.printf("[HTTP] Event failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

void fetchSchedulesFromBackend() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;

  String endpoint = String(BACKEND_SERVER) + "/api/device/schedules";
  http.begin(client, endpoint);
  http.addHeader("X-Device-Token", DEVICE_TOKEN);
  http.setTimeout(4000);

  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      if (doc.containsKey("timeout_seconds")) {
        reminderTimeoutMs = doc["timeout_seconds"].as<unsigned long>() * 1000;
      }

      JsonArray schedules = doc["schedules"].as<JsonArray>();
      for (JsonObject s : schedules) {
        const char* cat = s["category"];
        const char* sTime = s["scheduled_time"];
        const char* status = s["status"];

        if (strcmp(cat, "Morning") == 0) {
          morningScheduleTime = String(sTime);
          morningActiveToday = true;
          if (strcmp(status, "confirmed") == 0 || strcmp(status, "missed") == 0) {
            morningDoneToday = true;
          }
        } else if (strcmp(cat, "Night") == 0) {
          nightScheduleTime = String(sTime);
          nightActiveToday = true;
          if (strcmp(status, "confirmed") == 0 || strcmp(status, "missed") == 0) {
            nightDoneToday = true;
          }
        }
      }

      Serial.printf("[SYNC] Schedules Updated. Morning: %s | Night: %s | Timeout: %lu s\n",
                    morningScheduleTime.c_str(), nightScheduleTime.c_str(), reminderTimeoutMs / 1000);
    }
  }

  http.end();
}

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;

  String endpoint = String(BACKEND_SERVER) + "/api/device/status";
  http.begin(client, endpoint);
  http.addHeader("X-Device-Token", DEVICE_TOKEN);
  http.setTimeout(3000);

  http.GET();
  http.end();
}

// -------------------------------------------------------------------------------------
// 7. REMINDER TRIGGER & CONFIRMATION LOGIC
// -------------------------------------------------------------------------------------
void startMorningReminder() {
  stopAllAlarms();
  currentState = STATE_MORNING_ACTIVE;
  alarmStartTime = millis();
  blinkState = false;

  Serial.println(F("\n========================================"));
  Serial.println(F("🚨 MORNING REMINDER ACTIVATED!"));
  Serial.println(F("LED D6 BLINKING | BUZZER ON"));
  Serial.println(F("Waiting for patient confirmation on Button D2..."));
  Serial.println(F("========================================\n"));

  sendEventToBackend("active", "Morning");
}

void startNightReminder() {
  stopAllAlarms();
  currentState = STATE_NIGHT_ACTIVE;
  alarmStartTime = millis();
  blinkState = false;

  Serial.println(F("\n========================================"));
  Serial.println(F("🚨 NIGHT REMINDER ACTIVATED!"));
  Serial.println(F("LED D7 BLINKING | BUZZER ON"));
  Serial.println(F("Waiting for patient confirmation on Button D2..."));
  Serial.println(F("========================================\n"));

  sendEventToBackend("active", "Night");
}

void handleButtonConfirmation() {
  const char* category = (currentState == STATE_MORNING_ACTIVE) ? "Morning" : "Night";

  Serial.println(F("\n✅ PATIENT CONFIRMED MEDICINE! BUTTON PRESSED."));
  
  if (currentState == STATE_MORNING_ACTIVE) {
    morningDoneToday = true;
  } else if (currentState == STATE_NIGHT_ACTIVE) {
    nightDoneToday = true;
  }

  stopAllAlarms();
  feedbackBeep(); // Tactile audio acknowledgment

  sendEventToBackend("confirmed", category);
}

void handleTimeoutMissed() {
  const char* category = (currentState == STATE_MORNING_ACTIVE) ? "Morning" : "Night";

  Serial.println(F("\n⚠️ REMINDER TIMEOUT EXPIRED! MEDICINE MISSED."));
  Serial.println(F("Stopping buzzer & LED. Triggering caretaker Telegram alert..."));

  if (currentState == STATE_MORNING_ACTIVE) {
    morningDoneToday = true;
  } else if (currentState == STATE_NIGHT_ACTIVE) {
    nightDoneToday = true;
  }

  stopAllAlarms();
  sendEventToBackend("missed", category);
}

// -------------------------------------------------------------------------------------
// 8. SETUP INITIALIZATION
// -------------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println(F("\n======================================================="));
  Serial.println(F("🏥 MEDICARE MONITOR — ESP8266 IoT SMART REMINDER FIRMWARE"));
  Serial.println(F("   Pin D6: Morning LED  | Pin D7: Night LED"));
  Serial.println(F("   Pin D5: Buzzer       | Pin D2: Confirmation Button"));
  Serial.println(F("======================================================="));

  // Initialize GPIO Pins
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_MORNING_PIN, OUTPUT);
  pinMode(LED_NIGHT_PIN, OUTPUT);

  // Startup self-test pulse (100ms)
  digitalWrite(LED_MORNING_PIN, HIGH);
  digitalWrite(LED_NIGHT_PIN, HIGH);
  soundBuzzer(true);
  delay(120);
  digitalWrite(LED_MORNING_PIN, LOW);
  digitalWrite(LED_NIGHT_PIN, LOW);
  soundBuzzer(false);

  // WiFi Connection (tries primary credentials first, falls back to Wokwi-GUEST)
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);

  Serial.printf("Connecting to Wi-Fi SSID: %s\n", primary_ssid);
  WiFi.begin(primary_ssid, primary_password);

  unsigned long startWifi = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startWifi < 8000) {
    delay(250);
    Serial.print(F("."));
  }

  // Wokwi simulation fallback
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("\nTrying Wokwi-GUEST simulation network..."));
    WiFi.begin("Wokwi-GUEST", "");
    unsigned long startWokwi = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startWokwi < 5000) {
      delay(250);
      Serial.print(F("."));
    }
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP Address: %s\n", WiFi.localIP().toString().c_str());
    timeClient.begin();
    timeClient.update();
    Serial.printf("[NTP] Synchronized IST Time: %s\n", timeClient.getFormattedTime().c_str());
    fetchSchedulesFromBackend();
  } else {
    Serial.println(F("\n[WiFi] Offline mode active. Commands available via Serial Monitor."));
  }

  Serial.println(F("\nReady! Use Serial Commands for manual academic viva testing:"));
  Serial.println(F(" 'MORNING_ON' -> Trigger Morning Alert (D6 LED + Buzzer)"));
  Serial.println(F(" 'NIGHT_ON'   -> Trigger Night Alert (D7 LED + Buzzer)"));
  Serial.println(F(" 'BUTTON'     -> Simulate D2 Button Press"));
  Serial.println(F(" 'STOP'       -> Stop Alarm"));
  Serial.println(F(" 'STATUS'     -> Show System State\n"));
}

// -------------------------------------------------------------------------------------
// 9. MAIN EXECUTION LOOP
// -------------------------------------------------------------------------------------
void loop() {
  // A. Maintain NTP Time Sync
  if (WiFi.status() == WL_CONNECTED) {
    timeClient.update();
  }

  String currentFormattedTime = timeClient.getFormattedTime(); // "HH:MM:SS"
  String currentHourMin = currentFormattedTime.substring(0, 5); // "HH:MM"

  // B. Periodic Backend Sync & Heartbeat
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    lastHeartbeat = millis();
    sendHeartbeat();
  }

  if (millis() - lastScheduleSync >= SCHEDULE_SYNC_INTERVAL) {
    lastScheduleSync = millis();
    fetchSchedulesFromBackend();
  }

  // C. Schedule Check (When Idle)
  if (currentState == STATE_IDLE && WiFi.status() == WL_CONNECTED) {
    // Check morning reminder
    if (morningActiveToday && !morningDoneToday && currentHourMin == morningScheduleTime) {
      startMorningReminder();
    }
    // Check night reminder
    else if (nightActiveToday && !nightDoneToday && currentHourMin == nightScheduleTime) {
      startNightReminder();
    }
  }

  // D. Active Reminder Alarm Handling (Blinking LED + Pulsing Buzzer)
  if (currentState != STATE_IDLE) {
    // Check if timeout has expired (Missed reminder)
    if (millis() - alarmStartTime >= reminderTimeoutMs) {
      handleTimeoutMissed();
    } else {
      // Blink active LED and sound buzzer at 500ms intervals
      if (millis() - lastBlinkToggle >= 500) {
        lastBlinkToggle = millis();
        blinkState = !blinkState;

        if (currentState == STATE_MORNING_ACTIVE) {
          setMorningLED(blinkState);
          setNightLED(false);
        } else if (currentState == STATE_NIGHT_ACTIVE) {
          setNightLED(blinkState);
          setMorningLED(false);
        }

        soundBuzzer(blinkState);
      }
    }
  }

  // E. Physical Push Button Check on Pin D2 (INPUT_PULLUP: LOW when pressed)
  int buttonReading = digitalRead(BUTTON_PIN);
  if (buttonReading != lastButtonReading) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
    if (buttonReading == LOW) { // Button is actively pressed
      if (currentState != STATE_IDLE) {
        handleButtonConfirmation();
        // Wait until user releases button
        while (digitalRead(BUTTON_PIN) == LOW) {
          delay(10);
          yield();
        }
      }
    }
  }
  lastButtonReading = buttonReading;

  // F. Serial Monitor Command Interface (For Academic Demo & Viva Testing)
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toUpperCase();

    if (cmd == "MORNING_ON") {
      startMorningReminder();
    } else if (cmd == "NIGHT_ON") {
      startNightReminder();
    } else if (cmd == "BUTTON" || cmd == "CONFIRM") {
      if (currentState != STATE_IDLE) {
        handleButtonConfirmation();
      } else {
        feedbackBeep();
        Serial.println(F("[BUTTON] Tested! (No active reminder currently)"));
      }
    } else if (cmd == "STOP" || cmd == "RESET") {
      stopAllAlarms();
      Serial.println(F("Alarm manually stopped."));
    } else if (cmd == "STATUS") {
      Serial.printf("State: %d | Time: %s | Morning: %s | Night: %s\n",
                    currentState, currentFormattedTime.c_str(),
                    morningScheduleTime.c_str(), nightScheduleTime.c_str());
    }
  }

  yield(); // Keep ESP8266 background Wi-Fi tasks healthy
}

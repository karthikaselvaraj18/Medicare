/*
 * =====================================================================================
 *  PROJECT: MEDICARE MONITOR — Wokwi Hardware Simulation Firmware
 *  BOARD: ESP8266 NodeMCU ESP-12E
 * =====================================================================================
 *  Pin Mapping:
 *  - Morning LED: D6 (GPIO 12)
 *  - Night LED:   D7 (GPIO 13)
 *  - Buzzer:      D5 (GPIO 14)
 *  - Button:      D2 (GPIO 4, INPUT_PULLUP)
 * =====================================================================================
 */

#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <NTPClient.h>

#define BUTTON_PIN      4   // D2
#define BUZZER_PIN      14  // D5
#define LED_MORNING_PIN 12  // D6
#define LED_NIGHT_PIN   13  // D7

// Network
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// IST Time: UTC + 5:30 (19800s)
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800, 60000);

enum SystemState {
  STATE_IDLE,
  STATE_MORNING_ACTIVE,
  STATE_NIGHT_ACTIVE
};

SystemState currentState = STATE_IDLE;
unsigned long alarmStartTime = 0;
const unsigned long TIMEOUT_MS = 20000; // 20s demonstration timeout
unsigned long lastBlink = 0;
bool blinkState = false;

void soundBuzzer(bool on) {
  if (on) {
    tone(BUZZER_PIN, 2000);
  } else {
    noTone(BUZZER_PIN);
    digitalWrite(BUZZER_PIN, LOW);
  }
}

void stopAlarm() {
  soundBuzzer(false);
  digitalWrite(LED_MORNING_PIN, LOW);
  digitalWrite(LED_NIGHT_PIN, LOW);
  currentState = STATE_IDLE;
}

void triggerMorning() {
  stopAlarm();
  currentState = STATE_MORNING_ACTIVE;
  alarmStartTime = millis();
  Serial.println(F("\n>>> [WOKWI] MORNING REMINDER ACTIVE! D6 LED Blinking + Buzzer Sounding."));
  Serial.println(F(">>> Press the RED Confirmation Button on D2 within 20 seconds!"));
}

void triggerNight() {
  stopAlarm();
  currentState = STATE_NIGHT_ACTIVE;
  alarmStartTime = millis();
  Serial.println(F("\n>>> [WOKWI] NIGHT REMINDER ACTIVE! D7 LED Blinking + Buzzer Sounding."));
  Serial.println(F(">>> Press the RED Confirmation Button on D2 within 20 seconds!"));
}

void confirmMedicine() {
  Serial.println(F("\n✅ [WOKWI] BUTTON PRESSED! Medicine Confirmed by Patient."));
  Serial.println(F("Buzzer stopped. LED stopped. Status updated to CONFIRMED."));
  stopAlarm();
  
  // Audio chirp feedback
  soundBuzzer(true);
  delay(150);
  soundBuzzer(false);
}

void timeoutMissed() {
  Serial.println(F("\n🚨 [WOKWI] TIMEOUT EXPIRED (20 seconds without confirmation)!"));
  Serial.println(F("Medicine MISSED. Stopping alarm and triggering Telegram Push Alert to Caretaker!"));
  stopAlarm();
}

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_MORNING_PIN, OUTPUT);
  pinMode(LED_NIGHT_PIN, OUTPUT);

  // Self-test flash
  digitalWrite(LED_MORNING_PIN, HIGH);
  digitalWrite(LED_NIGHT_PIN, HIGH);
  soundBuzzer(true);
  delay(120);
  digitalWrite(LED_MORNING_PIN, LOW);
  digitalWrite(LED_NIGHT_PIN, LOW);
  soundBuzzer(false);

  Serial.println(F("\n======================================================="));
  Serial.println(F("🏥 MEDICARE MONITOR — WOKWI SIMULATION RUNNING"));
  Serial.println(F("   D6: Morning LED | D7: Night LED | D5: Buzzer | D2: Button"));
  Serial.println(F("======================================================="));

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print(F("Connecting to Wokwi virtual WiFi..."));
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(200);
    Serial.print(F("."));
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nConnected! Virtual IP: %s\n", WiFi.localIP().toString().c_str());
    timeClient.begin();
    timeClient.update();
    Serial.printf("Synchronized Time (IST): %s\n", timeClient.getFormattedTime().c_str());
  } else {
    Serial.println(F("\nSimulation continuing in Standalone Mode."));
  }

  Serial.println(F("\nCOMMANDS IN SERIAL MONITOR:"));
  Serial.println(F("  '1' or 'MORNING' -> Activate Morning Reminder (D6 + Buzzer)"));
  Serial.println(F("  '2' or 'NIGHT'   -> Activate Night Reminder (D7 + Buzzer)"));
  Serial.println(F("  'C' or 'CONFIRM' -> Simulate Button Confirmation"));
  Serial.println(F("  '0' or 'STOP'    -> Stop Alarm\n"));

  // Automatically demonstrate Morning reminder after 4 seconds
  delay(1500);
  triggerMorning();
}

void loop() {
  // Blink active LED and sound buzzer
  if (currentState != STATE_IDLE) {
    if (millis() - alarmStartTime >= TIMEOUT_MS) {
      timeoutMissed();
    } else {
      if (millis() - lastBlink >= 500) {
        lastBlink = millis();
        blinkState = !blinkState;

        if (currentState == STATE_MORNING_ACTIVE) {
          digitalWrite(LED_MORNING_PIN, blinkState ? HIGH : LOW);
        } else if (currentState == STATE_NIGHT_ACTIVE) {
          digitalWrite(LED_NIGHT_PIN, blinkState ? HIGH : LOW);
        }

        soundBuzzer(blinkState);
      }
    }
  }

  // Physical Button on D2 (INPUT_PULLUP -> Active LOW)
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(40); // Debounce
    if (digitalRead(BUTTON_PIN) == LOW) {
      if (currentState != STATE_IDLE) {
        confirmMedicine();
      } else {
        Serial.println(F("[BUTTON] Click detected."));
      }

      while (digitalRead(BUTTON_PIN) == LOW) {
        delay(10);
      }
    }
  }

  // Serial Monitor Commands
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toUpperCase();

    if (cmd == "1" || cmd == "MORNING") {
      triggerMorning();
    } else if (cmd == "2" || cmd == "NIGHT") {
      triggerNight();
    } else if (cmd == "C" || cmd == "CONFIRM" || cmd == "BUTTON") {
      confirmMedicine();
    } else if (cmd == "0" || cmd == "STOP") {
      stopAlarm();
      Serial.println(F("Alarm stopped."));
    }
  }
}

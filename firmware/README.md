# ESP8266 Firmware Setup & Flashing Guide

## 1. Hardware Pin Connections

| Component | ESP8266 NodeMCU Pin | GPIO Number | Wiring Notes |
|-----------|--------------------|-------------|--------------|
| **Morning LED** | **D6** | GPIO 12 | Long (+) leg to D6 through 220Ω resistor; Short (-) leg to GND |
| **Night LED** | **D7** | GPIO 13 | Long (+) leg to D7 through 230Ω resistor; Short (-) leg to GND |
| **Passive Buzzer** | **D5** | GPIO 14 | Terminal (+) to D5; Terminal (-) to GND |
| **Confirmation Button** | **D2** | GPIO 4 | One terminal to D2; Other terminal to GND (`INPUT_PULLUP`) |

> ⚠️ **Important ECE Note on Passive Buzzer Driving**:
> Standard passive buzzers draw ~20-30mA. The ESP8266 GPIO output is rated up to 12mA safely. If your passive buzzer produces low sound or heats up the GPIO, use an NPN transistor driver (e.g. 2N2222 or BC547) with a 1kΩ base resistor on D5 and buzzer powered from 3.3V/5V.

---

## 2. Arduino IDE Configuration

1. Open **Arduino IDE**.
2. Go to **File -> Preferences** -> **Additional Board Manager URLs**:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
3. Go to **Tools -> Board -> Boards Manager**, search `esp8266` and install.
4. Select Board: **NodeMCU 1.0 (ESP-12E Module)**.
5. Set parameters:
   - **Upload Speed**: `115200` (or `921600` for faster flashing)
   - **CPU Frequency**: `80 MHz` (or `160 MHz`)
   - **Flash Size**: `4MB (FS:2MB OTA:~1019KB)`
   - **Port**: Choose your COM port (e.g., `COM3`, `COM4`)

---

## 3. Libraries Installation

Go to **Sketch -> Include Library -> Manage Libraries...**:
- Search **`ArduinoJson`** -> Install version 6.21.x or higher
- Search **`NTPClient`** -> Install version by Fabrice Weinberg

---

## 4. Configuration Before Flashing

Open `medicare_firmware.ino` and configure:
```cpp
const char* primary_ssid     = "YOUR_WIFI_NAME";
const char* primary_password = "YOUR_WIFI_PASSWORD";
const char* BACKEND_SERVER   = "http://YOUR_COMPUTER_IP:3001";
```

Find your computer's local IP address:
- Open Terminal / Command Prompt on Windows:
  ```powershell
  ipconfig
  ```
- Look for **IPv4 Address** (e.g., `192.168.1.100` or `192.168.43.150`).

---

## 5. Serial Monitor Testing Commands

Open Serial Monitor at **115200 baud** to test independently of schedule:
- Type `MORNING_ON` -> Triggers D6 LED blinking + buzzer
- Type `NIGHT_ON`   -> Triggers D7 LED blinking + buzzer
- Type `BUTTON`     -> Simulates pressing physical button
- Type `STOP`       -> Resets all alarms
- Type `STATUS`     -> Shows system state and current time

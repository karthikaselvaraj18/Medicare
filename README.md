# 🏥 MediCare Monitor

### IoT-Based Smart Medicine Reminder with Caretaker Monitoring & Automated Alert System
*An Academic Final-Year Project — Department of Electronics & Communication Engineering (ECE)*

---

## 📌 Project Overview

**MediCare Monitor** is a complete, full-stack IoT healthcare solution engineered to assist elderly patients in taking prescribed medicines punctually while enabling remote caretakers to monitor confirmation status in real time.

The patient requires **no smartphone or computer access**:
1. When scheduled medicine time arrives, the device sounds a passive buzzer and blinks a dedicated LED indicator (**D6** for Morning medicine, **D7** for Night medicine).
2. The patient takes the medicine and presses the physical confirmation button on **D2**.
3. If the patient does not press the button within the timeout period (configured to **20 seconds** for demonstration, up to **10 minutes** in production), the system automatically flags the reminder as **MISSED**, stops the alarm, updates the caretaker web dashboard, and dispatches an instant push notification alert to the caretaker's phone via the **Telegram Bot API**.

---

## ⚡ System Architecture

```
                          +---------------------------------------------------+
                          |            Caretaker Web Application              |
                          |            (React 19 + Vite + CSS)               |
                          +-------------------------+-------------------------+
                                                    |
                                                    | REST APIs / JWT Auth
                                                    v
                          +---------------------------------------------------+
                          |            Node.js & Express.js Backend           |
                          |          (Port 3001 | node-cron Scheduler)        |
                          +------------+--------------------+-----------------+
                                       |                    |
                 SQLite Database       |                    | Telegram Bot API
               (medicare.db - 6 Tables)|                    | (@MediCare_Alert_Bot)
                                       v                    v
                                 +-----------+     +-------------------+
                                 |  SQLite   |     | Caretaker Phone   |
                                 | Database  |     | Push Notification |
                                 +-----------+     +-------------------+
                                       ^
                                       | HTTP REST API
                                       v
                          +---------------------------------------------------+
                          |         ESP8266 NodeMCU ESP-12E Device            |
                          |           (Wi-Fi + NTP Client IST)                |
                          +-----+------------+---------------+----------------+
                                |            |               |
                                v            v               v
                           Morning LED   Night LED     Passive Buzzer
                            (Pin D6)     (Pin D7)         (Pin D5)
                                                             ^
                                                             | Shared
                                                       Push Button
                                                        (Pin D2)
```

---

## 🔌 Hardware Connections & Fixed Pin Mapping

| Component | ESP8266 NodeMCU Pin | GPIO | Wiring Details |
|---|---|---|---|
| **Morning Medicine LED** | **D6** | GPIO 12 | Long (+) leg to D6 through 220Ω resistor; Short (-) leg to GND |
| **Night Medicine LED** | **D7** | GPIO 13 | Long (+) leg to D7 through 230Ω resistor; Short (-) leg to GND |
| **Passive Buzzer** | **D5** | GPIO 14 | Positive (+) terminal to D5; Negative (-) terminal to GND |
| **Confirmation Button** | **D2** | GPIO 4 | One side to D2; Other side to GND (`INPUT_PULLUP`) |

---

## 🚀 Features

- **Caretaker Web Portal**:
  - Secure Caretaker registration with Patient details & password encryption (bcrypt).
  - Main Dashboard with real-time summary cards, Morning/Night reminder status, and live ESP8266 online indicator.
  - Medicine Scheduling interface (Morning / Night / Other categories, repeat days, notes, LED mappings).
  - Medicine History audit trail with search, date filters, status filters, and Telegram delivery tracking.
  - Alerts & Notifications page with mark-as-read functionality.
  - Settings page with patient info editor, reminder timeout selector (20s demo vs 10min), and **Test Telegram Notification** button.
- **Independent Server Scheduler**:
  - Background `node-cron` job evaluating reminder timeouts every 10 seconds. Missed dose detection runs on the server independently of whether the caretaker has the web browser open.
- **IoT Firmware (ESP8266)**:
  - Time synchronization via NTP in Indian Standard Time (`Asia/Kolkata`, UTC + 5:30).
  - Automatic schedule synchronization over HTTP.
  - Button debouncing and tactile sound acknowledgment.
  - Serial command interface for manual viva and academic evaluation (`MORNING_ON`, `NIGHT_ON`, `BUTTON`, `STATUS`).
- **Wokwi Simulation**:
  - Full circuit simulation with ESP8266, dual LEDs, buzzer, and button (`simulation/diagram.json`).

---

## 💻 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm install
npm test      # Runs automated end-to-end integration test suite
npm start     # Starts Express API server on port 3001
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev   # Starts Vite development server at http://localhost:5173
```

Open `http://localhost:5173` in your browser.

### 3. Hardware Flashing (ESP8266)
1. Open `firmware/medicare_firmware/medicare_firmware.ino` in Arduino IDE.
2. Update Wi-Fi SSID and password to match your local network or mobile hotspot.
3. Update `BACKEND_SERVER` with your computer's local IP (e.g. `http://192.168.1.100:3001`).
4. Select board **NodeMCU 1.0 (ESP-12E Module)** and upload.

---

## 📱 Telegram Bot Setup

1. Open Telegram on your phone and search for **@MediCare_Alert_Bot**.
2. Press `/start`.
3. Obtain your Chat ID using **@userinfobot**.
4. In the MediCare Monitor web dashboard, navigate to **Settings**, paste your **Telegram Chat ID**, and click **Send Test Telegram Alert**.

---

## 📁 Repository Structure

```
Medicare/
├── frontend/             # React 19 + Vite dashboard application
├── backend/              # Node.js + Express + SQLite server
├── firmware/             # Arduino ESP8266 C/C++ firmware
├── simulation/           # Wokwi simulation circuit & firmware
├── docs/                 # Hardware wiring, API specs & setup guides
├── .gitignore            # Excludes node_modules, .env, and db files
└── README.md             # Master project documentation
```

---

## 🎓 Academic Viva Demonstration Procedure

1. **Start Backend & Frontend**: Run `npm start` in `backend` and `npm run dev` in `frontend`.
2. **Log in to Dashboard**: Show the patient details, scheduled medicines, and online status.
3. **Trigger Morning Reminder**:
   - In Arduino Serial Monitor, type `MORNING_ON` (or wait for scheduled time).
   - Show the **Green LED on D6 blinking** and **Passive Buzzer on D5 sounding**.
   - Show the website displaying **Morning Reminder Active**.
4. **Demonstrate Patient Confirmation**:
   - Press the physical push button on **D2** (or type `BUTTON`).
   - Buzzer and LED stop immediately with confirmation beep.
   - Show the dashboard immediately updating status to **CONFIRMED**.
5. **Demonstrate Missed Dose Alert**:
   - Trigger `NIGHT_ON` (Blue LED on D7 blinks + buzzer sounds).
   - Do NOT press the button. Wait 20 seconds.
   - Buzzer and LED turn off automatically.
   - Show the dashboard updating to **MISSED**.
   - Show the caretaker's phone receiving the instant **MISSED MEDICINE ALERT** notification via Telegram!

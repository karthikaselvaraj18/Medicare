# Wokwi Hardware Simulation Guide

This project includes a complete Wokwi hardware simulation for the ESP8266 NodeMCU, Two LEDs, Passive Buzzer, and Confirmation Push Button.

---

## 1. Simulated Circuit Diagram

```
                 +-----------------------+
                 |    ESP8266 NodeMCU    |
                 +-----------------------+
                       |   |   |   |
         D6 (GPIO 12) -+   |   |   +- D2 (GPIO 4)
                           |   |          |
         D7 (GPIO 13) -----+   |      [Push Button]
                               |          |
         D5 (GPIO 14) ---------+         GND
              |
         [Passive Buzzer]
              |
             GND
```

### Pin & Wiring Layout:
- **Morning LED (Green)**: D6 (GPIO 12) → 220Ω Resistor → Anode (+) → Cathode (-) to GND
- **Night LED (Blue)**: D7 (GPIO 13) → 230Ω Resistor → Anode (+) → Cathode (-) to GND
- **Buzzer**: D5 (GPIO 14) → Positive (+) terminal; Negative (-) terminal to GND
- **Confirmation Button**: D2 (GPIO 4) → Terminal 1; Terminal 2 to GND (`INPUT_PULLUP`)

---

## 2. Running in Wokwi Web Simulator

1. Go to **[https://wokwi.com/projects/new/esp8266](https://wokwi.com/projects/new/esp8266)**
2. In the code editor tab, paste the code from `simulation/medicare_simulation.ino` (or `firmware/medicare_firmware/medicare_firmware.ino`).
3. Click on the `diagram.json` tab and paste the contents of `simulation/diagram.json`.
4. Click the green **Play (Start Simulation)** button.

---

## 3. What the Simulation Demonstrates

1. **Self-Test Pulse**: At startup, both LEDs and Buzzer pulse for 120ms to confirm hardware readiness.
2. **Morning Reminder Activation**:
   - The Green LED on **D6** starts blinking at 500ms intervals.
   - The Passive Buzzer on **D5** sounds continuously.
3. **Patient Confirmation**:
   - Click the red **Push Button (D2)**.
   - The buzzer and D6 LED stop immediately.
   - A short confirmation chirp is sounded.
   - Terminal logs: `✅ [WOKWI] BUTTON PRESSED! Medicine Confirmed by Patient.`
4. **Missed Medicine Demo**:
   - Wait for 20 seconds without clicking the button.
   - The buzzer and LED stop automatically.
   - Terminal logs: `🚨 [WOKWI] TIMEOUT EXPIRED! Medicine MISSED. Triggering caretaker Telegram alert.`
5. **Night Reminder**:
   - In the Serial monitor input, type `2` or `NIGHT` and press Enter.
   - The Blue LED on **D7** starts blinking + Buzzer sounds.
   - Click the button to confirm.

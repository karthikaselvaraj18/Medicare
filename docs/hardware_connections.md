# Hardware Connection Specifications & Transistor Driver Guide

## 1. Pin Configuration

| Component | ESP8266 Pin | GPIO Number | Function | Electrical Characteristics |
|---|---|---|---|---|
| **Morning Medicine LED** | **D6** | GPIO 12 | Active indicator for morning dose | High = ON, Low = OFF |
| **Night Medicine LED** | **D7** | GPIO 13 | Active indicator for night dose | High = ON, Low = OFF |
| **Passive Buzzer** | **D5** | GPIO 14 | Audible reminder pulse | Driven with PWM/Tone at 2kHz |
| **Push Button** | **D2** | GPIO 4 | Patient confirmation input | Internal Pull-Up, Active LOW |

---

## 2. Fixed Resistor Calculations & Current Limits

- **ESP8266 GPIO Operating Voltage**: `3.3V`
- **Maximum Safe Continuous Current per GPIO**: `12 mA`
- **Morning LED (Standard 5mm Green / Red)**:
  - Forward Voltage Drop ($V_f$): ~2.0V
  - Resistor: 220Ω
  - Current: $I = (3.3V - 2.0V) / 220\Omega = 5.9 \text{ mA}$ (Well within safe limit)
- **Night LED (Standard 5mm Blue / White)**:
  - Forward Voltage Drop ($V_f$): ~2.8V
  - Resistor: 230Ω
  - Current: $I = (3.3V - 2.8V) / 230\Omega = 2.2 \text{ mA}$ (Safe and bright)

---

## 3. Passive Buzzer Transistor Driver Circuit (Recommended for Demonstrations)

Directly connecting a passive electromagnetic buzzer to an ESP8266 GPIO pin can draw 25mA to 40mA, exceeding the safe 12mA threshold and potentially causing brownout resets or reducing GPIO lifespan.

To prevent overloading the GPIO, use this simple NPN transistor driver circuit:

```
                  +3.3V / +5V (VCC)
                       |
                   [BUZZER]
                       |
                       +------+
                       |      | (Flyback 1N4148 Diode optional)
                       |      |
                       +--+---+
                          |
                      C (Collector)
                          |
 ESP8266 D5 ---[ 1kΩ ]-- B (Base)  NPN Transistor (2N2222 / BC547)
                          |
                      E (Emitter)
                          |
                         GND
```

### Components Required:
1. NPN Transistor (2N2222, BC547, or 2N3904)
2. 1kΩ Resistor (Base resistor)
3. 1N4148 or 1N4007 Diode (Optional flyback protection for inductive coil)

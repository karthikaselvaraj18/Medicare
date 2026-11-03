# MediCare Monitor — REST API Reference

Base URL: `http://localhost:3001`

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Registers a new caretaker and patient profile.
- **Request Body**:
  ```json
  {
    "full_name": "Karthika Selvaraj",
    "email": "karthika@example.com",
    "password": "securepassword",
    "contact_number": "+91 9876543210",
    "patient_name": "Grandmother Vasantha",
    "patient_age": 78,
    "patient_contact": "+91 9876543211"
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "message": "Account registered successfully",
    "user": { "id": 1, "full_name": "...", "email": "..." },
    "token": "eyJhbGciOi..."
  }
  ```

### `POST /api/auth/login`
Authenticates an existing caretaker.
- **Request Body**:
  ```json
  {
    "email": "karthika@example.com",
    "password": "securepassword"
  }
  ```
- **Response** `200 OK`:
  ```json
  {
    "message": "Logged in successfully",
    "user": { ... },
    "token": "eyJhbGciOi..."
  }
  ```

---

## 2. Dashboard & Medicine Scheduling Endpoints

### `GET /api/dashboard`
Returns live summary counts, patient details, morning/night status, and device online state.
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "patient": { "patient_name": "...", "patient_age": 78 },
    "stats": { "total": 2, "confirmed": 1, "missed": 0, "upcoming": 1 },
    "morning_status": "confirmed",
    "night_status": "upcoming",
    "device_online": true
  }
  ```

### `GET /api/medicines`
List all medicine reminder schedules for the caretaker.

### `POST /api/medicines`
Creates a new scheduled medicine. Automatically maps Morning category to D6 and Night to D7.
- **Request Body**:
  ```json
  {
    "medicine_name": "Metformin 500mg",
    "category": "Morning",
    "scheduled_time": "09:00",
    "repeat_days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "instructions": "Take after breakfast"
  }
  ```

---

## 3. IoT Hardware Device Endpoints

### `GET /api/device/schedules`
Polled by ESP8266 to retrieve active schedules for today.
- **Headers**: `X-Device-Token: medicare-node-token-8266`
- **Response**:
  ```json
  {
    "server_time_ist": "09:00:00 AM",
    "timeout_seconds": 20,
    "schedules": [
      {
        "medicine_id": 1,
        "medicine_name": "Metformin 500mg",
        "category": "Morning",
        "scheduled_time": "09:00",
        "led_pin": "D6",
        "status": "upcoming"
      }
    ]
  }
  ```

### `POST /api/device/events`
Sent by ESP8266 when button is pressed or timeout is reached.
- **Headers**: `X-Device-Token: medicare-node-token-8266`
- **Request Body**:
  ```json
  {
    "event_type": "confirmed", // or "missed", "active"
    "category": "Morning"
  }
  ```

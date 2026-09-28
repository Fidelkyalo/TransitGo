# Nairobi Local Bus & Matatu Transit Platform

A full-stack, real-time web application for local public transport in Nairobi, designed in strict accordance with the developer brief specification (`Nairobi_Local_Bus_Matatu_App_Documentation.pdf`).

The platform provides an Uber-like experience tailored specifically for multi-passenger shared buses and matatus operating on established Nairobi routes.

---

## Key Features Built

### 1. Passenger App Experience (Sections 1, 3, 5, 8, 10, 11, 13)
* **Route Discovery & Filtering**: Search and filter Nairobi metropolitan routes (CBD to Rongai, CBD to Ngong, CBD to Thika, CBD to Kikuyu, CBD to Ruaka, CBD to Kiambu).
* **Proximity Vehicle Finding (GPS Discovery)**: Locates active operating vehicles nearby, calculating precise distance (e.g., 650 m), ETA (e.g., 4 min), and fare.
* **Dual Boarding Modes (Section 8)**:
  * **Reserved Seating Mode**: Visual seat map for 33-seater minibuses and 51-seater coaches with 7-minute seat-locking during payment.
  * **Pay & Board Mode**: Fast ticketing for rapid turnaround vehicles (such as 14-seater Nissan matatus) without fixed seat reservations.
* **M-Pesa STK Push Integration (Section 10)**:
  * Initiates Safaricom Daraja STK Push prompt directly to the passenger's phone.
  * Interactive STK prompt simulator with PIN entry.
  * Server-side callback verification before booking and ticket issuance.
* **Digital Ticket & QR Code (Section 11)**:
  * Generates official digital boarding pass with passenger name, vehicle registration plate, route, boarding point, destination, seat number, fare, and high-resolution QR code.
  * Printable and downloadable.
* **Ride-Hailing Style Live Tracking Map (Section 13)**:
  * Interactive Leaflet map displaying passenger location, moving vehicle, designated stops, and route polyline.
  * Real-time telemetry bar showing vehicle speed, distance, and dynamic arrival ETA.

### 2. Driver & Conductor Terminal (Section 6 & 12)
* Mobile-responsive conductor interface with assigned vehicle and route details.
* **Trip Controls**: One-tap "Start Route" and "Stop Route" buttons.
* **Real-Time GPS Tracking**: Automatic GPS waypoint streaming along Nairobi roads and manual GPS ping beacon.
* **Passenger Manifest**: Live roster of verified passengers with boarding stops, destination stops, and boarding statuses.
* **QR Ticket Validator**: Built-in QR scanner and ticket ID validator to scan passenger tickets and clear boarding.

### 3. Transport Operator Dashboard (Section 15)
* Dedicated SACCO management portal (e.g., Super Metro, Ongata Line Rongai SACCO, Citi Hoppa, Kikuyu Travellers).
* **Revenue Analytics**: Real-time revenue reports showing Daily, Weekly, and Monthly totals in Kenyan Shillings (KSh).
* **Fleet Management**: Register new vehicles (plate number, capacity, model, route, reservation mode).
* Active vehicle status indicators and driver assignment tracking.

### 4. Central Platform Administrator Console (Section 16)
* System-wide monitoring of all registered operators, vehicles, drivers, routes, and transactions.
* **City-Wide Active Vehicle Telematics Map**: Live OpenStreetMap showing all active matatus and buses moving simultaneously across Nairobi.
* **Approved Fare Governance**: View and configure approved base fares per route with instant system propagation.
* **Audit & Security Ledger (Section 21)**: Real-time audit log tracking payments, seat locks, trip dispatches, and ticket verifications.

### 5. Split View Demonstration Mode
* Side-by-side split screen showing the Conductor Terminal driving and broadcasting GPS on the left while the Passenger Tracking Screen tracks the vehicle in real time on the right.

---

## Technology Stack

* **Backend**: Node.js, Express, Socket.IO, UUID.
* **Database & State**: In-memory data store with automatic seat-lock expiration worker and audit logging.
* **Real-Time Layer**: WebSockets for vehicle GPS broadcasting, seat status updates, and payment alerts.
* **Frontend**: HTML5, Tailwind CSS, Leaflet.js (OpenStreetMap), QRCode.js, Socket.IO client.
* **Payment Gateway**: Safaricom M-Pesa STK Push simulation with server-side callback lifecycle.

---

## Project Structure

```
├── package.json               # Node.js dependencies and scripts
├── Nairobi_Local_Bus_Matatu_App_Documentation.pdf # Original developer brief
├── server/
│   ├── index.js               # Express server and Socket.IO initialization
│   ├── db.js                  # In-memory database with pre-seeded Nairobi routes & tables
│   ├── routes.js              # REST API endpoints (Passenger, Conductor, Operator, Admin)
│   └── simulator.js           # Real Nairobi route GPS movement simulator
└── public/
    ├── index.html             # Multi-role single page application
    ├── styles.css             # Custom styles and map markers
    └── app.js                 # Frontend application logic, WebSockets, Leaflet maps
```

---

## How to Run

1. **Install Dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Start the Application**:
   ```bash
   npm start
   ```

3. **Open in Browser**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

4. **Testing Personas**:
   * Use the top navigation bar to toggle between **Passenger App**, **Conductor Terminal**, **Operator Dashboard**, **Platform Admin**, or **Split View Demo**.

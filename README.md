# Nairobi Local Bus & Matatu Transit Platform (TransitGo)

A full-stack, real-time web application for local public transport in Nairobi, designed in strict accordance with the developer brief specification (`Nairobi_Local_Bus_Matatu_App_Documentation.pdf`).

The platform provides an Uber-like experience tailored specifically for multi-passenger shared buses and matatus operating on established Nairobi routes.

---

## Complete Feature Matrix

### 1. Passenger App Experience (Sections 1, 3, 5, 8, 10, 11, 13)
* **Route Discovery & Filtering**: Search and filter Nairobi metropolitan corridors (CBD to Rongai, CBD to Ngong, CBD to Thika, CBD to Kikuyu, CBD to Ruaka, and CBD to Kiambu).
* **Proximity Vehicle Finding (GPS Discovery)**: Locates active operating vehicles nearby, calculating precise distance (e.g., 650 m), ETA, and fare.
* **Dual Boarding Modes (Section 8)**:
  * **Reserved Seating Mode**: Visual seat map for 33-seater minibuses and 51-seater coaches with 7-minute seat-locking during payment.
  * **Pay & Board Mode**: Fast ticketing for rapid turnaround vehicles (such as 14-seater Nissan matatus) without pre-assigned seat numbers.
* **M-Pesa STK Push Integration (Section 10)**:
  * Safaricom Daraja STK Push prompt simulation and live credential support.
  * Interactive STK prompt simulator with PIN entry.
  * Server-side callback verification before booking and ticket issuance.
* **Digital Ticket & QR Code (Section 11)**:
  * Generates official digital boarding pass with passenger name, vehicle registration plate, route, boarding point, destination, seat number, fare, and high-resolution QR code.
  * Printable and downloadable.
* **Ride-Hailing Style Live Tracking Map (Section 13)**:
  * Interactive Leaflet map displaying passenger location, moving vehicle, designated stops, and route polyline.
  * Real-time telemetry bar showing vehicle speed, distance, and dynamic arrival ETA.

### 2. Driver & Conductor Terminal (Sections 6 & 12)
* Mobile-responsive conductor interface with assigned vehicle and route details.
* **Trip Controls**: One-tap "Start Route" and "Stop Route" buttons.
* **Real-Time GPS Tracking**: Automatic GPS waypoint streaming along Nairobi roads and manual GPS ping beacon.
* **GPS Driver Authentication (Section 21)**: Driver credentials or secret token verified on telemetry beacons.
* **Passenger Manifest**: Live roster of verified passengers with boarding stops, destination stops, and boarding statuses.
* **QR Ticket Validator**: Built-in QR scanner and ticket ID validator to scan passenger tickets and clear boarding.

### 3. Transport Operator Dashboard (Section 15)
* Dedicated SACCO management portal (Super Metro, Ongata Line Rongai SACCO, Citi Hoppa, Kikuyu Travellers).
* **Revenue Analytics**: Real-time revenue reports showing Daily, Weekly, and Monthly totals in Kenyan Shillings (KSh).
* **Fleet Management**: Register new vehicles (plate number, capacity, model, route, reservation mode).
* **Driver Performance Index (Section 23)**: Monitor safety scores, on-time punctuality, and ratings per driver.
* **Automated Revenue Sharing (Section 23)**: Real-time calculation and settlement split: 85% SACCO Operator, 10% Platform, 5% Nairobi County Mobility Fund.

### 4. Central Platform Administrator Console (Sections 9, 16, 21)
* System-wide monitoring of all registered operators, vehicles, drivers, routes, and transactions.
* **City-Wide Active Vehicle Telematics Map**: Live OpenStreetMap showing all active matatus and buses moving simultaneously across Nairobi.
* **Approved Fare Governance**: View and configure approved base fares per route with instant system propagation.
* **Live Traffic Congestion Controller (Section 23)**: Simulate road congestion on Nairobi corridors to dynamically recalculate ETAs.
* **Audit & Security Ledger (Section 21)**: Real-time immutable audit log tracking logins, payments, seat locks, trip dispatches, and ticket verifications.

### 5. Authentication & Security (Section 21)
* **Password Hashing**: Strong bcrypt (salt rounds: 10) password hashing for all user accounts.
* **JSON Web Tokens (JWT)**: Cryptographically signed Bearer tokens for API authorization.
* **Role-Based Access Control**: Granular permissions for Passenger, Conductor, Operator, and Platform Admin roles.
* **Seat Hold Expiration Worker**: Automatic background daemon releasing unpaid locked seats after 7 minutes.

### 6. Extended Future Features (Section 23)
* **Passenger Digital Wallet**: In-app commuter wallet with balance checking, M-Pesa top-up, and 1-click fare payments.
* **Unlimited Commuter Passes**: 24-Hour Day Pass and 7-Day Weekly Commuter Pass options.
* **Promo Code Engine**: Discount vouchers (e.g. `NAIROBI20`, `TWENDE`, `MATATU50`) applied directly at checkout.
* **Trip History**: Full record of past completed passenger journeys with digital ticket receipts.
* **Favorite Routes**: One-click bookmarking of frequent commutes for instant booking.
* **Customer Support Desk**: In-app ticketing system for payment disputes, lost items, and conductor inquiries.
* **Corporate Commuter Accounts**: Organization commuter schemes (e.g. Safaricom PLC, Equity Bank) with monthly allowances and postpaid invoicing.
* **Dynamic Time-of-Day Fare Pricing**: Peak surge rules (06:30-09:00, 16:30-19:30 +20%), off-peak midday savers (-15%), and weekend leisure discounts (-10%).
* **Vehicle Geofencing Proximity Alerts**: Automatic push/toast notification when bus is within 500 meters of the passenger boarding stage.
* **Matatu Lost & Found Registry**: Public reporting portal for items left on buses and recovery status tracking at SACCO depots.
* **Passenger Ratings & Reviews**: 5-star rating system with feedback for operators and conductors.
* **SMS Notifications**: Automated SMS dispatch for tickets, payments, and boarding clearance via Africa's Talking.
* **Progressive Web App (PWA)**: Mobile home screen installation on iOS and Android with offline caching.

---

## Technology Stack

* **Backend**: Node.js (ESM), Express, Socket.IO, UUID, bcryptjs, jsonwebtoken.
* **Database & Persistence**: In-memory database with automatic seat-lock expiration worker and JSON disk persistence (`data/database.json`).
* **Real-Time Layer**: WebSockets for vehicle GPS broadcasting, geofence alerts, seat status updates, and payment confirmations.
* **Frontend**: HTML5, Tailwind CSS, Leaflet.js (OpenStreetMap), QRCode.js, Socket.IO client, Service Worker (PWA).
* **Payment Gateway**: Safaricom Daraja M-Pesa STK Push client with server-side callback verification.
* **SMS Dispatch**: Automated SMS gateway service for passenger alerts.

---

## How to Run

1. **Install Dependencies**:
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
   * Use default login credentials:
     * Passenger: `0712345678` / `Pass1234!`
     * Conductor: `0722300400` / `Pass1234!`
     * Operator: `0733555777` / `Pass1234!`
     * Admin: `0700000000` / `Pass1234!`

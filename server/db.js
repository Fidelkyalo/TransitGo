// Database layer for Nairobi Local Bus & Matatu Platform
// Implements tables: users, operators, drivers, vehicles, vehicle_seats, routes, route_stops, 
// vehicle_routes, bookings, booking_seats, payments, vehicle_locations, tickets, notifications, 
// fares, reviews, wallets, commuter_passes, lost_found, promo_codes, audit_logs,
// trip_history, favorite_routes, support_tickets, revenue_shares, corporate_accounts, fare_rules, geofence_alerts

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const dbFilePath = path.join(dataDir, 'database.json');

class Database {
  constructor() {
    this.operators = [];
    this.users = [];
    this.drivers = [];
    this.vehicles = [];
    this.vehicle_seats = [];
    this.routes = [];
    this.route_stops = [];
    this.vehicle_routes = [];
    this.bookings = [];
    this.booking_seats = [];
    this.payments = [];
    this.vehicle_locations = [];
    this.tickets = [];
    this.notifications = [];
    this.fares = [];
    this.reviews = [];
    this.audit_logs = [];
    
    // Future Features (Section 23)
    this.wallets = [];
    this.commuter_passes = [];
    this.lost_found = [];
    this.promo_codes = [];
    this.traffic_conditions = {};

    // Security & Extended Platform Features
    this.trip_history = [];
    this.favorite_routes = [];
    this.support_tickets = [];
    this.revenue_shares = [];
    this.corporate_accounts = [];
    this.fare_rules = [];
    this.geofence_alerts = [];

    this.ensureDataDir();
    this.loadFromDisk();
    this.startSeatExpirationWorker();
    this.startPeriodicDiskSync();
  }

  ensureDataDir() {
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        console.error('Could not create data directory:', err);
      }
    }
  }

  loadFromDisk() {
    if (fs.existsSync(dbFilePath)) {
      try {
        const raw = fs.readFileSync(dbFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        Object.assign(this, parsed);
        return;
      } catch (err) {
        console.error('Error reading database file, re-initializing seeds:', err);
      }
    }
    this.initSeedData();
    this.saveToDisk();
  }

  saveToDisk() {
    try {
      this.ensureDataDir();
      const snapshot = {
        operators: this.operators,
        users: this.users,
        drivers: this.drivers,
        vehicles: this.vehicles,
        vehicle_seats: this.vehicle_seats,
        routes: this.routes,
        route_stops: this.route_stops,
        vehicle_routes: this.vehicle_routes,
        bookings: this.bookings,
        booking_seats: this.booking_seats,
        payments: this.payments,
        vehicle_locations: this.vehicle_locations,
        tickets: this.tickets,
        notifications: this.notifications,
        fares: this.fares,
        reviews: this.reviews,
        wallets: this.wallets,
        commuter_passes: this.commuter_passes,
        lost_found: this.lost_found,
        promo_codes: this.promo_codes,
        traffic_conditions: this.traffic_conditions,
        audit_logs: this.audit_logs,
        trip_history: this.trip_history,
        favorite_routes: this.favorite_routes,
        support_tickets: this.support_tickets,
        revenue_shares: this.revenue_shares,
        corporate_accounts: this.corporate_accounts,
        fare_rules: this.fare_rules,
        geofence_alerts: this.geofence_alerts
      };
      fs.writeFileSync(dbFilePath, JSON.stringify(snapshot, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing database snapshot to disk:', err);
    }
  }

  startPeriodicDiskSync() {
    setInterval(() => {
      this.saveToDisk();
    }, 15000);
  }

  hashPassword(password) {
    return bcrypt.hashSync(password, 10);
  }

  verifyPassword(password, hash) {
    if (!hash) return false;
    return bcrypt.compareSync(password, hash);
  }

  initSeedData() {
    const defaultHash = this.hashPassword('Pass1234!');

    // 1. Operators (SACCOs)
    this.operators = [
      {
        id: 'op-1',
        name: 'Super Metro Transport Ltd',
        code: 'SMT',
        contact_phone: '+254 712 345 678',
        email: 'info@supermetro.co.ke',
        office_location: 'Commercial Street, Nairobi CBD',
        status: 'approved',
        created_at: new Date('2025-01-10T08:00:00Z').toISOString()
      },
      {
        id: 'op-2',
        name: 'Ongata Line Rongai SACCO',
        code: 'OLR',
        contact_phone: '+254 722 987 654',
        email: 'service@rongailine.co.ke',
        office_location: 'Railways Bus Station, Nairobi',
        status: 'approved',
        created_at: new Date('2025-01-12T09:30:00Z').toISOString()
      },
      {
        id: 'op-3',
        name: 'Citi Hoppa Services',
        code: 'CHS',
        contact_phone: '+254 733 112 233',
        email: 'support@citihoppa.co.ke',
        office_location: 'Kencom Terminus, Nairobi',
        status: 'approved',
        created_at: new Date('2025-01-15T10:00:00Z').toISOString()
      },
      {
        id: 'op-4',
        name: 'Kikuyu Travellers Express',
        code: 'KTE',
        contact_phone: '+254 720 445 566',
        email: 'contact@kikuyutravellers.co.ke',
        office_location: 'Khoja Roundabout, Nairobi',
        status: 'approved',
        created_at: new Date('2025-02-01T11:00:00Z').toISOString()
      }
    ];

    // 2. Users (Passenger, Driver, Conductor, Operator, Platform Admin) with bcrypt password hashing
    this.users = [
      {
        id: 'user-p1',
        name: 'Brian Mwangi',
        phone: '0712345678',
        email: 'brian.mwangi@example.com',
        password_hash: defaultHash,
        role: 'passenger',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-p2',
        name: 'Faith Achieng',
        phone: '0798765432',
        email: 'faith.achieng@example.com',
        password_hash: defaultHash,
        role: 'passenger',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-d1',
        name: 'Kamau Njoroge',
        phone: '0722100200',
        email: 'kamau.driver@supermetro.co.ke',
        password_hash: defaultHash,
        role: 'driver',
        driver_auth_token: 'drv-token-kamau-2025',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-c1',
        name: 'Dennis Omondi',
        phone: '0722300400',
        email: 'dennis.conductor@supermetro.co.ke',
        password_hash: defaultHash,
        role: 'conductor',
        conductor_auth_token: 'cnd-token-dennis-2025',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-op1',
        name: 'Grace Wambui (Super Metro Ops)',
        phone: '0733555777',
        email: 'ops@supermetro.co.ke',
        password_hash: defaultHash,
        role: 'operator',
        operator_id: 'op-1',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-admin1',
        name: 'System Admin (NTSA/Admin)',
        phone: '0700000000',
        email: 'admin@nairobitransport.go.ke',
        password_hash: defaultHash,
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];

    // 3. Routes & Route Stops
    this.routes = [
      {
        id: 'route-125',
        route_number: '125',
        name: 'CBD to Rongai via Langata Road',
        origin: 'CBD Railways Station',
        destination: 'Ongata Rongai (Maasai Mall)',
        operator_id: 'op-2',
        base_fare: 100,
        estimated_duration_mins: 45,
        status: 'active',
        color: '#10b981'
      },
      {
        id: 'route-111',
        route_number: '111',
        name: 'CBD to Ngong via Karen',
        origin: 'CBD Railways Station',
        destination: 'Ngong Town Terminus',
        operator_id: 'op-3',
        base_fare: 120,
        estimated_duration_mins: 55,
        status: 'active',
        color: '#3b82f6'
      },
      {
        id: 'route-237',
        route_number: '237',
        name: 'CBD to Thika via Thika Superhighway',
        origin: 'CBD Commercial',
        destination: 'Thika Town Main Stage',
        operator_id: 'op-1',
        base_fare: 120,
        estimated_duration_mins: 50,
        status: 'active',
        color: '#f59e0b'
      },
      {
        id: 'route-106',
        route_number: '106',
        name: 'CBD to Kikuyu via Waiyaki Way',
        origin: 'CBD Khoja Roundabout',
        destination: 'Kikuyu Railway Stage',
        operator_id: 'op-4',
        base_fare: 90,
        estimated_duration_mins: 40,
        status: 'active',
        color: '#8b5cf6'
      },
      {
        id: 'route-119',
        route_number: '119',
        name: 'CBD to Ruaka via Limuru Road',
        origin: 'CBD Khoja Roundabout',
        destination: 'Ruaka Town Terminus',
        operator_id: 'op-1',
        base_fare: 80,
        estimated_duration_mins: 35,
        status: 'active',
        color: '#ec4899'
      },
      {
        id: 'route-100',
        route_number: '100',
        name: 'CBD to Kiambu via Pangani & Muthaiga',
        origin: 'CBD Odeon Terminus',
        destination: 'Kiambu Main Stage',
        operator_id: 'op-3',
        base_fare: 80,
        estimated_duration_mins: 35,
        status: 'active',
        color: '#14b8a6'
      }
    ];

    // Stops
    this.route_stops = [
      { id: 'stop-125-1', route_id: 'route-125', name: 'CBD Railways Bus Station', sequence: 1, lat: -1.2905, lng: 36.8252, fare_from_origin: 0, eta_mins_from_origin: 0 },
      { id: 'stop-125-2', route_id: 'route-125', name: 'Nyayo National Stadium', sequence: 2, lat: -1.3039, lng: 36.8243, fare_from_origin: 50, eta_mins_from_origin: 8 },
      { id: 'stop-125-3', route_id: 'route-125', name: 'Wilson Airport Stage', sequence: 3, lat: -1.3216, lng: 36.8148, fare_from_origin: 70, eta_mins_from_origin: 15 },
      { id: 'stop-125-4', route_id: 'route-125', name: 'Langata Army Barracks', sequence: 4, lat: -1.3412, lng: 36.7891, fare_from_origin: 80, eta_mins_from_origin: 24 },
      { id: 'stop-125-5', route_id: 'route-125', name: 'Galleria Mall Junction', sequence: 5, lat: -1.3496, lng: 36.7725, fare_from_origin: 90, eta_mins_from_origin: 32 },
      { id: 'stop-125-6', route_id: 'route-125', name: 'Bomas of Kenya / Karen Road', sequence: 6, lat: -1.3400, lng: 36.7640, fare_from_origin: 90, eta_mins_from_origin: 36 },
      { id: 'stop-125-7', route_id: 'route-125', name: 'Ongata Rongai Maasai Mall', sequence: 7, lat: -1.3965, lng: 36.7610, fare_from_origin: 100, eta_mins_from_origin: 45 },

      { id: 'stop-237-1', route_id: 'route-237', name: 'CBD Commercial / Koja', sequence: 1, lat: -1.2818, lng: 36.8223, fare_from_origin: 0, eta_mins_from_origin: 0 },
      { id: 'stop-237-2', route_id: 'route-237', name: 'Ngara Stage', sequence: 2, lat: -1.2740, lng: 36.8290, fare_from_origin: 40, eta_mins_from_origin: 6 },
      { id: 'stop-237-3', route_id: 'route-237', name: 'Muthaiga Footbridge', sequence: 3, lat: -1.2592, lng: 36.8375, fare_from_origin: 50, eta_mins_from_origin: 12 },
      { id: 'stop-237-4', route_id: 'route-237', name: 'Garden City Mall', sequence: 4, lat: -1.2325, lng: 36.8780, fare_from_origin: 70, eta_mins_from_origin: 20 },
      { id: 'stop-237-5', route_id: 'route-237', name: 'Roysambu (TRM Stage)', sequence: 5, lat: -1.2185, lng: 36.8885, fare_from_origin: 80, eta_mins_from_origin: 26 },
      { id: 'stop-237-6', route_id: 'route-237', name: 'Kasarani Sports Stadium', sequence: 6, lat: -1.2227, lng: 36.8970, fare_from_origin: 80, eta_mins_from_origin: 30 },
      { id: 'stop-237-7', route_id: 'route-237', name: 'Kenyatta University (KU)', sequence: 7, lat: -1.1810, lng: 36.9320, fare_from_origin: 90, eta_mins_from_origin: 36 },
      { id: 'stop-237-8', route_id: 'route-237', name: 'Juja Flyover (JKUAT)', sequence: 8, lat: -1.1018, lng: 37.0144, fare_from_origin: 100, eta_mins_from_origin: 44 },
      { id: 'stop-237-9', route_id: 'route-237', name: 'Thika Town Main Stage', sequence: 9, lat: -1.0396, lng: 37.0700, fare_from_origin: 120, eta_mins_from_origin: 52 }
    ];

    // Vehicles
    this.vehicles = [
      {
        id: 'veh-1',
        registration_number: 'KDA 123A',
        operator_id: 'op-2',
        operator_name: 'Ongata Line Rongai SACCO',
        model: 'Isuzu FRR 33-Seater',
        capacity: 33,
        vehicle_type: 'bus_33',
        supports_seat_reservation: true,
        route_id: 'route-125',
        status: 'on_trip',
        driver_secret: 'sec-kda123a',
        created_at: new Date().toISOString()
      },
      {
        id: 'veh-2',
        registration_number: 'KDC 456B',
        operator_id: 'op-1',
        operator_name: 'Super Metro Transport Ltd',
        model: 'Isuzu NQR 33-Seater',
        capacity: 33,
        vehicle_type: 'bus_33',
        supports_seat_reservation: true,
        route_id: 'route-237',
        status: 'on_trip',
        driver_secret: 'sec-kdc456b',
        created_at: new Date().toISOString()
      },
      {
        id: 'veh-3',
        registration_number: 'KCY 789C',
        operator_id: 'op-4',
        operator_name: 'Kikuyu Travellers Express',
        model: 'Toyota HiAce 14-Seater Matatu',
        capacity: 14,
        vehicle_type: 'matatu_14',
        supports_seat_reservation: false,
        route_id: 'route-106',
        status: 'on_trip',
        driver_secret: 'sec-kcy789c',
        created_at: new Date().toISOString()
      },
      {
        id: 'veh-4',
        registration_number: 'KDD 555D',
        operator_id: 'op-3',
        operator_name: 'Citi Hoppa Services',
        model: 'Scania 51-Seater City Coach',
        capacity: 51,
        vehicle_type: 'coach_51',
        supports_seat_reservation: true,
        route_id: 'route-111',
        status: 'idle',
        driver_secret: 'sec-kdd555d',
        created_at: new Date().toISOString()
      },
      {
        id: 'veh-5',
        registration_number: 'KDF 888E',
        operator_id: 'op-1',
        operator_name: 'Super Metro Transport Ltd',
        model: 'Isuzu NQR 33-Seater',
        capacity: 33,
        vehicle_type: 'bus_33',
        supports_seat_reservation: true,
        route_id: 'route-119',
        status: 'on_trip',
        driver_secret: 'sec-kdf888e',
        created_at: new Date().toISOString()
      }
    ];

    this.vehicles.forEach(vehicle => {
      this.generateSeatsForVehicle(vehicle);
    });

    // Drivers
    this.drivers = [
      {
        id: 'drv-1',
        user_id: 'user-d1',
        name: 'Kamau Njoroge',
        phone: '0722100200',
        license_number: 'DL-NAI-99214',
        operator_id: 'op-2',
        assigned_vehicle_id: 'veh-1',
        safety_score: 98,
        on_time_rate: 96,
        trips_completed: 1420,
        status: 'active'
      },
      {
        id: 'drv-2',
        user_id: 'user-d2',
        name: 'Peter Kariuki',
        phone: '0722444555',
        license_number: 'DL-NAI-77142',
        operator_id: 'op-1',
        assigned_vehicle_id: 'veh-2',
        safety_score: 95,
        on_time_rate: 93,
        trips_completed: 980,
        status: 'active'
      }
    ];

    // Live locations
    this.vehicle_locations = [
      { vehicle_id: 'veh-1', lat: -1.3039, lng: 36.8243, speed_kmh: 38, heading: 200, current_stop_id: 'stop-125-2', next_stop_id: 'stop-125-3', route_id: 'route-125', is_active: true, updated_at: new Date().toISOString() },
      { vehicle_id: 'veh-2', lat: -1.2592, lng: 36.8375, speed_kmh: 48, heading: 45, current_stop_id: 'stop-237-3', next_stop_id: 'stop-237-4', route_id: 'route-237', is_active: true, updated_at: new Date().toISOString() },
      { vehicle_id: 'veh-3', lat: -1.2654, lng: 36.8046, speed_kmh: 30, heading: 280, current_stop_id: 'stop-106-2', next_stop_id: 'stop-106-3', route_id: 'route-106', is_active: true, updated_at: new Date().toISOString() },
      { vehicle_id: 'veh-5', lat: -1.2610, lng: 36.8180, speed_kmh: 34, heading: 350, current_stop_id: 'stop-119-2', next_stop_id: 'stop-119-3', route_id: 'route-119', is_active: true, updated_at: new Date().toISOString() }
    ];

    // Pre-seeded Booking & Ticket
    const sampleBookingId = 'BK-100201';
    this.bookings.push({
      id: sampleBookingId,
      user_id: 'user-p1',
      passenger_name: 'Brian Mwangi',
      passenger_phone: '0712345678',
      vehicle_id: 'veh-1',
      route_id: 'route-125',
      boarding_stop_id: 'stop-125-2',
      boarding_stop_name: 'Nyayo National Stadium',
      destination_stop_id: 'stop-125-7',
      destination_stop_name: 'Ongata Rongai Maasai Mall',
      seat_numbers: ['3A'],
      fare_amount: 100,
      payment_method: 'M-Pesa STK Push',
      payment_status: 'paid',
      booking_status: 'confirmed',
      created_at: new Date().toISOString()
    });

    this.tickets.push({
      id: 'TCK-123456',
      booking_id: sampleBookingId,
      qr_payload: JSON.stringify({
        ticket_id: 'TCK-123456',
        booking_id: sampleBookingId,
        passenger_name: 'Brian Mwangi',
        route_name: 'Route 125: CBD to Rongai',
        boarding_point: 'Nyayo National Stadium',
        destination: 'Ongata Rongai Maasai Mall',
        vehicle_reg: 'KDA 123A',
        seat_numbers: '3A',
        fare: 100,
        receipt: 'QKJ8912741'
      }),
      status: 'valid',
      scanned_at: null,
      scanned_by: null,
      created_at: new Date().toISOString()
    });

    // 4. Passenger Wallets (Section 23 Future Features)
    this.wallets = [
      {
        id: 'wal-p1',
        user_id: 'user-p1',
        balance_kes: 1450,
        transactions: [
          { id: 'tx-1', type: 'topup', amount: 1500, method: 'M-Pesa', receipt: 'QHJ123984', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: 'tx-2', type: 'fare_deduction', amount: 100, route: 'Route 125', timestamp: new Date(Date.now() - 1800000).toISOString() }
        ],
        updated_at: new Date().toISOString()
      },
      {
        id: 'wal-p2',
        user_id: 'user-p2',
        balance_kes: 820,
        transactions: [
          { id: 'tx-3', type: 'topup', amount: 1000, method: 'M-Pesa', receipt: 'QHJ998811', timestamp: new Date(Date.now() - 7200000).toISOString() },
          { id: 'tx-4', type: 'fare_deduction', amount: 180, route: 'Route 237', timestamp: new Date(Date.now() - 3600000).toISOString() }
        ],
        updated_at: new Date().toISOString()
      }
    ];

    // 5. Commuter Passes (Section 23 Future Features)
    this.commuter_passes = [
      {
        id: 'pass-template-daily',
        name: 'Nairobi 24-Hour Day Pass',
        duration_days: 1,
        price_kes: 250,
        unlimited_trips: true,
        routes: 'all',
        description: 'Unlimited rides across all metropolitan routes for 24 hours'
      },
      {
        id: 'pass-template-weekly',
        name: '7-Day Metropolitan Commuter Pass',
        duration_days: 7,
        price_kes: 1200,
        unlimited_trips: true,
        routes: 'all',
        description: 'Ideal for daily office commuters traveling Monday to Sunday'
      },
      {
        id: 'pass-template-monthly',
        name: '30-Day Gold Commuter Pass',
        duration_days: 30,
        price_kes: 4200,
        unlimited_trips: true,
        routes: 'all',
        description: 'Maximum savings with dedicated priority boarding lane'
      }
    ];

    // 6. Passenger Reviews & Ratings (Section 23)
    this.reviews = [
      {
        id: 'rev-1',
        user_id: 'user-p1',
        passenger_name: 'Brian Mwangi',
        vehicle_id: 'veh-1',
        route_id: 'route-125',
        rating: 5,
        comment: 'Very clean bus, polite conductor Dennis, and reached Rongai right on schedule!',
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'rev-2',
        user_id: 'user-p2',
        passenger_name: 'Faith Achieng',
        vehicle_id: 'veh-2',
        route_id: 'route-237',
        rating: 5,
        comment: 'Super Metro never disappoints. Wi-Fi was fast and GPS tracking was accurate.',
        created_at: new Date(Date.now() - 14400000).toISOString()
      }
    ];

    // 7. Lost & Found Depot (Section 23)
    this.lost_found = [
      {
        id: 'lf-1',
        item_title: 'Black Lenovo ThinkPad Laptop Bag',
        category: 'Electronics',
        vehicle_reg: 'KDA 123A',
        route_number: '125',
        description: 'Left on seat 3A during morning CBD to Rongai trip. Contains company ID.',
        contact_phone: '0712345678',
        reported_by: 'Brian Mwangi',
        status: 'found_at_depot',
        depot_location: 'Super Metro Central Office, Commercial St',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'lf-2',
        item_title: 'Brown Leather Wallet & National ID',
        category: 'Documents',
        vehicle_reg: 'KDC 456B',
        route_number: '237',
        description: 'Dropped under row 4 seats near Roysambu.',
        contact_phone: '0798765432',
        reported_by: 'Faith Achieng',
        status: 'investigating',
        depot_location: 'Thika Town Stage Office',
        created_at: new Date(Date.now() - 43200000).toISOString()
      }
    ];

    // 8. Promo Codes (Section 23)
    this.promo_codes = [
      { code: 'NAIROBI20', discount_type: 'percent', value: 20, active: true, desc: '20% off all routes' },
      { code: 'TWENDE', discount_type: 'fixed', value: 30, active: true, desc: 'KSh 30 instant fare discount' },
      { code: 'MATATU50', discount_type: 'percent', value: 50, active: true, desc: '50% off first digital ride' }
    ];

    // 9. Traffic Congestion States (Section 23 - Traffic-based ETA)
    this.traffic_conditions = {
      'route-125': { condition: 'Moderate', delay_mins: 4, speed_multiplier: 0.85, alert: 'Langata Rd moving smoothly' },
      'route-237': { condition: 'Light', delay_mins: 0, speed_multiplier: 1.0, alert: 'Thika Superhighway clear' },
      'route-111': { condition: 'Heavy', delay_mins: 8, speed_multiplier: 0.65, alert: 'Jam near Junction Mall' },
      'route-106': { condition: 'Light', delay_mins: 0, speed_multiplier: 1.0, alert: 'Waiyaki Way express flowing' },
      'route-119': { condition: 'Moderate', delay_mins: 3, speed_multiplier: 0.9, alert: 'Two Rivers roundabout slow' },
      'route-100': { condition: 'Light', delay_mins: 0, speed_multiplier: 1.0, alert: 'Pangani flyover clear' }
    };

    // 10. Trip History (Section 23 Future Features)
    this.trip_history = [
      {
        id: 'trip-h1',
        user_id: 'user-p1',
        booking_id: sampleBookingId,
        ticket_id: 'TCK-123456',
        route_id: 'route-125',
        route_number: '125',
        route_name: 'CBD to Rongai via Langata Road',
        vehicle_reg: 'KDA 123A',
        boarding_stop: 'Nyayo National Stadium',
        destination_stop: 'Ongata Rongai Maasai Mall',
        seat_numbers: ['3A'],
        fare_kes: 100,
        payment_method: 'M-Pesa STK Push',
        mpesa_receipt: 'QKJ8912741',
        status: 'completed',
        completed_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'trip-h2',
        user_id: 'user-p1',
        booking_id: 'BK-098231',
        ticket_id: 'TCK-872611',
        route_id: 'route-237',
        route_number: '237',
        route_name: 'CBD to Thika via Thika Superhighway',
        vehicle_reg: 'KDC 456B',
        boarding_stop: 'CBD Commercial / Koja',
        destination_stop: 'Roysambu (TRM Stage)',
        seat_numbers: ['2B'],
        fare_kes: 80,
        payment_method: 'Wallet',
        mpesa_receipt: 'WAL-TX-8812',
        status: 'completed',
        completed_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    // 11. Favorite Routes (Section 23 Future Features)
    this.favorite_routes = [
      {
        id: 'fav-1',
        user_id: 'user-p1',
        route_id: 'route-125',
        route_number: '125',
        route_name: 'CBD to Rongai via Langata Road',
        preferred_boarding_stop_id: 'stop-125-2',
        preferred_boarding_stop_name: 'Nyayo National Stadium',
        nickname: 'Daily Office Commute',
        created_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 'fav-2',
        user_id: 'user-p1',
        route_id: 'route-237',
        route_number: '237',
        route_name: 'CBD to Thika via Thika Superhighway',
        preferred_boarding_stop_id: 'stop-237-1',
        preferred_boarding_stop_name: 'CBD Commercial / Koja',
        nickname: 'Weekend Trip',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    // 12. Customer Support Tickets (Section 23 Future Features)
    this.support_tickets = [
      {
        id: 'SUP-40101',
        user_id: 'user-p1',
        user_name: 'Brian Mwangi',
        user_phone: '0712345678',
        category: 'payment',
        subject: 'M-Pesa STK prompt delayed during peak hour',
        description: 'At Kencom stage, the STK prompt took about 45 seconds to display on my phone.',
        status: 'resolved',
        priority: 'medium',
        responses: [
          { sender: 'support', message: 'Hello Brian, Safaricom gateway had a brief queuing period which cleared automatically. Your ticket was issued successfully.', created_at: new Date(Date.now() - 3600000).toISOString() }
        ],
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'SUP-40102',
        user_id: 'user-p2',
        user_name: 'Faith Achieng',
        user_phone: '0798765432',
        category: 'lost_item',
        subject: 'Inquiry regarding brown leather wallet',
        description: 'Left on KDC 456B near Roysambu stage. Inquiring on depot status.',
        status: 'open',
        priority: 'high',
        responses: [
          { sender: 'support', message: 'Conductor Dennis has submitted the item to Thika Road depot. You may collect it with national ID.', created_at: new Date(Date.now() - 1800000).toISOString() }
        ],
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    // 13. Automated Revenue Sharing (Section 23 Future Features)
    // Formula: 85% SACCO/Operator, 10% Platform Commission, 5% Nairobi County Transport Fee
    this.revenue_shares = [
      {
        id: 'revshare-1',
        booking_id: sampleBookingId,
        gross_amount_kes: 100,
        operator_id: 'op-2',
        operator_amount_kes: 85,
        platform_fee_kes: 10,
        county_fee_kes: 5,
        status: 'settled',
        created_at: new Date().toISOString()
      }
    ];

    // 14. Corporate Accounts (Section 23 Future Features)
    this.corporate_accounts = [
      {
        id: 'corp-1',
        company_name: 'Safaricom PLC Commuter Scheme',
        registration_code: 'SAF-COMMUTE-2025',
        contact_person: 'Mercy Njeri (HR Operations)',
        contact_email: 'mercy.njeri@safaricom.co.ke',
        contact_phone: '+254 722 000 111',
        monthly_credit_limit_kes: 500000,
        current_spent_kes: 142000,
        billing_cycle: 'monthly_postpaid',
        approved_routes: ['all'],
        employees: [
          { employee_id: 'EMP-014', name: 'Brian Mwangi', email: 'brian.mwangi@example.com', monthly_allowance_kes: 12000, spent_kes: 3400 },
          { employee_id: 'EMP-088', name: 'Faith Achieng', email: 'faith.achieng@example.com', monthly_allowance_kes: 10000, spent_kes: 2800 }
        ],
        status: 'active',
        created_at: new Date('2025-01-01T00:00:00Z').toISOString()
      },
      {
        id: 'corp-2',
        company_name: 'Equity Bank HQ Staff Transport',
        registration_code: 'EQ-STAFF-2025',
        contact_person: 'David Maina (Fleet & Admin)',
        contact_email: 'd.maina@equitybank.co.ke',
        contact_phone: '+254 763 000 222',
        monthly_credit_limit_kes: 750000,
        current_spent_kes: 215000,
        billing_cycle: 'monthly_postpaid',
        approved_routes: ['route-125', 'route-237', 'route-111'],
        employees: [],
        status: 'active',
        created_at: new Date('2025-01-15T00:00:00Z').toISOString()
      }
    ];

    // 15. Time-of-Day / Day-of-Week Fare Rules (Section 9 & 23 Dynamic Pricing)
    this.fare_rules = [
      {
        id: 'rule-morning-peak',
        name: 'Morning Peak Surge (06:30 - 09:00)',
        applicable_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        start_time: '06:30',
        end_time: '09:00',
        surge_multiplier: 1.20,
        flat_surge_kes: 0,
        description: '20% surge during morning inbound city rush hour',
        is_active: true
      },
      {
        id: 'rule-evening-peak',
        name: 'Evening Peak Surge (16:30 - 19:30)',
        applicable_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        start_time: '16:30',
        end_time: '19:30',
        surge_multiplier: 1.20,
        flat_surge_kes: 0,
        description: '20% surge during evening outbound suburban rush hour',
        is_active: true
      },
      {
        id: 'rule-midday-discount',
        name: 'Off-Peak Midday Saver (11:00 - 15:00)',
        applicable_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        start_time: '11:00',
        end_time: '15:00',
        surge_multiplier: 0.85,
        flat_surge_kes: 0,
        description: '15% discount for midday leisure and errand travellers',
        is_active: true
      },
      {
        id: 'rule-weekend-flat',
        name: 'Weekend Leisure Fare',
        applicable_days: ['Saturday', 'Sunday'],
        start_time: '00:00',
        end_time: '23:59',
        surge_multiplier: 0.90,
        flat_surge_kes: 0,
        description: '10% discount across all metropolitan weekend trips',
        is_active: true
      }
    ];

    // 16. Vehicle Geofence Proximity Alerts (Section 14 & 23)
    this.geofence_alerts = [];
  }

  generateSeatsForVehicle(vehicle) {
    if (!vehicle.supports_seat_reservation) return;

    const seats = [];
    if (vehicle.vehicle_type === 'matatu_14') {
      const labels = ['1A (Front)', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C', '5A', '5B', '5C', '5D'];
      labels.forEach((label, idx) => {
        seats.push({
          id: `seat-${vehicle.id}-${idx + 1}`,
          vehicle_id: vehicle.id,
          seat_number: idx + 1,
          seat_label: label,
          row: Math.floor(idx / 3) + 1,
          status: 'available',
          locked_until: null,
          locked_by: null,
          booked_by: null
        });
      });
    } else if (vehicle.vehicle_type === 'bus_33') {
      const rows = ['1', '2', '3', '4', '5', '6', '7', '8'];
      let count = 0;
      rows.forEach(r => {
        ['A', 'B', 'C', 'D'].forEach(col => {
          count++;
          seats.push({
            id: `seat-${vehicle.id}-${count}`,
            vehicle_id: vehicle.id,
            seat_number: count,
            seat_label: `${r}${col}`,
            row: parseInt(r, 10),
            column: col,
            is_window: col === 'A' || col === 'D',
            is_aisle: col === 'B' || col === 'C',
            status: 'available',
            locked_until: null,
            locked_by: null,
            booked_by: null
          });
        });
      });
      ['A', 'B', 'C', 'D', 'E'].forEach(col => {
        count++;
        seats.push({
          id: `seat-${vehicle.id}-${count}`,
          vehicle_id: vehicle.id,
          seat_number: count,
          seat_label: `9${col}`,
          row: 9,
          column: col,
          is_window: col === 'A' || col === 'E',
          is_aisle: false,
          status: 'available',
          locked_until: null,
          locked_by: null,
          booked_by: null
        });
      });
    } else {
      for (let i = 1; i <= 51; i++) {
        const row = Math.ceil(i / 4);
        const colLetter = ['A', 'B', 'C', 'D'][(i - 1) % 4];
        seats.push({
          id: `seat-${vehicle.id}-${i}`,
          vehicle_id: vehicle.id,
          seat_number: i,
          seat_label: `${row}${colLetter}`,
          row: row,
          column: colLetter,
          is_window: colLetter === 'A' || colLetter === 'D',
          is_aisle: colLetter === 'B' || colLetter === 'C',
          status: 'available',
          locked_until: null,
          locked_by: null,
          booked_by: null
        });
      }
    }
    this.vehicle_seats.push(...seats);
  }

  lockSeats(vehicleId, seatLabels, userId) {
    const lockExpiryMs = 7 * 60 * 1000;
    const now = Date.now();
    const expiryTime = new Date(now + lockExpiryMs).toISOString();

    const affected = [];
    for (const label of seatLabels) {
      const seat = this.vehicle_seats.find(s => s.vehicle_id === vehicleId && s.seat_label === label);
      if (!seat) {
        throw new Error(`Seat ${label} does not exist on vehicle ${vehicleId}`);
      }
      if (seat.status === 'booked') {
        throw new Error(`Seat ${label} has already been booked`);
      }
      if (seat.status === 'locked' && seat.locked_by !== userId && new Date(seat.locked_until).getTime() > now) {
        throw new Error(`Seat ${label} is currently held by another passenger. Please select another seat.`);
      }
      seat.status = 'locked';
      seat.locked_by = userId;
      seat.locked_until = expiryTime;
      affected.push(seat);
    }
    this.saveToDisk();
    return { locked_seats: affected, expires_at: expiryTime };
  }

  releaseSeats(vehicleId, seatLabels, userId) {
    const released = [];
    for (const label of seatLabels) {
      const seat = this.vehicle_seats.find(s => s.vehicle_id === vehicleId && s.seat_label === label);
      if (seat && seat.status === 'locked' && (seat.locked_by === userId || !userId)) {
        seat.status = 'available';
        seat.locked_by = null;
        seat.locked_until = null;
        released.push(seat);
      }
    }
    this.saveToDisk();
    return released;
  }

  startSeatExpirationWorker() {
    setInterval(() => {
      const now = Date.now();
      let releasedCount = 0;
      for (const seat of this.vehicle_seats) {
        if (seat.status === 'locked' && seat.locked_until && new Date(seat.locked_until).getTime() <= now) {
          seat.status = 'available';
          seat.locked_by = null;
          seat.locked_until = null;
          releasedCount++;
        }
      }
      if (releasedCount > 0) {
        this.logAudit('SEAT_AUTO_RELEASE', `Released ${releasedCount} expired seat lock(s)`);
      }
    }, 5000);
  }

  // Calculate dynamic fare based on route, stops, time of day and day of week
  calculateDynamicFare(routeId, boardingStopId, destStopId, dateObj = new Date()) {
    const route = this.routes.find(r => r.id === routeId);
    if (!route) return 100;

    let baseFare = route.base_fare;

    // Check stop-level fares if both stops are provided
    if (boardingStopId && destStopId) {
      const bStop = this.route_stops.find(s => s.id === boardingStopId);
      const dStop = this.route_stops.find(s => s.id === destStopId);
      if (bStop && dStop) {
        const fareDiff = Math.abs((dStop.fare_from_origin || baseFare) - (bStop.fare_from_origin || 0));
        if (fareDiff > 0) {
          baseFare = Math.max(30, fareDiff);
        }
      }
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[dateObj.getDay()];
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    let appliedRule = null;
    let multiplier = 1.0;

    for (const rule of this.fare_rules) {
      if (!rule.is_active) continue;
      if (rule.applicable_days.includes(currentDay)) {
        if (currentTimeStr >= rule.start_time && currentTimeStr <= rule.end_time) {
          appliedRule = rule;
          multiplier = rule.surge_multiplier;
          break;
        }
      }
    }

    const calculatedFare = Math.round(baseFare * multiplier);
    return {
      base_fare: baseFare,
      final_fare: calculatedFare,
      multiplier,
      applied_rule: appliedRule ? appliedRule.name : 'Standard Fare',
      is_peak: multiplier > 1.0,
      is_discounted: multiplier < 1.0
    };
  }

  // Automated Revenue Split: 85% SACCO / Operator, 10% Platform, 5% County Transport Fee
  recordRevenueShare(bookingId, amount, operatorId) {
    const gross = Number(amount);
    const operatorAmount = Math.round(gross * 0.85);
    const platformFee = Math.round(gross * 0.10);
    const countyFee = gross - operatorAmount - platformFee;

    const share = {
      id: 'revshare-' + uuidv4().substring(0, 8),
      booking_id: bookingId,
      gross_amount_kes: gross,
      operator_id: operatorId,
      operator_amount_kes: operatorAmount,
      platform_fee_kes: platformFee,
      county_fee_kes: countyFee,
      status: 'settled',
      created_at: new Date().toISOString()
    };

    this.revenue_shares.push(share);
    this.logAudit('REVENUE_SPLIT_RECORDED', `Split for booking ${bookingId}: SACCO KSh ${operatorAmount}, Platform KSh ${platformFee}, County KSh ${countyFee}`);
    this.saveToDisk();
    return share;
  }

  // Geofence Proximity Check: Triggers alert when vehicle is within 500m of passenger boarding stop
  checkGeofenceAlerts(vehicleId, currentLat, currentLng, io) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    // Check active bookings on this vehicle
    const activeBookings = this.bookings.filter(b => b.vehicle_id === vehicleId && (b.booking_status === 'confirmed' || b.booking_status === 'pending_payment'));

    for (const booking of activeBookings) {
      const stop = this.route_stops.find(s => s.id === booking.boarding_stop_id);
      if (!stop) continue;

      // Distance calculation in meters
      const R = 6371e3;
      const phi1 = (currentLat * Math.PI) / 180;
      const phi2 = (stop.lat * Math.PI) / 180;
      const deltaPhi = ((stop.lat - currentLat) * Math.PI) / 180;
      const deltaLambda = ((stop.lng - currentLng) * Math.PI) / 180;
      const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distMeters = Math.round(R * c);

      if (distMeters <= 500) {
        const alertId = `alert-${vehicleId}-${booking.id}`;
        const alreadyAlerted = this.geofence_alerts.some(a => a.id === alertId);
        if (!alreadyAlerted) {
          const alert = {
            id: alertId,
            booking_id: booking.id,
            user_id: booking.user_id,
            passenger_name: booking.passenger_name,
            passenger_phone: booking.passenger_phone,
            vehicle_reg: vehicle.registration_number,
            stop_name: stop.name,
            distance_meters: distMeters,
            type: 'vehicle_approaching',
            message: `Bus ${vehicle.registration_number} is approaching ${stop.name} (${distMeters} m away). Please be at your boarding stage!`,
            created_at: new Date().toISOString()
          };
          this.geofence_alerts.unshift(alert);

          if (io) {
            io.emit('geofence:approaching', alert);
          }
        }
      }
    }
  }

  logAudit(action, details, actor = 'system') {
    this.audit_logs.unshift({
      id: 'log-' + uuidv4().substring(0, 8),
      action,
      details,
      actor,
      timestamp: new Date().toISOString()
    });
    if (this.audit_logs.length > 200) {
      this.audit_logs.pop();
    }
  }
}

export const db = new Database();

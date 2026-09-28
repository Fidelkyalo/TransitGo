// Database layer for Nairobi Local Bus & Matatu Platform
// Contains tables: users, operators, drivers, vehicles, vehicle_seats, routes, route_stops, 
// vehicle_routes, bookings, booking_seats, payments, vehicle_locations, tickets, notifications, fares, reviews

import { v4 as uuidv4 } from 'uuid';

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

    this.initSeedData();
    this.startSeatExpirationWorker();
  }

  initSeedData() {
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

    // 2. Users (Passengers, Drivers, Conductor, Operator Admins, Platform Admins)
    this.users = [
      {
        id: 'user-p1',
        name: 'Brian Mwangi',
        phone: '0712345678',
        email: 'brian.mwangi@example.com',
        role: 'passenger',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-p2',
        name: 'Faith Achieng',
        phone: '0798765432',
        email: 'faith.achieng@example.com',
        role: 'passenger',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-d1',
        name: 'Kamau Njoroge',
        phone: '0722100200',
        email: 'kamau.driver@supermetro.co.ke',
        role: 'driver',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-c1',
        name: 'Dennis Omondi',
        phone: '0722300400',
        email: 'dennis.conductor@supermetro.co.ke',
        role: 'conductor',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-op1',
        name: 'Grace Wambui (Super Metro Ops)',
        phone: '0733555777',
        email: 'ops@supermetro.co.ke',
        role: 'operator',
        operator_id: 'op-1',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-admin1',
        name: 'System Admin (NTSA/Admin)',
        phone: '0700000000',
        email: 'admin@nairobitransport.go.ke',
        role: 'admin',
        created_at: new Date().toISOString()
      }
    ];

    // 3. Routes & Route Stops
    // Route 125: CBD -> Rongai
    // Route 111: CBD -> Ngong
    // Route 237: CBD -> Thika
    // Route 106: CBD -> Kikuyu
    // Route 119: CBD -> Ruaka
    // Route 100: CBD -> Kiambu
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

    // Route Stops with precise Nairobi GPS coordinates
    this.route_stops = [
      // Route 125 Stops
      { id: 'stop-125-1', route_id: 'route-125', name: 'CBD Railways Bus Station', sequence: 1, lat: -1.2905, lng: 36.8252, fare_from_origin: 0, eta_mins_from_origin: 0 },
      { id: 'stop-125-2', route_id: 'route-125', name: 'Nyayo National Stadium', sequence: 2, lat: -1.3039, lng: 36.8243, fare_from_origin: 50, eta_mins_from_origin: 8 },
      { id: 'stop-125-3', route_id: 'route-125', name: 'Wilson Airport Stage', sequence: 3, lat: -1.3216, lng: 36.8148, fare_from_origin: 70, eta_mins_from_origin: 15 },
      { id: 'stop-125-4', route_id: 'route-125', name: 'Langata Army Barracks', sequence: 4, lat: -1.3412, lng: 36.7891, fare_from_origin: 80, eta_mins_from_origin: 24 },
      { id: 'stop-125-5', route_id: 'route-125', name: 'Galleria Mall Junction', sequence: 5, lat: -1.3496, lng: 36.7725, fare_from_origin: 90, eta_mins_from_origin: 32 },
      { id: 'stop-125-6', route_id: 'route-125', name: 'Bomas of Kenya / Karen Road', sequence: 6, lat: -1.3400, lng: 36.7640, fare_from_origin: 90, eta_mins_from_origin: 36 },
      { id: 'stop-125-7', route_id: 'route-125', name: 'Ongata Rongai Maasai Mall', sequence: 7, lat: -1.3965, lng: 36.7610, fare_from_origin: 100, eta_mins_from_origin: 45 },

      // Route 237 Stops (Thika Superhighway)
      { id: 'stop-237-1', route_id: 'route-237', name: 'CBD Commercial / Koja', sequence: 1, lat: -1.2818, lng: 36.8223, fare_from_origin: 0, eta_mins_from_origin: 0 },
      { id: 'stop-237-2', route_id: 'route-237', name: 'Ngara Stage', sequence: 2, lat: -1.2740, lng: 36.8290, fare_from_origin: 40, eta_mins_from_origin: 6 },
      { id: 'stop-237-3', route_id: 'route-237', name: 'Muthaiga Footbridge', sequence: 3, lat: -1.2592, lng: 36.8375, fare_from_origin: 50, eta_mins_from_origin: 12 },
      { id: 'stop-237-4', route_id: 'route-237', name: 'Garden City Mall', sequence: 4, lat: -1.2325, lng: 36.8780, fare_from_origin: 70, eta_mins_from_origin: 20 },
      { id: 'stop-237-5', route_id: 'route-237', name: 'Roysambu (TRM Stage)', sequence: 5, lat: -1.2185, lng: 36.8885, fare_from_origin: 80, eta_mins_from_origin: 26 },
      { id: 'stop-237-6', route_id: 'route-237', name: 'Kasarani Sports Stadium', sequence: 6, lat: -1.2227, lng: 36.8970, fare_from_origin: 80, eta_mins_from_origin: 30 },
      { id: 'stop-237-7', route_id: 'route-237', name: 'Kenyatta University (KU)', sequence: 7, lat: -1.1810, lng: 36.9320, fare_from_origin: 90, eta_mins_from_origin: 36 },
      { id: 'stop-237-8', route_id: 'route-237', name: 'Juja Flyover (JKUAT)', sequence: 8, lat: -1.1018, lng: 37.0144, fare_from_origin: 100, eta_mins_from_origin: 44 },
      { id: 'stop-237-9', route_id: 'route-237', name: 'Thika Town Main Stage', sequence: 9, lat: -1.0396, lng: 37.0700, fare_from_origin: 120, eta_mins_from_origin: 52 },

      // Route 106 Stops (Waiyaki Way -> Kikuyu)
      { id: 'stop-106-1', route_id: 'route-106', name: 'CBD Khoja Roundabout', sequence: 1, lat: -1.2818, lng: 36.8223, fare_from_origin: 0, eta_mins_from_origin: 0 },
      { id: 'stop-106-2', route_id: 'route-106', name: 'Westlands Bus Park', sequence: 2, lat: -1.2654, lng: 36.8046, fare_from_origin: 40, eta_mins_from_origin: 8 },
      { id: 'stop-106-3', route_id: 'route-106', name: 'Kangemi Stage', sequence: 3, lat: -1.2642, lng: 36.7483, fare_from_origin: 60, eta_mins_from_origin: 18 },
      { id: 'stop-106-4', route_id: 'route-106', name: 'Uthiru Shopping Centre', sequence: 4, lat: -1.2580, lng: 36.7190, fare_from_origin: 70, eta_mins_from_origin: 26 },
      { id: 'stop-106-5', route_id: 'route-106', name: 'Kikuyu Railway Stage', sequence: 5, lat: -1.2464, lng: 36.6631, fare_from_origin: 90, eta_mins_from_origin: 40 },

      // Route 111 Stops (Ngong Road)
      { id: 'stop-111-1', route_id: 'route-111', name: 'CBD Railways Station', sequence: 1, lat: -1.2905, lng: 36.8252, fare_from_origin: 0, eta_mins_from_origin: 0 },
      { id: 'stop-111-2', route_id: 'route-111', name: 'Prestige Plaza Stage', sequence: 2, lat: -1.3005, lng: 36.7865, fare_from_origin: 50, eta_mins_from_origin: 12 },
      { id: 'stop-111-3', route_id: 'route-111', name: 'Junction Mall Stage', sequence: 3, lat: -1.2985, lng: 36.7625, fare_from_origin: 70, eta_mins_from_origin: 22 },
      { id: 'stop-111-4', route_id: 'route-111', name: 'Karen Roundabout', sequence: 4, lat: -1.3204, lng: 36.7067, fare_from_origin: 90, eta_mins_from_origin: 36 },
      { id: 'stop-111-5', route_id: 'route-111', name: 'Ngong Town Terminus', sequence: 5, lat: -1.3615, lng: 36.6566, fare_from_origin: 120, eta_mins_from_origin: 50 },

      // Route 119 Stops (Ruaka)
      { id: 'stop-119-1', route_id: 'route-119', name: 'CBD Khoja Terminus', sequence: 1, lat: -1.2818, lng: 36.8223, fare_from_origin: 0, eta_mins_from_origin: 0 },
      { id: 'stop-119-2', route_id: 'route-119', name: 'Parklands Avenue 4', sequence: 2, lat: -1.2610, lng: 36.8180, fare_from_origin: 40, eta_mins_from_origin: 10 },
      { id: 'stop-119-3', route_id: 'route-119', name: 'Gigiri (UN Complex)', sequence: 3, lat: -1.2338, lng: 36.8042, fare_from_origin: 60, eta_mins_from_origin: 20 },
      { id: 'stop-119-4', route_id: 'route-119', name: 'Two Rivers Mall', sequence: 4, lat: -1.2150, lng: 36.7910, fare_from_origin: 70, eta_mins_from_origin: 28 },
      { id: 'stop-119-5', route_id: 'route-119', name: 'Ruaka Town Terminus', sequence: 5, lat: -1.2052, lng: 36.7788, fare_from_origin: 80, eta_mins_from_origin: 34 }
    ];

    // 4. Vehicles
    // Supports 14-seater matatu, 33-seater bus, and 51-seater bus
    // Features reserved seating flag, operator, capacity
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
        supports_seat_reservation: false, // pay & board mode demonstration
        route_id: 'route-106',
        status: 'on_trip',
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
        created_at: new Date().toISOString()
      }
    ];

    // 5. Generate vehicle seats
    this.vehicles.forEach(vehicle => {
      this.generateSeatsForVehicle(vehicle);
    });

    // 6. Drivers & Conductors
    this.drivers = [
      {
        id: 'drv-1',
        user_id: 'user-d1',
        name: 'Kamau Njoroge',
        phone: '0722100200',
        license_number: 'DL-NAI-99214',
        operator_id: 'op-2',
        assigned_vehicle_id: 'veh-1',
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
        status: 'active'
      },
      {
        id: 'drv-3',
        user_id: 'user-d3',
        name: 'Hassan Otieno',
        phone: '0723888999',
        license_number: 'DL-NAI-55112',
        operator_id: 'op-4',
        assigned_vehicle_id: 'veh-3',
        status: 'active'
      }
    ];

    // 7. Vehicle Live Locations (current coordinate, heading, speed, next stop)
    this.vehicle_locations = [
      {
        vehicle_id: 'veh-1',
        lat: -1.3039,
        lng: 36.8243,
        speed_kmh: 38,
        heading: 200,
        current_stop_id: 'stop-125-2',
        next_stop_id: 'stop-125-3',
        route_id: 'route-125',
        is_active: true,
        updated_at: new Date().toISOString()
      },
      {
        vehicle_id: 'veh-2',
        lat: -1.2592,
        lng: 36.8375,
        speed_kmh: 48,
        heading: 45,
        current_stop_id: 'stop-237-3',
        next_stop_id: 'stop-237-4',
        route_id: 'route-237',
        is_active: true,
        updated_at: new Date().toISOString()
      },
      {
        vehicle_id: 'veh-3',
        lat: -1.2654,
        lng: 36.8046,
        speed_kmh: 30,
        heading: 280,
        current_stop_id: 'stop-106-2',
        next_stop_id: 'stop-106-3',
        route_id: 'route-106',
        is_active: true,
        updated_at: new Date().toISOString()
      },
      {
        vehicle_id: 'veh-5',
        lat: -1.2610,
        lng: 36.8180,
        speed_kmh: 34,
        heading: 350,
        current_stop_id: 'stop-119-2',
        next_stop_id: 'stop-119-3',
        route_id: 'route-119',
        is_active: true,
        updated_at: new Date().toISOString()
      }
    ];

    // 8. Pre-seed some realistic bookings & tickets for demo
    const sampleBookingId = 'BK-' + Math.floor(100000 + Math.random() * 900000);
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
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    });

    // Mark seat 3A on veh-1 as booked
    const seat3A = this.vehicle_seats.find(s => s.vehicle_id === 'veh-1' && s.seat_label === '3A');
    if (seat3A) {
      seat3A.status = 'booked';
      seat3A.booked_by = 'user-p1';
    }

    this.tickets.push({
      id: 'TCK-' + Math.floor(100000 + Math.random() * 900000),
      booking_id: sampleBookingId,
      qr_payload: JSON.stringify({
        booking_id: sampleBookingId,
        passenger: 'Brian Mwangi',
        route: 'Route 125 (CBD -> Rongai)',
        seat: '3A',
        vehicle: 'KDA 123A',
        operator: 'Ongata Line Rongai SACCO',
        valid_until: new Date(Date.now() + 4 * 3600 * 1000).toISOString()
      }),
      status: 'valid',
      scanned_at: null,
      scanned_by: null,
      created_at: new Date().toISOString()
    });

    this.payments.push({
      id: 'PAY-' + Math.floor(100000 + Math.random() * 900000),
      booking_id: sampleBookingId,
      amount: 100,
      phone: '0712345678',
      provider: 'M-Pesa',
      checkout_request_id: 'ws_CO_' + Date.now(),
      mpesa_receipt_number: 'QEH' + Math.floor(10000000 + Math.random() * 90000000),
      status: 'completed',
      created_at: new Date(Date.now() - 24 * 60 * 1000).toISOString()
    });

    this.notifications.push({
      id: 'notif-1',
      user_id: 'user-p1',
      title: 'Booking Confirmed',
      message: 'Your seat 3A on KDA 123A (Route 125) is reserved. Show your QR ticket when boarding.',
      read: false,
      created_at: new Date(Date.now() - 24 * 60 * 1000).toISOString()
    });
  }

  generateSeatsForVehicle(vehicle) {
    if (!vehicle.supports_seat_reservation) {
      return;
    }

    const seats = [];
    if (vehicle.vehicle_type === 'matatu_14') {
      // 14-seater Nissan layout: 1 front, 3 rows of 3, 1 back row of 4
      const labels = ['1A (Front)', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C', '5A', '5B', '5C', '5D'];
      labels.forEach((label, idx) => {
        seats.push({
          id: `seat-${vehicle.id}-${idx + 1}`,
          vehicle_id: vehicle.id,
          seat_number: idx + 1,
          seat_label: label,
          row: Math.floor(idx / 3) + 1,
          status: 'available', // available, locked, booked
          locked_until: null,
          locked_by: null,
          booked_by: null
        });
      });
    } else if (vehicle.vehicle_type === 'bus_33') {
      // 33-seater: 2 x 2 configuration, 8 rows of 4 + 1 back row of 5
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
      // Back row
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
      // 51-seater Coach layout
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

  // Seat locking mechanism: lock seats for 7 minutes during payment
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
      // Check if already booked or currently locked by someone else
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
    return released;
  }

  // Expiration background worker
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
        this.logAudit('SEAT_AUTO_RELEASE', `Automatically released ${releasedCount} expired seat lock(s)`);
      }
    }, 5000);
  }

  // Logging and Audits
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

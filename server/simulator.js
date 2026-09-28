// Live GPS vehicle movement simulator along Nairobi route waypoints

import { db } from './db.js';

export class VehicleSimulator {
  constructor(io) {
    this.io = io;
    this.runningIntervals = new Map(); // vehicleId -> intervalId
    this.routeWaypoints = new Map();
    this.initWaypoints();
  }

  initWaypoints() {
    // Generate fine-grained GPS waypoints for routes to produce smooth, realistic bus animation
    db.routes.forEach(route => {
      const stops = db.route_stops
        .filter(s => s.route_id === route.id)
        .sort((a, b) => a.sequence - b.sequence);

      const detailedPath = [];
      for (let i = 0; i < stops.length - 1; i++) {
        const curr = stops[i];
        const next = stops[i + 1];
        // Interpolate 10 micro-waypoints between each stop
        const steps = 12;
        for (let s = 0; s < steps; s++) {
          const ratio = s / steps;
          detailedPath.push({
            lat: curr.lat + (next.lat - curr.lat) * ratio,
            lng: curr.lng + (next.lng - curr.lng) * ratio,
            current_stop_id: curr.id,
            next_stop_id: next.id,
            current_stop_name: curr.name,
            next_stop_name: next.name
          });
        }
      }
      if (stops.length > 0) {
        const last = stops[stops.length - 1];
        detailedPath.push({
          lat: last.lat,
          lng: last.lng,
          current_stop_id: last.id,
          next_stop_id: null,
          current_stop_name: last.name,
          next_stop_name: 'Destination Reached'
        });
      }
      this.routeWaypoints.set(route.id, detailedPath);
    });
  }

  startVehicle(vehicleId) {
    if (this.runningIntervals.has(vehicleId)) {
      return;
    }

    const vehicle = db.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    vehicle.status = 'on_trip';
    const waypoints = this.routeWaypoints.get(vehicle.route_id) || [];
    if (waypoints.length === 0) return;

    let stepIndex = 0;
    // Find closest waypoint if vehicle location already exists
    let loc = db.vehicle_locations.find(l => l.vehicle_id === vehicleId);
    if (!loc) {
      loc = {
        vehicle_id: vehicleId,
        lat: waypoints[0].lat,
        lng: waypoints[0].lng,
        speed_kmh: 42,
        heading: 180,
        current_stop_id: waypoints[0].current_stop_id,
        next_stop_id: waypoints[0].next_stop_id,
        route_id: vehicle.route_id,
        is_active: true,
        updated_at: new Date().toISOString()
      };
      db.vehicle_locations.push(loc);
    } else {
      loc.is_active = true;
    }

    let direction = 1; // 1 = forward, -1 = return trip

    const intervalId = setInterval(() => {
      stepIndex += direction;
      if (stepIndex >= waypoints.length) {
        // Reverse direction for return loop
        direction = -1;
        stepIndex = waypoints.length - 2;
      } else if (stepIndex < 0) {
        direction = 1;
        stepIndex = 1;
      }

      const wp = waypoints[stepIndex];
      const prevWp = waypoints[stepIndex - direction] || wp;

      // Calculate heading angle
      const dLat = wp.lat - prevWp.lat;
      const dLng = wp.lng - prevWp.lng;
      const heading = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;

      // Fluctuate speed realistically (traffic vs clear road)
      const speed = Math.floor(30 + Math.random() * 25);

      loc.lat = Number(wp.lat.toFixed(6));
      loc.lng = Number(wp.lng.toFixed(6));
      loc.speed_kmh = speed;
      loc.heading = Math.round(heading);
      loc.current_stop_id = wp.current_stop_id;
      loc.next_stop_id = wp.next_stop_id;
      loc.current_stop_name = wp.current_stop_name;
      loc.next_stop_name = wp.next_stop_name;
      loc.updated_at = new Date().toISOString();

      // Emit live vehicle location to all connected passengers and admins
      const payload = {
        vehicle_id: vehicleId,
        registration_number: vehicle.registration_number,
        operator_name: vehicle.operator_name,
        route_id: vehicle.route_id,
        lat: loc.lat,
        lng: loc.lng,
        speed_kmh: loc.speed_kmh,
        heading: loc.heading,
        current_stop_name: wp.current_stop_name,
        next_stop_name: wp.next_stop_name,
        updated_at: loc.updated_at
      };

      this.io.emit('vehicle:location_update', payload);
      this.io.to(`vehicle:${vehicleId}`).emit('vehicle:location_update', payload);
      this.io.to(`route:${vehicle.route_id}`).emit('vehicle:location_update', payload);

      // Check geofence proximity alerts for approaching passengers
      db.checkGeofenceAlerts(vehicleId, loc.lat, loc.lng, this.io);

    }, 3000); // Send updates every 3 seconds

    this.runningIntervals.set(vehicleId, intervalId);
  }

  stopVehicle(vehicleId) {
    if (this.runningIntervals.has(vehicleId)) {
      clearInterval(this.runningIntervals.get(vehicleId));
      this.runningIntervals.delete(vehicleId);
    }
    const vehicle = db.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.status = 'idle';
    }
    const loc = db.vehicle_locations.find(l => l.vehicle_id === vehicleId);
    if (loc) {
      loc.is_active = false;
      loc.speed_kmh = 0;
      loc.updated_at = new Date().toISOString();
      this.io.emit('vehicle:stopped', { vehicle_id: vehicleId });
    }
  }

  startAllActiveVehicles() {
    db.vehicles.filter(v => v.status === 'on_trip').forEach(v => {
      this.startVehicle(v.id);
    });
  }
}

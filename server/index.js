// Server entry point for Nairobi Local Bus & Matatu Platform

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { Server } from 'socket.io';
import { db } from './db.js';
import { VehicleSimulator } from './simulator.js';
import { createRouter } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(rootDir, 'public')));

// Initialize vehicle simulator
const simulator = new VehicleSimulator(io);

// Mount REST API
app.use('/api', createRouter(io, simulator));

// Socket.io real-time events
io.on('connection', (socket) => {
  // Join vehicle or route tracking rooms
  socket.on('subscribe:vehicle', (vehicleId) => {
    socket.join(`vehicle:${vehicleId}`);
  });

  socket.on('unsubscribe:vehicle', (vehicleId) => {
    socket.leave(`vehicle:${vehicleId}`);
  });

  socket.on('subscribe:route', (routeId) => {
    socket.join(`route:${routeId}`);
  });

  socket.on('unsubscribe:route', (routeId) => {
    socket.leave(`route:${routeId}`);
  });

  // Conductor mobile GPS beacon stream
  socket.on('conductor:gps', (data) => {
    if (!data.vehicle_id) return;
    const loc = db.vehicle_locations.find(l => l.vehicle_id === data.vehicle_id);
    if (loc) {
      loc.lat = data.lat;
      loc.lng = data.lng;
      loc.speed_kmh = data.speed_kmh || loc.speed_kmh;
      loc.heading = data.heading || loc.heading;
      loc.updated_at = new Date().toISOString();
      io.emit('vehicle:location_update', loc);
    }
  });

  socket.on('disconnect', () => {
    // client disconnected
  });
});

// Start simulator for pre-seeded active vehicles
simulator.startAllActiveVehicles();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Nairobi Bus & Matatu Platform server running at http://localhost:${PORT}`);
  db.logAudit('SYSTEM_BOOT', `Server listening on port ${PORT}`);
});

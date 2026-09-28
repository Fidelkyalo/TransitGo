// Nairobi Local Bus & Matatu Transit Platform Frontend Logic
// Real-time WebSockets, Leaflet GPS Tracking, Seat Locking, M-Pesa STK Push, 
// QR Scanner, Wallets, Commuter Passes, Lost & Found, and Traffic-Based ETAs

const state = {
  currentRole: 'passenger',
  routes: [],
  selectedRouteId: '',
  selectedBoardingStopId: '',
  selectedDestinationStopId: '',
  passengerCoords: { lat: -1.2905, lng: 36.8252 },
  nearbyVehicles: [],
  selectedVehicle: null,
  selectedSeats: [],
  appliedPromoCode: null,
  appliedDiscount: 0,
  paymentMethod: 'mpesa', // 'mpesa' or 'wallet'
  currentBooking: null,
  currentTicket: null,
  userWallet: { balance_kes: 1450 },
  reviewRating: 5,
  socket: null,
  passengerMap: null,
  adminMap: null,
  vehicleMarkers: new Map(),
  adminVehicleMarkers: new Map(),
  passengerMarker: null,
  routePolyline: null,
  conductorVehicleId: 'veh-1',
  operatorId: 'op-1'
};

document.addEventListener('DOMContentLoaded', async () => {
  initSocket();
  initPassengerMap();
  await loadRoutes();
  await refreshNearbyVehicles();
  await loadWalletData();
  loadConductorManifest();
  loadOperatorData();
  loadAdminData();
  loadLostFoundItems();
  checkExistingTicket();

  // Register service worker if supported
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }
});

function initSocket() {
  if (typeof io !== 'undefined') {
    state.socket = io();

    state.socket.on('vehicle:location_update', (data) => {
      onVehicleLocationReceived(data);
    });

    state.socket.on('seats:status_changed', (data) => {
      if (state.selectedVehicle && state.selectedVehicle.id === data.vehicle_id) {
        selectVehicleForBooking(data.vehicle_id, true);
      }
    });

    state.socket.on('payment:confirmed', (data) => {
      onPaymentConfirmed(data);
    });

    state.socket.on('ticket:verified', (data) => {
      onTicketVerifiedEvent(data);
    });

    state.socket.on('traffic:updated', (data) => {
      refreshNearbyVehicles();
    });
  }
}

function switchView(viewName) {
  state.currentRole = viewName;

  const views = ['passenger', 'conductor', 'operator', 'admin', 'split'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) {
      if (v === viewName) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }

    const btn = document.getElementById(`nav-${v}`);
    if (btn) {
      if (v === viewName) {
        btn.classList.add('bg-brand-green', 'text-white');
        btn.classList.remove('text-slate-300');
      } else {
        btn.classList.remove('bg-brand-green', 'text-white');
        btn.classList.add('text-slate-300');
      }
    }
  });

  setTimeout(() => {
    if (viewName === 'passenger' && state.passengerMap) {
      state.passengerMap.invalidateSize();
    }
    if (viewName === 'admin') {
      if (!state.adminMap) {
        initAdminMap();
      } else {
        state.adminMap.invalidateSize();
      }
      loadAdminData();
    }
  }, 150);
}

function initPassengerMap() {
  const mapElement = document.getElementById('passenger-map');
  if (!mapElement) return;

  state.passengerMap = L.map('passenger-map').setView([state.passengerCoords.lat, state.passengerCoords.lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.passengerMap);

  const passengerIcon = L.divIcon({
    className: 'custom-passenger-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  state.passengerMarker = L.marker([state.passengerCoords.lat, state.passengerCoords.lng], { icon: passengerIcon })
    .addTo(state.passengerMap)
    .bindPopup('<strong>Your Location</strong><br>Nairobi CBD (Railways Bus Terminus)');
}

function initAdminMap() {
  const mapElement = document.getElementById('admin-map');
  if (!mapElement) return;

  state.adminMap = L.map('admin-map').setView([-1.286389, 36.817223], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.adminMap);
}

async function loadRoutes() {
  try {
    const res = await fetch('/api/routes');
    const data = await res.json();
    if (data.success) {
      state.routes = data.routes;
      populateRouteSelectors();
    }
  } catch (err) {
    console.error('Error fetching routes:', err);
  }
}

function populateRouteSelectors() {
  const routeSelect = document.getElementById('route-filter-select');
  const addVehRouteSelect = document.getElementById('add-veh-route');
  if (!routeSelect) return;

  routeSelect.innerHTML = '<option value="">All Nairobi Metropolitan Routes</option>';
  if (addVehRouteSelect) addVehRouteSelect.innerHTML = '';

  state.routes.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `Route ${r.route_number}: ${r.origin} to ${r.destination} (${r.operator_name})`;
    routeSelect.appendChild(opt);

    if (addVehRouteSelect) {
      const addOpt = document.createElement('option');
      addOpt.value = r.id;
      addOpt.textContent = `Route ${r.route_number}: ${r.name}`;
      addVehRouteSelect.appendChild(addOpt);
    }
  });

  populateBoardingAndDestStops();
}

function populateBoardingAndDestStops() {
  const boardingSelect = document.getElementById('boarding-stage-select');
  const destSelect = document.getElementById('destination-stage-select');
  if (!boardingSelect || !destSelect) return;

  boardingSelect.innerHTML = '<option value="">Select Boarding Stage</option>';
  destSelect.innerHTML = '<option value="">Select Destination Stage</option>';

  let stopsToDisplay = [];
  if (state.selectedRouteId) {
    const targetRoute = state.routes.find(r => r.id === state.selectedRouteId);
    if (targetRoute && targetRoute.stops) {
      stopsToDisplay = targetRoute.stops;
    }
  } else {
    state.routes.forEach(r => {
      if (r.stops) stopsToDisplay.push(...r.stops);
    });
  }

  const seen = new Set();
  stopsToDisplay.forEach(s => {
    if (!seen.has(s.name)) {
      seen.add(s.name);
      const bOpt = document.createElement('option');
      bOpt.value = s.id;
      bOpt.textContent = s.name;
      boardingSelect.appendChild(bOpt);

      const dOpt = document.createElement('option');
      dOpt.value = s.id;
      dOpt.textContent = s.name;
      destSelect.appendChild(dOpt);
    }
  });
}

function onRouteFilterChanged() {
  const sel = document.getElementById('route-filter-select');
  state.selectedRouteId = sel.value;
  populateBoardingAndDestStops();
  refreshNearbyVehicles();
  drawRouteLineOnMap();
}

function onBoardingStageChanged() {
  const sel = document.getElementById('boarding-stage-select');
  state.selectedBoardingStopId = sel.value;
  refreshNearbyVehicles();
}

function onDestinationStageChanged() {
  const sel = document.getElementById('destination-stage-select');
  state.selectedDestinationStopId = sel.value;
}

async function refreshNearbyVehicles() {
  const container = document.getElementById('nearby-vehicles-container');
  if (!container) return;

  let url = `/api/vehicles/nearby?lat=${state.passengerCoords.lat}&lng=${state.passengerCoords.lng}`;
  if (state.selectedRouteId) {
    url += `&route_id=${state.selectedRouteId}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      state.nearbyVehicles = data.vehicles;
      renderNearbyVehicles(data.vehicles);
      updateMapVehicles(data.vehicles);

      const countBadge = document.getElementById('vehicle-count-badge');
      if (countBadge) countBadge.textContent = `${data.vehicles.length} Active`;

      const pill = document.getElementById('active-vehicles-pill');
      if (pill) pill.textContent = `${data.vehicles.length} active vehicles nearby`;
    }
  } catch (err) {
    console.error('Error refreshing vehicles:', err);
  }
}

function renderNearbyVehicles(vehicles) {
  const container = document.getElementById('nearby-vehicles-container');
  if (!container) return;

  if (vehicles.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
        <p class="font-bold text-slate-700">No active vehicles on this route right now</p>
        <p class="text-xs text-slate-400 mt-1">Conductors will broadcast their GPS as soon as they start trip.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  vehicles.forEach(veh => {
    const isReservedMode = veh.supports_seat_reservation;
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-slate-200 transition-all cursor-pointer hover:border-emerald-500 group';
    
    card.onclick = () => selectVehicleForBooking(veh.vehicle_id);

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shadow">
            <span class="text-xs font-bold text-emerald-400">Rt ${veh.route_number}</span>
            <span class="text-[10px] font-mono text-slate-300">${veh.vehicle_type === 'matatu_14' ? '14-Sit' : 'Bus'}</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                ${veh.registration_number}
              </h3>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${isReservedMode ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                ${isReservedMode ? 'Reserved Seating' : 'Pay & Board'}
              </span>
            </div>
            <p class="text-xs text-slate-500 font-medium">${veh.operator_name}</p>
          </div>
        </div>

        <div class="text-right">
          <div class="text-lg font-black text-emerald-700">KSh ${veh.fare}</div>
          <div class="text-[11px] text-slate-400">approved fare</div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
        <div class="bg-slate-50 p-2 rounded-lg">
          <span class="text-slate-400 text-[10px] block">Distance</span>
          <span class="font-bold text-slate-800">${veh.distance_text}</span>
        </div>
        <div class="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
          <span class="text-emerald-700 text-[10px] block">Traffic ETA</span>
          <span class="font-black text-emerald-800">${veh.eta_text}</span>
        </div>
        <div class="bg-slate-50 p-2 rounded-lg">
          <span class="text-slate-400 text-[10px] block">${isReservedMode ? 'Available Seats' : 'Capacity'}</span>
          <span class="font-bold text-slate-800">${isReservedMode ? `${veh.available_seats} / ${veh.capacity}` : `${veh.capacity} seats`}</span>
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between">
        <span class="text-xs text-slate-500 flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>${veh.current_stop_name || 'En route'}</span>
        </span>
        <button class="bg-slate-900 group-hover:bg-emerald-600 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow transition-colors">
          ${isReservedMode ? 'Select Seat' : 'Pay & Board'}
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function updateMapVehicles(vehicles) {
  if (!state.passengerMap) return;

  vehicles.forEach(veh => {
    const loc = veh.current_location;
    if (!loc || !loc.lat) return;

    if (state.vehicleMarkers.has(veh.vehicle_id)) {
      const marker = state.vehicleMarkers.get(veh.vehicle_id);
      marker.setLatLng([loc.lat, loc.lng]);
    } else {
      const busIcon = L.divIcon({
        className: 'custom-bus-marker',
        html: `<span>${veh.route_number}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: busIcon })
        .addTo(state.passengerMap)
        .bindPopup(`
          <strong>${veh.registration_number} (${veh.operator_name})</strong><br>
          Route: ${veh.route_number} | Speed: ${veh.speed_kmh} km/h<br>
          ETA: ${veh.eta_text} | Fare: KSh ${veh.fare}
        `);

      marker.on('click', () => {
        selectVehicleForBooking(veh.vehicle_id);
      });

      state.vehicleMarkers.set(veh.vehicle_id, marker);
    }
  });
}

function onVehicleLocationReceived(data) {
  if (state.passengerMap && state.vehicleMarkers.has(data.vehicle_id)) {
    const marker = state.vehicleMarkers.get(data.vehicle_id);
    marker.setLatLng([data.lat, data.lng]);
  }

  if (state.selectedVehicle && state.selectedVehicle.id === data.vehicle_id) {
    const speedEl = document.getElementById('telemetry-speed');
    if (speedEl) speedEl.textContent = `${data.speed_kmh} km/h`;

    const stopEl = document.getElementById('telemetry-vehicle-route');
    if (stopEl && data.current_stop_name) {
      stopEl.textContent = `At ${data.current_stop_name} (heading to ${data.next_stop_name || 'Terminal'})`;
    }
  }

  if (data.vehicle_id === state.conductorVehicleId) {
    const cSpeed = document.getElementById('conductor-speed-val');
    if (cSpeed) cSpeed.textContent = `${data.speed_kmh} km/h`;

    const cNext = document.getElementById('conductor-next-stop-val');
    if (cNext && data.next_stop_name) cNext.textContent = data.next_stop_name;
  }

  const splitPos = document.getElementById('split-pos-text');
  if (splitPos && data.vehicle_id === 'veh-1') {
    splitPos.textContent = `At ${data.current_stop_name || 'En route'} (${data.speed_kmh} km/h)`;
  }

  if (state.adminMap && state.adminVehicleMarkers.has(data.vehicle_id)) {
    state.adminVehicleMarkers.get(data.vehicle_id).setLatLng([data.lat, data.lng]);
  }
}

function drawRouteLineOnMap() {
  if (!state.passengerMap) return;

  if (state.routePolyline) {
    state.passengerMap.removeLayer(state.routePolyline);
    state.routePolyline = null;
  }

  if (!state.selectedRouteId) return;

  const route = state.routes.find(r => r.id === state.selectedRouteId);
  if (!route || !route.stops || route.stops.length < 2) return;

  const latLngs = route.stops.map(s => [s.lat, s.lng]);
  state.routePolyline = L.polyline(latLngs, { color: '#008751', weight: 4, opacity: 0.8 }).addTo(state.passengerMap);
  state.passengerMap.fitBounds(state.routePolyline.getBounds(), { padding: [40, 40] });
}

function resetMapView() {
  if (state.passengerMap) {
    state.passengerMap.setView([state.passengerCoords.lat, state.passengerCoords.lng], 13);
  }
}

// Seat Booking Flow
async function selectVehicleForBooking(vehicleId, keepModalOpen = false) {
  try {
    const res = await fetch(`/api/vehicles/${vehicleId}`);
    const data = await res.json();
    if (!data.success) return;

    state.selectedVehicle = data.vehicle;
    if (!keepModalOpen) {
      state.selectedSeats = [];
      state.appliedPromoCode = null;
      state.appliedDiscount = 0;
    }

    const regEl = document.getElementById('telemetry-vehicle-reg');
    const routeEl = document.getElementById('telemetry-vehicle-route');
    const distEl = document.getElementById('telemetry-distance');
    const etaEl = document.getElementById('telemetry-eta');
    const speedEl = document.getElementById('telemetry-speed');

    if (regEl) regEl.textContent = `${data.vehicle.registration_number} (${data.vehicle.operator_name})`;
    if (routeEl && data.vehicle.route) routeEl.textContent = `Route ${data.vehicle.route.route_number}: ${data.vehicle.route.name}`;
    if (distEl) distEl.textContent = '650 m';
    if (etaEl) etaEl.textContent = '4 min';
    if (speedEl && data.vehicle.location) speedEl.textContent = `${data.vehicle.location.speed_kmh} km/h`;

    if (!keepModalOpen) {
      openSeatPickerModal(data.vehicle);
    } else {
      renderSeatGrid(data.vehicle);
    }

  } catch (err) {
    console.error('Error selecting vehicle:', err);
  }
}

function openSeatPickerModal(vehicle) {
  const modal = document.getElementById('modal-seat-picker');
  const title = document.getElementById('seat-modal-vehicle-title');
  const sub = document.getElementById('seat-modal-route-sub');
  const notice = document.getElementById('seat-mode-notice');
  const proceedBtn = document.getElementById('btn-proceed-to-pay');

  if (title) title.textContent = `Select Seat: ${vehicle.registration_number}`;
  if (sub && vehicle.route) sub.textContent = `Route ${vehicle.route.route_number}: ${vehicle.route.name}`;

  const isReservedMode = vehicle.supports_seat_reservation;
  if (isReservedMode) {
    notice.innerHTML = `<span>Visual seat selection active. Selected seats are temporarily held for 7 minutes during checkout.</span>`;
    proceedBtn.disabled = true;
  } else {
    notice.innerHTML = `<span><strong>Pay & Board Mode:</strong> Advance seat selection is not required for this vehicle. Proceed directly to payment to generate your boarding pass.</span>`;
    proceedBtn.disabled = false;
  }

  renderSeatGrid(vehicle);
  updateModalSummary();
  modal.classList.remove('hidden');
}

function closeSeatModal() {
  document.getElementById('modal-seat-picker').classList.add('hidden');
}

function renderSeatGrid(vehicle) {
  const container = document.getElementById('seat-grid-container');
  if (!container) return;

  container.innerHTML = '';

  if (!vehicle.supports_seat_reservation) {
    container.innerHTML = `
      <div class="p-6 text-center bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
        <div class="text-3xl">🚐</div>
        <div class="font-bold text-slate-800 text-sm">Open Boarding (First-Come, First-Served)</div>
        <p class="text-xs text-slate-600">This vehicle operates on rapid turnaround. Your seat will be confirmed as Pay & Board upon payment verification.</p>
      </div>
    `;
    return;
  }

  const seats = vehicle.seats || [];
  const rowsMap = new Map();
  seats.forEach(s => {
    const r = s.row || 1;
    if (!rowsMap.has(r)) rowsMap.set(r, []);
    rowsMap.get(r).push(s);
  });

  const sortedRows = Array.from(rowsMap.keys()).sort((a, b) => a - b);

  sortedRows.forEach(rowNum => {
    const rowSeats = rowsMap.get(rowNum);
    const rowDiv = document.createElement('div');
    rowDiv.className = 'flex items-center justify-between gap-2';

    const leftCol = document.createElement('div');
    leftCol.className = 'flex gap-2';

    const aisleSpacer = document.createElement('div');
    aisleSpacer.className = 'w-6 text-center text-[10px] text-slate-300 font-mono flex items-center justify-center';
    aisleSpacer.textContent = rowNum;

    const rightCol = document.createElement('div');
    rightCol.className = 'flex gap-2';

    rowSeats.forEach(seat => {
      const btn = createSeatButton(seat);
      if (seat.column === 'A' || seat.column === 'B' || seat.seat_label.includes('A') || seat.seat_label.includes('B')) {
        leftCol.appendChild(btn);
      } else {
        rightCol.appendChild(btn);
      }
    });

    rowDiv.appendChild(leftCol);
    rowDiv.appendChild(aisleSpacer);
    rowDiv.appendChild(rightCol);
    container.appendChild(rowDiv);
  });
}

function createSeatButton(seat) {
  const btn = document.createElement('button');
  btn.className = `seat-btn w-9 h-9 rounded-lg text-xs font-bold border flex items-center justify-center ${seat.status}`;
  btn.textContent = seat.seat_label;
  btn.dataset.seatLabel = seat.seat_label;

  if (seat.status === 'booked') {
    btn.disabled = true;
  } else if (seat.status === 'locked') {
    btn.disabled = true;
  } else {
    if (state.selectedSeats.includes(seat.seat_label)) {
      btn.classList.add('selected');
    }
    btn.onclick = () => toggleSeatSelection(seat.seat_label, btn);
  }

  return btn;
}

function toggleSeatSelection(seatLabel, buttonEl) {
  const idx = state.selectedSeats.indexOf(seatLabel);
  if (idx > -1) {
    state.selectedSeats.splice(idx, 1);
    buttonEl.classList.remove('selected');
  } else {
    state.selectedSeats.push(seatLabel);
    buttonEl.classList.add('selected');
  }

  const proceedBtn = document.getElementById('btn-proceed-to-pay');
  if (proceedBtn) {
    proceedBtn.disabled = state.selectedSeats.length === 0;
  }

  updateModalSummary();
}

function updateModalSummary() {
  const selectedText = document.getElementById('modal-selected-seats-text');
  const fareText = document.getElementById('modal-total-fare-text');
  if (!state.selectedVehicle) return;

  const baseFare = state.selectedVehicle.route ? state.selectedVehicle.route.base_fare : 100;
  const count = state.selectedVehicle.supports_seat_reservation ? state.selectedSeats.length : 1;
  const total = count * baseFare;

  if (selectedText) {
    selectedText.textContent = state.selectedSeats.length > 0 ? state.selectedSeats.join(', ') : (state.selectedVehicle.supports_seat_reservation ? 'None selected' : 'Pay & Board');
  }
  if (fareText) {
    fareText.textContent = `KSh ${total}`;
  }
}

async function proceedToPayment() {
  if (!state.selectedVehicle) return;

  const isReservedMode = state.selectedVehicle.supports_seat_reservation;

  if (isReservedMode && state.selectedSeats.length > 0) {
    try {
      const lockRes = await fetch('/api/seats/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: state.selectedVehicle.id,
          seat_labels: state.selectedSeats,
          user_id: 'user-p1'
        })
      });
      const lockData = await lockRes.json();
      if (!lockData.success) {
        alert(lockData.message);
        return;
      }
      showToast('🔒 Seat temporarily held for 7 minutes');
    } catch (err) {
      console.error('Error locking seats:', err);
      alert('Could not lock seat. Please try again.');
      return;
    }
  }

  closeSeatModal();
  openMpesaModal();
}

function openMpesaModal() {
  const modal = document.getElementById('modal-mpesa-checkout');
  const opEl = document.getElementById('mpesa-summary-operator');
  const vehEl = document.getElementById('mpesa-summary-vehicle');
  const seatsEl = document.getElementById('mpesa-summary-seats');
  const amountEl = document.getElementById('mpesa-summary-amount');
  const promptAmount = document.getElementById('stk-prompt-amount');
  const promptOp = document.getElementById('stk-prompt-operator');

  const baseFare = state.selectedVehicle.route ? state.selectedVehicle.route.base_fare : 100;
  const count = state.selectedSeats.length > 0 ? state.selectedSeats.length : 1;
  const gross = count * baseFare;
  const net = Math.max(10, gross - state.appliedDiscount);

  if (opEl) opEl.textContent = state.selectedVehicle.operator_name;
  if (vehEl) vehEl.textContent = `${state.selectedVehicle.registration_number} (${state.selectedVehicle.route ? state.selectedVehicle.route.name : 'Nairobi Transit'})`;
  if (seatsEl) seatsEl.textContent = state.selectedSeats.length > 0 ? state.selectedSeats.join(', ') : 'Pay & Board Mode';
  if (amountEl) amountEl.textContent = `KSh ${net}`;
  if (promptAmount) promptAmount.textContent = net;
  if (promptOp) promptOp.textContent = state.selectedVehicle.operator_name;

  document.getElementById('simulated-stk-phone').classList.add('hidden');
  document.getElementById('mpesa-status-spinner').classList.add('hidden');
  document.getElementById('stk-init-container').classList.remove('hidden');

  selectPayMethod('mpesa');
  modal.classList.remove('hidden');
}

function closeMpesaModal() {
  document.getElementById('modal-mpesa-checkout').classList.add('hidden');
}

// Payment Methods: M-Pesa vs Wallet
function selectPayMethod(method) {
  state.paymentMethod = method;
  const mpesaBtn = document.getElementById('pay-method-mpesa');
  const walletBtn = document.getElementById('pay-method-wallet');
  const phoneSec = document.getElementById('mpesa-phone-section');
  const actionBtn = document.getElementById('btn-trigger-stk');

  if (method === 'mpesa') {
    mpesaBtn.className = 'p-2.5 rounded-xl border-2 border-brand-mpesa bg-emerald-50 text-emerald-900 text-xs font-bold text-center';
    walletBtn.className = 'p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold text-center hover:border-slate-400';
    phoneSec.classList.remove('hidden');
    actionBtn.innerHTML = '<span>📲</span> Send M-Pesa STK Push';
  } else {
    walletBtn.className = 'p-2.5 rounded-xl border-2 border-emerald-600 bg-emerald-50 text-emerald-900 text-xs font-bold text-center';
    mpesaBtn.className = 'p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold text-center hover:border-slate-400';
    phoneSec.classList.add('hidden');
    actionBtn.innerHTML = '<span>👛</span> Pay with Wallet Balance';
  }
}

async function applyPromoCode() {
  const input = document.getElementById('checkout-promo-input');
  const msg = document.getElementById('promo-status-msg');
  const code = input ? input.value.trim() : '';

  if (!code) return;

  const baseFare = state.selectedVehicle.route ? state.selectedVehicle.route.base_fare : 100;
  const count = state.selectedSeats.length > 0 ? state.selectedSeats.length : 1;
  const gross = count * baseFare;

  try {
    const res = await fetch('/api/promo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, fare: gross })
    });
    const data = await res.json();
    msg.classList.remove('hidden');
    if (data.valid) {
      state.appliedPromoCode = data.promo_code;
      state.appliedDiscount = data.discount_amount;
      msg.textContent = `✅ ${data.message}`;
      msg.className = 'text-[11px] text-emerald-700 font-bold';
      document.getElementById('mpesa-summary-amount').textContent = `KSh ${data.discounted_fare}`;
      document.getElementById('stk-prompt-amount').textContent = data.discounted_fare;
      showToast(`Promo applied! Saved KSh ${data.discount_amount}`);
    } else {
      msg.textContent = `❌ ${data.message}`;
      msg.className = 'text-[11px] text-rose-700 font-bold';
    }
  } catch (err) {
    console.error(err);
  }
}

async function executeChosenPayment() {
  if (state.paymentMethod === 'wallet') {
    await payWithWallet();
  } else {
    await triggerMpesaStkPush();
  }
}

async function payWithWallet() {
  const baseFare = state.selectedVehicle.route ? state.selectedVehicle.route.base_fare : 100;
  const count = state.selectedSeats.length > 0 ? state.selectedSeats.length : 1;
  const gross = count * baseFare;
  const net = Math.max(10, gross - state.appliedDiscount);

  if (state.userWallet.balance_kes < net) {
    alert(`Insufficient wallet balance (Current: KSh ${state.userWallet.balance_kes}). Please top up or pay with M-Pesa.`);
    return;
  }

  // First initiate booking record
  try {
    const pushRes = await fetch('/api/payments/stk-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '0712345678',
        amount: net,
        vehicle_id: state.selectedVehicle.id,
        route_id: state.selectedVehicle.route_id,
        boarding_stop_id: state.selectedBoardingStopId || 'stop-125-1',
        destination_stop_id: state.selectedDestinationStopId || 'stop-125-7',
        seat_labels: state.selectedSeats,
        passenger_name: 'Brian Mwangi',
        promo_code: state.appliedPromoCode
      })
    });
    const pushData = await pushRes.json();

    // Deduct wallet
    await fetch('/api/wallet/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user-p1', booking_id: pushData.booking_id, amount: net })
    });

    // Confirm callback
    const cbRes = await fetch('/api/payments/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkout_request_id: pushData.checkout_request_id,
        result_code: 0,
        mpesa_receipt_number: 'QWL' + Math.floor(10000000 + Math.random() * 90000000)
      })
    });
    const cbData = await cbRes.json();

    closeMpesaModal();
    await loadWalletData();
    showToast('✅ Paid with TransitGo Wallet balance!');
    displayDigitalTicket(cbData.ticket, cbData.booking);

  } catch (err) {
    console.error('Wallet payment error:', err);
  }
}

async function triggerMpesaStkPush() {
  const phoneInput = document.getElementById('mpesa-phone-input');
  const phone = phoneInput ? phoneInput.value.trim() : '0712345678';

  const baseFare = state.selectedVehicle.route ? state.selectedVehicle.route.base_fare : 100;
  const count = state.selectedSeats.length > 0 ? state.selectedSeats.length : 1;
  const gross = count * baseFare;
  const amount = Math.max(10, gross - state.appliedDiscount);

  document.getElementById('stk-init-container').classList.add('hidden');
  const spinner = document.getElementById('mpesa-status-spinner');
  const statusText = document.getElementById('mpesa-status-text');
  spinner.classList.remove('hidden');
  statusText.textContent = `Connecting to Safaricom Daraja gateway for +254 ${phone}...`;

  try {
    const res = await fetch('/api/payments/stk-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '0' + phone.replace(/^0+/, ''),
        amount,
        vehicle_id: state.selectedVehicle.id,
        route_id: state.selectedVehicle.route_id,
        boarding_stop_id: state.selectedBoardingStopId || 'stop-125-1',
        destination_stop_id: state.selectedDestinationStopId || 'stop-125-7',
        seat_labels: state.selectedSeats,
        passenger_name: 'Brian Mwangi',
        promo_code: state.appliedPromoCode
      })
    });

    const data = await res.json();
    if (data.success) {
      state.currentBooking = data;
      spinner.classList.add('hidden');
      document.getElementById('simulated-stk-phone').classList.remove('hidden');
      showToast('📱 M-Pesa STK Push prompt sent to your phone');
    } else {
      alert(data.message || 'Payment initialization failed');
      document.getElementById('stk-init-container').classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  } catch (err) {
    console.error('Error initiating STK push:', err);
    alert('Payment gateway connection error');
    document.getElementById('stk-init-container').classList.remove('hidden');
    spinner.classList.add('hidden');
  }
}

async function submitStkCallbackSimulation(status) {
  if (!state.currentBooking) return;

  const spinner = document.getElementById('mpesa-status-spinner');
  const statusText = document.getElementById('mpesa-status-text');
  document.getElementById('simulated-stk-phone').classList.add('hidden');
  spinner.classList.remove('hidden');
  statusText.textContent = 'Verifying payment with Safaricom M-Pesa server...';

  try {
    const res = await fetch('/api/payments/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkout_request_id: state.currentBooking.checkout_request_id,
        result_code: status === 'success' ? 0 : 1,
        mpesa_receipt_number: 'QEH' + Math.floor(10000000 + Math.random() * 90000000)
      })
    });

    const data = await res.json();
    spinner.classList.add('hidden');

    if (data.success) {
      closeMpesaModal();
      showToast('✅ M-Pesa Payment Confirmed! Digital Ticket Generated');
      displayDigitalTicket(data.ticket, data.booking);
    } else {
      alert('Payment failed or cancelled.');
      closeMpesaModal();
    }
  } catch (err) {
    console.error('Error confirming payment:', err);
    spinner.classList.add('hidden');
  }
}

function cancelPaymentAndReleaseSeats() {
  if (state.selectedVehicle && state.selectedSeats.length > 0) {
    fetch('/api/seats/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_id: state.selectedVehicle.id,
        seat_labels: state.selectedSeats,
        user_id: 'user-p1'
      })
    });
  }
  closeMpesaModal();
  showToast('Seat released');
}

function displayDigitalTicket(ticket, booking) {
  state.currentTicket = ticket;
  const modal = document.getElementById('modal-digital-ticket');

  const titleEl = document.getElementById('ticket-route-name');
  const opEl = document.getElementById('ticket-operator-name');
  const idEl = document.getElementById('ticket-id-display');
  const passEl = document.getElementById('ticket-passenger-name');
  const regEl = document.getElementById('ticket-vehicle-reg');
  const boardEl = document.getElementById('ticket-boarding-stage');
  const destEl = document.getElementById('ticket-dest-stage');
  const seatEl = document.getElementById('ticket-seat-label');
  const receiptEl = document.getElementById('ticket-receipt-code');

  if (titleEl) titleEl.textContent = booking.destination_stop_name ? `To: ${booking.destination_stop_name}` : 'Nairobi Route';
  if (opEl && state.selectedVehicle) opEl.textContent = state.selectedVehicle.operator_name;
  if (idEl) idEl.textContent = ticket.id;
  if (passEl) passEl.textContent = booking.passenger_name;
  if (regEl && state.selectedVehicle) regEl.textContent = state.selectedVehicle.registration_number;
  if (boardEl) boardEl.textContent = booking.boarding_stop_name || 'Designated Stage';
  if (destEl) destEl.textContent = booking.destination_stop_name || 'Terminal';
  if (seatEl) seatEl.textContent = booking.seat_numbers && booking.seat_numbers.length > 0 ? booking.seat_numbers.join(', ') : 'Pay & Board';
  if (receiptEl) receiptEl.textContent = booking.mpesa_receipt_number || 'QKJ8912741';

  const qrContainer = document.getElementById('ticket-qrcode');
  if (qrContainer) {
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: ticket.qr_payload || ticket.id,
      width: 140,
      height: 140,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  const banner = document.getElementById('active-ticket-banner');
  const bannerSub = document.getElementById('banner-ticket-subtitle');
  if (banner) {
    banner.classList.remove('hidden');
    if (bannerSub && state.selectedVehicle) {
      bannerSub.textContent = `Show QR Code to Conductor on vehicle ${state.selectedVehicle.registration_number}`;
    }
  }

  modal.classList.remove('hidden');
}

function closeTicketModal() {
  document.getElementById('modal-digital-ticket').classList.add('hidden');
}

function openCurrentTicketModal() {
  if (state.currentTicket) {
    document.getElementById('modal-digital-ticket').classList.remove('hidden');
  } else {
    fetch('/api/tickets/TCK-123456')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          displayDigitalTicket(data.ticket, data.booking);
        }
      });
  }
}

async function checkExistingTicket() {
  try {
    const res = await fetch('/api/tickets/TCK-123456');
    const data = await res.json();
    if (data.success) {
      state.currentTicket = data.ticket;
      const banner = document.getElementById('active-ticket-banner');
      if (banner) banner.classList.remove('hidden');
    }
  } catch (err) {}
}

// Conductor Terminal Logic
async function loadConductorManifest() {
  try {
    const res = await fetch(`/api/conductor/manifest/${state.conductorVehicleId}`);
    const data = await res.json();
    if (data.success) {
      renderConductorManifest(data.passengers);
      const capVal = document.getElementById('conductor-capacity-val');
      if (capVal) capVal.textContent = `${data.capacity} Seats (${data.passengers_count} Booked)`;
    }
  } catch (err) {
    console.error('Error loading manifest:', err);
  }
}

function renderConductorManifest(passengers) {
  const tbody = document.getElementById('conductor-manifest-tbody');
  if (!tbody) return;

  if (passengers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">No passengers booked yet for this route trip.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  passengers.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    tr.innerHTML = `
      <td class="p-2.5 font-bold text-slate-900">${p.passenger_name}</td>
      <td class="p-2.5 font-bold text-emerald-700">${p.seat_numbers}</td>
      <td class="p-2.5 text-slate-600">${p.boarding_stop}</td>
      <td class="p-2.5 text-slate-600">${p.destination_stop}</td>
      <td class="p-2.5">
        <span class="px-2 py-0.5 rounded text-[11px] font-bold ${p.status === 'boarded' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${p.status.toUpperCase()}
        </span>
      </td>
      <td class="p-2.5 font-mono text-slate-500">${p.ticket_id}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function toggleTripStatus() {
  const btn = document.getElementById('btn-toggle-trip');
  const badge = document.getElementById('trip-badge');
  const isCurrentlyActive = badge && badge.textContent.includes('ACTIVE');
  const nextAction = isCurrentlyActive ? 'stop' : 'start';

  try {
    const res = await fetch('/api/conductor/trip-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle_id: state.conductorVehicleId, action: nextAction })
    });

    const data = await res.json();
    if (data.success) {
      if (nextAction === 'start') {
        badge.textContent = 'TRIP ACTIVE';
        badge.className = 'text-xs font-bold px-2 py-0.5 rounded bg-emerald-500 text-slate-950';
        btn.innerHTML = '<span>🛑</span> Stop Route';
        btn.className = 'px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-all flex items-center gap-2';
        showToast('🟢 Route trip started. GPS beacon active.');
      } else {
        badge.textContent = 'TRIP STOPPED';
        badge.className = 'text-xs font-bold px-2 py-0.5 rounded bg-slate-500 text-white';
        btn.innerHTML = '<span>▶️</span> Start Route';
        btn.className = 'px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all flex items-center gap-2';
        showToast('🛑 Route trip stopped.');
      }
    }
  } catch (err) {
    console.error('Error toggling trip:', err);
  }
}

function triggerManualGpsPing() {
  showToast('📡 GPS Ping transmitted: -1.3039, 36.8243 (Nyayo Stadium)');
}

async function verifyTicketByInput() {
  const input = document.getElementById('conductor-qr-input');
  const code = input ? input.value.trim() : '';
  if (!code) {
    alert('Please enter a Ticket ID or scan a QR code');
    return;
  }

  const resultBox = document.getElementById('scanner-result-box');
  resultBox.classList.remove('hidden');
  resultBox.innerHTML = '<div class="text-slate-600">Verifying ticket in Nairobi transit database...</div>';

  try {
    const res = await fetch('/api/tickets/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_content: code, conductor_id: 'Dennis Omondi' })
    });

    const data = await res.json();
    if (data.valid) {
      resultBox.className = 'p-4 rounded-xl border bg-emerald-50 border-emerald-300 text-emerald-900 text-xs space-y-1';
      resultBox.innerHTML = `
        <div class="font-black text-sm flex items-center gap-1.5 text-emerald-800">
          <span>✅</span> TICKET VERIFIED - CLEAR TO BOARD
        </div>
        <p><strong>Passenger:</strong> ${data.booking.passenger_name}</p>
        <p><strong>Seat:</strong> ${data.booking.seat_numbers.join(', ') || 'Pay & Board'}</p>
        <p><strong>Destination:</strong> ${data.booking.destination_stop_name}</p>
        <p><strong>Receipt:</strong> ${data.booking.mpesa_receipt_number}</p>
      `;
      loadConductorManifest();
      showToast('✅ Passenger boarding cleared');
    } else {
      resultBox.className = 'p-4 rounded-xl border bg-rose-50 border-rose-300 text-rose-900 text-xs space-y-1';
      resultBox.innerHTML = `
        <div class="font-black text-sm flex items-center gap-1.5 text-rose-800">
          <span>❌</span> VERIFICATION REJECTED
        </div>
        <p>${data.message}</p>
      `;
    }
  } catch (err) {
    console.error('Error verifying ticket:', err);
  }
}

function fillSampleTicketForScanner() {
  const input = document.getElementById('conductor-qr-input');
  if (state.currentTicket) {
    input.value = state.currentTicket.id;
  } else {
    input.value = 'TCK-123456';
  }
}

async function verifyTicketFromSplit() {
  const input = document.getElementById('split-qr-input');
  const code = input ? input.value.trim() : '';
  const msg = document.getElementById('split-scan-msg');

  if (!code) input.value = 'TCK-123456';

  try {
    const res = await fetch('/api/tickets/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_content: input.value.trim(), conductor_id: 'Dennis' })
    });
    const data = await res.json();
    msg.classList.remove('hidden');
    if (data.valid) {
      msg.textContent = `✅ Clear to board: ${data.booking.passenger_name} (${data.booking.seat_numbers.join(', ') || 'Pay&Board'})`;
      msg.className = 'text-xs text-emerald-700 font-bold';
    } else {
      msg.textContent = `❌ ${data.message}`;
      msg.className = 'text-xs text-rose-700 font-bold';
    }
  } catch (err) {
    console.error(err);
  }
}

// Operator Dashboard Logic
async function loadOperatorData() {
  try {
    const res = await fetch(`/api/operator/stats/${state.operatorId}`);
    const data = await res.json();
    if (data.success) {
      renderOperatorSummary(data.summary, data.operator);
      renderOperatorFleet(data.vehicles);
    }
  } catch (err) {
    console.error('Error loading operator stats:', err);
  }
}

function renderOperatorSummary(summary, operator) {
  const title = document.getElementById('operator-title-name');
  if (title && operator) title.textContent = `${operator.name} (${operator.code})`;

  const daily = document.getElementById('op-daily-revenue');
  const weekly = document.getElementById('op-weekly-revenue');
  const monthly = document.getElementById('op-monthly-revenue');
  const fleetCount = document.getElementById('op-fleet-active-count');

  if (daily) daily.textContent = `KSh ${summary.daily_revenue_kes.toLocaleString()}`;
  if (weekly) weekly.textContent = `KSh ${summary.weekly_revenue_kes.toLocaleString()}`;
  if (monthly) monthly.textContent = `KSh ${summary.monthly_revenue_kes.toLocaleString()}`;
  if (fleetCount) fleetCount.textContent = `${summary.active_vehicles} / ${summary.total_vehicles} Active`;
}

function renderOperatorFleet(vehicles) {
  const tbody = document.getElementById('op-fleet-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  vehicles.forEach(v => {
    const route = state.routes.find(r => r.id === v.route_id);
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50';
    tr.innerHTML = `
      <td class="p-2.5 font-bold text-slate-900">${v.registration_number}</td>
      <td class="p-2.5 text-slate-600">${v.model}</td>
      <td class="p-2.5 font-bold text-slate-800">${v.capacity} seats</td>
      <td class="p-2.5 text-slate-600">${route ? `Route ${route.route_number}: ${route.name}` : 'Unassigned'}</td>
      <td class="p-2.5">
        <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${v.supports_seat_reservation ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}">
          ${v.supports_seat_reservation ? 'Reserved Seats' : 'Pay & Board'}
        </span>
      </td>
      <td class="p-2.5">
        <span class="px-2 py-0.5 rounded text-[11px] font-bold ${v.status === 'on_trip' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">
          ${v.status === 'on_trip' ? 'LIVE ON ROAD' : 'IDLE'}
        </span>
      </td>
      <td class="p-2.5">
        <button onclick="inspectFleetVehicle('${v.id}')" class="text-emerald-700 hover:text-emerald-900 font-bold">Inspect</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function onOperatorSelected() {
  const sel = document.getElementById('operator-switcher');
  state.operatorId = sel.value;
  loadOperatorData();
}

function openAddVehicleModal() {
  document.getElementById('modal-add-vehicle').classList.remove('hidden');
}

function closeAddVehicleModal() {
  document.getElementById('modal-add-vehicle').classList.add('hidden');
}

async function submitAddVehicle() {
  const reg = document.getElementById('add-veh-reg').value.trim();
  const model = document.getElementById('add-veh-model').value.trim();
  const cap = document.getElementById('add-veh-capacity').value;
  const route = document.getElementById('add-veh-route').value;
  const resSupport = document.getElementById('add-veh-reservation').value;

  if (!reg) {
    alert('Please enter a vehicle registration plate number');
    return;
  }

  try {
    const res = await fetch('/api/operator/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_number: reg,
        model,
        capacity: cap,
        route_id: route,
        supports_seat_reservation: resSupport === 'true',
        operator_id: state.operatorId
      })
    });
    const data = await res.json();
    if (data.success) {
      closeAddVehicleModal();
      showToast(`Vehicle ${reg} added successfully to fleet`);
      loadOperatorData();
      refreshNearbyVehicles();
    }
  } catch (err) {
    console.error('Error adding vehicle:', err);
  }
}

function inspectFleetVehicle(vehId) {
  selectVehicleForBooking(vehId);
  switchView('passenger');
}

// Platform Administrator Logic
async function loadAdminData() {
  try {
    const res = await fetch('/api/admin/overview');
    const data = await res.json();
    if (data.success) {
      renderAdminStats(data.stats);
      renderAdminFareMatrix();
      renderAdminAuditLogs(data.audit_logs);
      renderAdminFleetMap(data.fleet);
    }
  } catch (err) {
    console.error('Error loading admin data:', err);
  }
}

function renderAdminStats(stats) {
  const opCount = document.getElementById('adm-operators-count');
  const vehCount = document.getElementById('adm-vehicles-count');
  const actCount = document.getElementById('adm-active-count');
  const rtCount = document.getElementById('adm-routes-count');
  const bkCount = document.getElementById('adm-bookings-count');
  const revCount = document.getElementById('adm-revenue-count');

  if (opCount) opCount.textContent = `${stats.total_operators} SACCOs`;
  if (vehCount) vehCount.textContent = `${stats.total_vehicles} Vehicles`;
  if (actCount) actCount.textContent = `${stats.active_vehicles} Active`;
  if (rtCount) rtCount.textContent = `${stats.total_routes} Routes`;
  if (bkCount) bkCount.textContent = stats.total_bookings.toLocaleString();
  if (revCount) revCount.textContent = `KSh ${(stats.total_revenue_kes / 1000000).toFixed(2)}M`;
}

function renderAdminFareMatrix() {
  const container = document.getElementById('admin-fare-matrix-container');
  if (!container) return;

  container.innerHTML = '';
  state.routes.forEach(r => {
    const div = document.createElement('div');
    div.className = 'p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs';
    div.innerHTML = `
      <div>
        <strong class="text-slate-900 block font-bold">Route ${r.route_number}: ${r.origin} to ${r.destination}</strong>
        <span class="text-slate-500">${r.operator_name}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-slate-500 font-medium">Approved Base Fare:</span>
        <input id="fare-input-${r.id}" type="number" value="${r.base_fare}" class="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-emerald-700 outline-none text-right" />
        <button onclick="updateRouteFare('${r.id}')" class="bg-slate-900 hover:bg-emerald-600 text-white font-bold px-2.5 py-1 rounded text-xs transition-colors">
          Save
        </button>
      </div>
    `;
    container.appendChild(div);
  });
}

async function updateRouteFare(routeId) {
  const input = document.getElementById(`fare-input-${routeId}`);
  const val = input ? input.value : 100;

  try {
    const res = await fetch('/api/admin/fares/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route_id: routeId, base_fare: val })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Base fare updated to KSh ${val}`);
      await loadRoutes();
      refreshNearbyVehicles();
    }
  } catch (err) {
    console.error('Error updating fare:', err);
  }
}

function renderAdminAuditLogs(logs) {
  const container = document.getElementById('admin-audit-logs-container');
  if (!container) return;

  container.innerHTML = '';
  (logs || []).forEach(log => {
    const item = document.createElement('div');
    item.className = 'p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-2';
    item.innerHTML = `
      <div>
        <span class="font-bold text-slate-800">${log.action}</span>:
        <span class="text-slate-600">${log.details}</span>
      </div>
      <span class="text-[10px] text-slate-400 whitespace-nowrap">${new Date(log.timestamp).toLocaleTimeString()}</span>
    `;
    container.appendChild(item);
  });
}

function renderAdminFleetMap(fleet) {
  if (!state.adminMap) return;

  (fleet || []).forEach(f => {
    if (state.adminVehicleMarkers.has(f.vehicle_id)) {
      state.adminVehicleMarkers.get(f.vehicle_id).setLatLng([f.lat, f.lng]);
    } else {
      const busIcon = L.divIcon({
        className: 'custom-bus-marker',
        html: `<span>${f.registration_number.substring(0, 3)}</span>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([f.lat, f.lng], { icon: busIcon })
        .addTo(state.adminMap)
        .bindPopup(`
          <strong>${f.registration_number}</strong><br>
          Operator: ${f.operator_name}<br>
          Route: ${f.route_name}<br>
          Status: ${f.status} | Speed: ${f.speed_kmh} km/h
        `);

      state.adminVehicleMarkers.set(f.vehicle_id, marker);
    }
  });
}

async function updateTraffic(routeId, condition) {
  try {
    const res = await fetch('/api/traffic/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route_id: routeId, condition })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Traffic updated for ${routeId}: ${condition}`);
      refreshNearbyVehicles();
    }
  } catch (err) {
    console.error(err);
  }
}

// Passenger Wallet & Passes Logic
async function loadWalletData() {
  try {
    const res = await fetch('/api/wallet/user-p1');
    const data = await res.json();
    if (data.success) {
      state.userWallet = data.wallet;
      const hBal = document.getElementById('header-wallet-balance');
      const mBal = document.getElementById('wallet-modal-balance');
      const txt = `KSh ${data.wallet.balance_kes.toLocaleString()}`;
      if (hBal) hBal.textContent = txt;
      if (mBal) mBal.textContent = txt;

      const wMethodBtn = document.getElementById('pay-method-wallet');
      if (wMethodBtn) wMethodBtn.textContent = `👛 Wallet (${txt})`;
    }
  } catch (err) {
    console.error(err);
  }
}

function openWalletModal() {
  document.getElementById('modal-wallet').classList.remove('hidden');
}

function closeWalletModal() {
  document.getElementById('modal-wallet').classList.add('hidden');
}

function openTopupSection() {
  document.getElementById('wallet-topup-box').classList.toggle('hidden');
}

async function submitWalletTopup() {
  const amt = document.getElementById('topup-amount-input').value;
  try {
    const res = await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user-p1', amount: amt, phone: '0712345678' })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      document.getElementById('wallet-topup-box').classList.add('hidden');
      await loadWalletData();
    }
  } catch (err) {
    console.error(err);
  }
}

async function buyCommuterPass(passId) {
  try {
    const res = await fetch('/api/commuter-passes/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pass_id: passId, user_id: 'user-p1', phone: '0712345678' })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      closeWalletModal();
    }
  } catch (err) {
    console.error(err);
  }
}

// Lost and Found Logic
function openLostFoundModal() {
  document.getElementById('modal-lost-found').classList.remove('hidden');
  loadLostFoundItems();
}

function closeLostFoundModal() {
  document.getElementById('modal-lost-found').classList.add('hidden');
}

function toggleLostReportForm() {
  document.getElementById('lost-report-form').classList.toggle('hidden');
}

async function loadLostFoundItems() {
  const listEl = document.getElementById('lost-found-items-list');
  if (!listEl) return;

  try {
    const res = await fetch('/api/lost-found');
    const data = await res.json();
    if (data.success) {
      listEl.innerHTML = '';
      data.items.forEach(item => {
        const d = document.createElement('div');
        d.className = 'p-3 bg-slate-50 border rounded-xl space-y-1';
        d.innerHTML = `
          <div class="flex justify-between items-center">
            <strong class="text-slate-900">${item.item_title}</strong>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'found_at_depot' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${item.status === 'found_at_depot' ? 'SAFE AT DEPOT' : 'SEARCHING'}
            </span>
          </div>
          <p class="text-slate-500 text-[11px]">${item.description}</p>
          <div class="text-[10px] text-slate-400 flex justify-between pt-1 border-t">
            <span>Vehicle: ${item.vehicle_reg}</span>
            <span>Location: ${item.depot_location}</span>
          </div>
        `;
        listEl.appendChild(d);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function submitLostReport() {
  const title = document.getElementById('lf-title').value;
  const veh = document.getElementById('lf-veh').value;
  const phone = document.getElementById('lf-phone').value;
  const desc = document.getElementById('lf-desc').value;

  if (!title) {
    alert('Please enter item title');
    return;
  }

  try {
    const res = await fetch('/api/lost-found', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_title: title, vehicle_reg: veh, contact_phone: phone, description: desc })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      document.getElementById('lost-report-form').classList.add('hidden');
      loadLostFoundItems();
    }
  } catch (err) {
    console.error(err);
  }
}

// Passenger Ratings & Reviews Logic
function openReviewsModal() {
  document.getElementById('modal-reviews').classList.remove('hidden');
}

function closeReviewsModal() {
  document.getElementById('modal-reviews').classList.add('hidden');
}

function setReviewRating(stars) {
  state.reviewRating = stars;
  const ratingText = ['1 Star (Poor)', '2 Stars (Fair)', '3 Stars (Average)', '4 Stars (Good)', '5 Stars (Excellent)'][stars - 1];
  document.getElementById('star-rating-val').textContent = ratingText;
}

async function submitTripReview() {
  const comment = document.getElementById('review-comment-input').value;
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: state.reviewRating,
        comment,
        route_id: state.selectedRouteId || 'route-125',
        vehicle_id: state.selectedVehicle ? state.selectedVehicle.id : 'veh-1',
        passenger_name: 'Brian Mwangi'
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      closeReviewsModal();
    }
  } catch (err) {
    console.error(err);
  }
}

function openNotificationModal() {
  document.getElementById('modal-notifications').classList.remove('hidden');
}

function closeNotificationModal() {
  document.getElementById('modal-notifications').classList.add('hidden');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0');

  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3500);
}

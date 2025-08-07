// Davao City Map - Main JS

// --- Map and Bounds Setup ---
const myCenter = [7.090917, 125.611417];
const boundsPoints = [
    [7.045510, 125.584952],
    [7.296067, 125.396947],
    [7.401148, 125.614427],
    [7.210719, 125.796855]
];
const myBounds = L.latLngBounds(boundsPoints);

const map = L.map('map', {
    center: myCenter,
    zoom: 15,
    maxBounds: myBounds,
    maxBoundsViscosity: 1.0,
    zoomControl: true,
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
L.marker(myCenter).addTo(map)
    .bindPopup('Custom Center: 7°05\'27.3"N 125°36\'41.1"E')
    .openPopup();
map.setMinZoom(14);

// --- User Auth and UI Logic ---
const users = {
    'viewer': 'viewer123',
    'admin': '123'
};
let currentUser = null;
let markerTempLatLng = null;
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const markerForm = document.getElementById('markerForm');
const markerTitle = document.getElementById('markerTitle');
const markerColor = document.getElementById('markerColor');
const markerNote = document.getElementById('markerNote');
const cancelMarker = document.getElementById('cancelMarker');
const markerFormHeader = document.getElementById('markerFormHeader');
const loginBox = document.getElementById('loginBox');

// Hide login modal if clicking outside the login box
loginModal.addEventListener('mousedown', function(e) {
    if (e.target === loginModal) {
        hideLogin();
        markerMode = false;
    }
});

// --- Make marker form draggable ---
let isDraggingMarkerForm = false, dragOffsetX = 0, dragOffsetY = 0;
markerFormHeader.addEventListener('mousedown', function(e) {
    isDraggingMarkerForm = true;
    const rect = markerForm.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', function(e) {
    if (!isDraggingMarkerForm) return;
    let x = e.clientX - dragOffsetX;
    let y = e.clientY - dragOffsetY;
    // Keep form within viewport
    const minX = 0, minY = 0;
    const maxX = window.innerWidth - markerForm.offsetWidth;
    const maxY = window.innerHeight - markerForm.offsetHeight;
    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));
    markerForm.style.left = x + 'px';
    markerForm.style.top = y + 'px';
});
document.addEventListener('mouseup', function() {
    isDraggingMarkerForm = false;
    document.body.style.userSelect = '';
});

function showLogin() {
    loginModal.style.display = 'flex';
}
function hideLogin() {
    loginModal.style.display = 'none';
}
function showLogout() {
    logoutBtn.style.display = 'block';
}
function hideLogout() {
    logoutBtn.style.display = 'none';
}
let markerMode = false;

const putMarkerBtn = document.getElementById('putMarkerBtn');

putMarkerBtn.onclick = function() {
    if (!isEditor()) {
        markerMode = true;
        showLogin();
    } else {
        markerMode = true;
        putMarkerBtn.textContent = 'Click on map to place marker';
        putMarkerBtn.disabled = true;
    }
};

function isEditor() {
    return currentUser === 'admin';
}

loginForm.onsubmit = function(e) {
    e.preventDefault();
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;
    if (users[u] && users[u] === p) {
        currentUser = u;
        hideLogin();
        showLogout();
        // If marker mode was triggered by button, enable map click for marker
        if (markerMode) {
            putMarkerBtn.textContent = 'Click on map to place marker';
            putMarkerBtn.disabled = true;
        }
    } else {
        loginError.style.display = 'block';
    }
};
logoutBtn.onclick = function() {
    currentUser = null;
    hideLogout();
};

// --- Marker Logic ---
// Custom colored marker icons
const markerIcons = {
    red: new L.Icon({
        iconUrl: 'assets/MarkerColor/marker-icon-red.svg',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
    }),
    yellow: new L.Icon({
        iconUrl: 'assets/MarkerColor/marker-icon-yellow.svg',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
    }),
    blue: new L.Icon({
        iconUrl: 'assets/MarkerColor/marker-icon-blue.svg',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
    }),
    green: new L.Icon({
        iconUrl: 'assets/MarkerColor/marker-icon-green.svg',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
    })
};

// Store markers in memory (could be extended to backend)
const markers = [];

function addMarkerToMap(latlng, color, note, title) {
    const marker = L.marker(latlng, {icon: markerIcons[color]})
        .addTo(map)
        .bindPopup(`<b>${title}</b><br><b>Note:</b><br><p style='white-space:pre-line;max-width:260px;margin:0;'>${note}</p><br><b>Color:</b> ${color}`);
    markers.push({latlng, color, note, title, marker});
}

// Only editor can add markers, but prompt for login if not logged in
map.on('click', function(e) {
    // Only allow marker placement if in marker mode and logged in as editor
    if (!markerMode || !isEditor()) return;
    markerTempLatLng = e.latlng;
    markerForm.style.display = 'block';
    // Place form near click, but keep within viewport
    let left = e.originalEvent.pageX + 10;
    let top = e.originalEvent.pageY - 10;
    const formWidth = markerForm.offsetWidth || 280;
    const formHeight = markerForm.offsetHeight || 260;
    if (left + formWidth > window.innerWidth) left = window.innerWidth - formWidth - 10;
    if (top + formHeight > window.innerHeight) top = window.innerHeight - formHeight - 10;
    if (left < 0) left = 10;
    if (top < 0) top = 10;
    markerForm.style.left = left + 'px';
    markerForm.style.top = top + 'px';
    markerTitle.value = '';
    markerColor.value = 'red';
    markerNote.value = '';
    markerTitle.focus();
});

markerForm.onsubmit = function(ev) {
    ev.preventDefault();
    if (!markerTempLatLng) return;
    if (!markerTitle.value.trim()) {
        markerTitle.focus();
        markerTitle.style.border = '2px solid #d32f2f';
        setTimeout(() => { markerTitle.style.border = ''; }, 1200);
        return;
    }
    addMarkerToMap(markerTempLatLng, markerColor.value, markerNote.value, markerTitle.value.trim());
    markerForm.style.display = 'none';
    markerTempLatLng = null;
    markerMode = false;
    putMarkerBtn.textContent = 'Put Marker';
    putMarkerBtn.disabled = false;
};
cancelMarker.onclick = function() {
    markerForm.style.display = 'none';
    markerTempLatLng = null;
    markerMode = false;
    putMarkerBtn.textContent = 'Put Marker';
    putMarkerBtn.disabled = false;
};

// Hide marker form if clicking outside (but not when dragging)
document.addEventListener('mousedown', function(e) {
    if (markerForm.style.display === 'block' && !markerForm.contains(e.target) && !isDraggingMarkerForm) {
        markerForm.style.display = 'none';
        markerTempLatLng = null;
        markerMode = false;
        putMarkerBtn.textContent = 'Put Marker';
        putMarkerBtn.disabled = false;
    }
});
// On load, do not show login. Viewer can see map and markers immediately.

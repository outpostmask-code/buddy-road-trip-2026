// BUDDY road trip app — vanilla JS, no build step.

(function () {
  "use strict";

  const STORAGE_KEYS = {
    done: "buddy_done_stops_v1",
    photos: "buddy_photos_v1",
    pretrip: "buddy_pretrip_v1",
    badges: "buddy_badges_v1",
    selectedDay: "buddy_selected_day_v1"
  };

  // ---------- localStorage helpers ----------

  function loadSet(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  }
  function saveSet(key, set) {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch (e) { /* storage full/unavailable — degrade silently */ }
  }

  let doneStops = loadSet(STORAGE_KEYS.done);
  let donePhotos = loadSet(STORAGE_KEYS.photos);
  let donePretrip = loadSet(STORAGE_KEYS.pretrip);
  let unlockedBadges = loadSet(STORAGE_KEYS.badges);
  let selectedDayId = Number(localStorage.getItem(STORAGE_KEYS.selectedDay)) || null;

  // ---------- Pacific time helpers ----------

  function pacificParts(date) {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false
    });
    const parts = {};
    fmt.formatToParts(date).forEach((p) => { if (p.type !== "literal") parts[p.type] = p.value; });
    return parts;
  }

  // "Pseudo-UTC" epoch ms that lets us diff two Pacific wall-clock moments correctly.
  function pacificPseudoEpoch(date) {
    const p = pacificParts(date);
    let hour = Number(p.hour);
    if (hour === 24) hour = 0; // some locales format midnight as 24
    return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), hour, Number(p.minute), Number(p.second));
  }

  function pacificDateString(date) {
    const p = pacificParts(date);
    return `${p.year}-${p.month}-${p.day}`;
  }

  const TRIP_START_PT = Date.UTC(2026, 7, 9, 9, 30, 0);   // Aug 9, 2026, 9:30 AM PT
  const TRIP_END_PT = Date.UTC(2026, 7, 13, 0, 0, 0);      // midnight ending Day 4

  // ---------- Score ----------

  function currentScore() {
    let score = 0;
    TRIP_DAYS.forEach((day) => day.stops.forEach((s) => { if (doneStops.has(s.id)) score += s.points; }));
    donePhotos.forEach(() => {}); // no-op, computed below
    score += SCAVENGER_HUNT.filter((p) => donePhotos.has(p.id)).length * 25;
    return score;
  }

  function renderScore() {
    document.getElementById("score-num").textContent = currentScore();
    document.getElementById("score-total").textContent = TOTAL_TRIP_POINTS;
  }

  // ---------- Countdown ----------

  function renderCountdown() {
    const el = document.getElementById("countdown-banner");
    const now = new Date();
    const nowPT = pacificPseudoEpoch(now);

    if (nowPT < TRIP_START_PT) {
      const diff = TRIP_START_PT - nowPT;
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      let text = "🐾 ";
      if (days > 0) text += `${days}d ${hours}h ${mins}m until we go!`;
      else if (hours > 0) text += `${hours}h ${mins}m until we go!`;
      else text += `${mins}m until we go!`;
      el.textContent = text;
    } else if (nowPT < TRIP_END_PT) {
      const dateStr = pacificDateString(now);
      const day = TRIP_DAYS.find((d) => d.date === dateStr);
      const dayNum = day ? day.id : Math.min(4, Math.max(1, Math.floor((nowPT - TRIP_START_PT) / 86400000) + 1));
      el.textContent = `🐾 Day ${dayNum} — let's go!`;
    } else {
      el.textContent = "🏡 Welcome home!";
    }
  }

  // ---------- Day selection ----------

  function todaysDayId() {
    const dateStr = pacificDateString(new Date());
    const match = TRIP_DAYS.find((d) => d.date === dateStr);
    return match ? match.id : null;
  }

  function defaultDayId() {
    const today = todaysDayId();
    if (today) return today;
    const nowPT = pacificPseudoEpoch(new Date());
    if (nowPT < TRIP_START_PT) return 1;
    return 4;
  }

  if (!selectedDayId || !TRIP_DAYS.find((d) => d.id === selectedDayId)) {
    selectedDayId = defaultDayId();
  }

  function setSelectedDay(id) {
    selectedDayId = id;
    localStorage.setItem(STORAGE_KEYS.selectedDay, String(id));
    renderDayTabs();
    renderDayPanel();
  }

  // ---------- Day tabs ----------

  function renderDayTabs() {
    const wrap = document.getElementById("day-tabs");
    wrap.innerHTML = "";
    const todayId = todaysDayId();
    TRIP_DAYS.forEach((day) => {
      const btn = document.createElement("button");
      btn.className = "day-tab" + (day.id === selectedDayId ? " active" : "") + (day.id === todayId ? " today" : "");
      btn.style.setProperty("--tab-color", day.color);
      btn.style.setProperty("--tab-soft", day.colorSoft);
      btn.innerHTML = `
        <span class="dt-num">DAY ${day.id}</span>
        <span class="dt-title">${escapeHtml(day.title)}</span>
        <span class="dt-date">${escapeHtml(day.label)}</span>
      `;
      btn.addEventListener("click", () => setSelectedDay(day.id));
      wrap.appendChild(btn);
    });
  }

  // ---------- Escaping ----------

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  // ---------- Map ----------

  let map = null;
  let markersLayer = null;
  let gpsMarker = null;
  let gpsAccuracyCircle = null;
  let gpsWatchId = null;

  function initMap() {
    map = L.map("map", { zoomControl: true, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
    map.setView([36.5, -121.7], 8);
  }

  function numberedIcon(num, color) {
    return L.divIcon({
      className: "buddy-pin",
      html: `<div style="
        width:2em;height:2em;border-radius:50% 50% 50% 0;
        background:${color};transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0.2em 0.5em rgba(0,0,0,0.35); border: 0.14em solid white;">
        <span style="transform:rotate(45deg);color:white;font-weight:900;font-size:0.85em;">${num}</span>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 30],
      popupAnchor: [0, -28]
    });
  }

  function renderMapForDay(day) {
    if (!map) return;
    markersLayer.clearLayers();
    const bounds = [];
    day.stops.forEach((stop, idx) => {
      const marker = L.marker([stop.lat, stop.lng], { icon: numberedIcon(idx + 1, day.color) });
      const dirUrl = "https://maps.google.com/?q=" + encodeURIComponent(stop.address);
      marker.bindPopup(`
        <div class="popup-stop-name">${idx + 1}. ${escapeHtml(stop.name)}</div>
        <div>${escapeHtml(stop.address)}</div>
        <a class="popup-directions" href="${dirUrl}" target="_blank" rel="noopener">Get Directions</a>
      `);
      marker.addTo(markersLayer);
      bounds.push([stop.lat, stop.lng]);
    });
    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
    setTimeout(() => map.invalidateSize(), 50);
  }

  function toggleGps() {
    const btn = document.getElementById("locate-btn");
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
      if (gpsMarker) { map.removeLayer(gpsMarker); gpsMarker = null; }
      if (gpsAccuracyCircle) { map.removeLayer(gpsAccuracyCircle); gpsAccuracyCircle = null; }
      btn.textContent = "📍 Show my location";
      btn.classList.remove("active-toggle");
      return;
    }
    if (!navigator.geolocation) {
      alert("Location isn't available on this device/browser.");
      return;
    }
    btn.textContent = "📍 Locating…";
    btn.classList.add("active-toggle");
    gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        btn.textContent = "📍 Following you";
        if (!gpsMarker) {
          gpsMarker = L.circleMarker([latitude, longitude], {
            radius: 9, color: "#fff", weight: 3, fillColor: "#0284C7", fillOpacity: 1
          }).addTo(map);
        } else {
          gpsMarker.setLatLng([latitude, longitude]);
        }
        if (!gpsAccuracyCircle) {
          gpsAccuracyCircle = L.circle([latitude, longitude], {
            radius: accuracy, color: "#0284C7", weight: 1, fillColor: "#0284C7", fillOpacity: 0.12
          }).addTo(map);
        } else {
          gpsAccuracyCircle.setLatLng([latitude, longitude]);
          gpsAccuracyCircle.setRadius(accuracy);
        }
      },
      (err) => {
        btn.textContent = "📍 Show my location";
        btn.classList.remove("active-toggle");
        gpsWatchId = null;
        alert("Couldn't get your location: " + err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function updateOfflineHint() {
    const hint = document.getElementById("map-offline-hint");
    hint.hidden = navigator.onLine;
  }

  // ---------- Stop list ----------

  function copyAddress(address, el) {
    const text = address;
    const done = () => {
      const original = el.textContent;
      el.textContent = "Copied! " + text;
      setTimeout(() => { el.textContent = original; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else {
      done();
    }
  }

  function renderStopList(day) {
    const list = document.getElementById("stop-list");
    list.innerHTML = "";
    day.stops.forEach((stop, idx) => {
      const isDone = doneStops.has(stop.id);
      const li = document.createElement("li");
      li.className = "stop-card" + (isDone ? " done" : "");
      const dirUrl = "https://maps.google.com/?q=" + encodeURIComponent(stop.address);

      li.innerHTML = `
        <div class="stop-top">
          <div class="stop-badge-num">${idx + 1}</div>
          <div class="stop-info">
            <div class="stop-time">${escapeHtml(stop.time)}</div>
            <div class="stop-name">${escapeHtml(stop.name)}</div>
            <div class="stop-address">${escapeHtml(stop.address)}</div>
            ${stop.note ? `<div class="stop-note">💡 ${escapeHtml(stop.note)}</div>` : ""}
            <div class="stop-tags">
              <span class="tag tag-points">+${stop.points} pts</span>
              <span class="tag ${stop.dogFriendly ? "tag-dog" : "tag-nodog"}">${stop.dogFriendly ? "🐾 Dog-friendly" : "🚫 No dogs"}</span>
            </div>
            <div class="stop-quote">${escapeHtml(stop.quote)}</div>
          </div>
        </div>
        <div class="stop-actions">
          <a class="btn btn-primary" href="${dirUrl}" target="_blank" rel="noopener">🗺️ Get Directions</a>
          ${stop.phone ? `<a class="btn btn-call" href="tel:${stop.phone}">📞 Call ${escapeHtml(stop.phoneDisplay || stop.phone)}</a>` : ""}
          <button class="btn btn-done${isDone ? " completed" : ""}" data-stop-id="${stop.id}">
            ${isDone ? "✔️ Done!" : "🐾 We did it!"}
          </button>
        </div>
        <div class="stop-addr-copy" data-copy="${escapeHtml(stop.address)}">📋 Copy address</div>
      `;
      list.appendChild(li);
    });

    list.querySelectorAll("[data-stop-id]").forEach((btn) => {
      btn.addEventListener("click", () => toggleStopDone(btn.getAttribute("data-stop-id")));
    });
    list.querySelectorAll("[data-copy]").forEach((el) => {
      el.addEventListener("click", () => copyAddress(el.getAttribute("data-copy"), el));
    });
  }

  function toggleStopDone(stopId) {
    const wasDone = doneStops.has(stopId);
    if (wasDone) {
      doneStops.delete(stopId);
    } else {
      doneStops.add(stopId);
      fireConfetti();
    }
    saveSet(STORAGE_KEYS.done, doneStops);
    renderScore();
    renderStopList(currentDay());
    checkBadges();
  }

  function currentDay() {
    return TRIP_DAYS.find((d) => d.id === selectedDayId) || TRIP_DAYS[0];
  }

  function renderDayPanel() {
    const day = currentDay();
    document.getElementById("day-title").textContent = `Day ${day.id}: ${day.title}`;
    const earned = day.stops.reduce((sum, s) => sum + (doneStops.has(s.id) ? s.points : 0), 0);
    document.getElementById("day-points").textContent = `${earned} / ${day.points} pts today`;
    document.documentElement.style.setProperty("--day-color", day.color);
    document.documentElement.style.setProperty("--day-color-soft", day.colorSoft);
    document.querySelector(".day-panel").style.setProperty("--day-color", day.color);
    renderStopList(day);
    renderMapForDay(day);
  }

  // ---------- Photo scavenger hunt ----------

  function renderHunt() {
    const list = document.getElementById("hunt-list");
    list.innerHTML = "";
    SCAVENGER_HUNT.forEach((item) => {
      const checked = donePhotos.has(item.id);
      const li = document.createElement("li");
      li.className = "check-item" + (checked ? " checked" : "");
      li.innerHTML = `
        <div class="check-box">${checked ? "✓" : ""}</div>
        <div class="check-label">${escapeHtml(item.label)} <span class="bonus-tag">+25</span></div>
      `;
      li.addEventListener("click", () => togglePhoto(item.id));
      list.appendChild(li);
    });
  }

  function togglePhoto(id) {
    const wasDone = donePhotos.has(id);
    if (wasDone) donePhotos.delete(id);
    else { donePhotos.add(id); fireConfetti(); }
    saveSet(STORAGE_KEYS.photos, donePhotos);
    renderScore();
    renderHunt();
    checkBadges();
  }

  // ---------- Pre-trip checklist ----------

  function renderPretrip() {
    const list = document.getElementById("pretrip-list");
    list.innerHTML = "";
    PRETRIP_CHECKLIST.forEach((item) => {
      const checked = donePretrip.has(item.id);
      const li = document.createElement("li");
      li.className = "check-item" + (checked ? " checked" : "");
      li.innerHTML = `
        <div class="check-box">${checked ? "✓" : ""}</div>
        <div class="check-label">${escapeHtml(item.label)}</div>
      `;
      li.addEventListener("click", () => {
        if (donePretrip.has(item.id)) donePretrip.delete(item.id);
        else donePretrip.add(item.id);
        saveSet(STORAGE_KEYS.pretrip, donePretrip);
        renderPretrip();
      });
      list.appendChild(li);
    });
  }

  // ---------- Badges ----------

  function renderBadges() {
    const grid = document.getElementById("badge-grid");
    grid.innerHTML = "";
    const emojiFor = {
      "road-warrior": "🚗", "fish-whisperer": "🐠", "big-sur-explorer": "🌲",
      "homeward-hound": "🏡", "good-boy": "🐶", "shutterbug": "📸"
    };
    BADGES.forEach((b) => {
      const unlocked = unlockedBadges.has(b.id);
      const div = document.createElement("div");
      div.className = "badge-card" + (unlocked ? " unlocked" : "");
      div.innerHTML = `
        <div class="badge-emoji">${emojiFor[b.id] || "🏅"}</div>
        <div class="badge-name">${escapeHtml(b.name)}</div>
        <div class="badge-desc">${escapeHtml(b.desc)}</div>
      `;
      grid.appendChild(div);
    });
  }

  function checkBadges() {
    let newlyUnlocked = [];
    BADGES.forEach((b) => {
      if (!unlockedBadges.has(b.id) && b.check(doneStops, donePhotos)) {
        unlockedBadges.add(b.id);
        newlyUnlocked.push(b);
      }
    });
    if (newlyUnlocked.length) {
      saveSet(STORAGE_KEYS.badges, unlockedBadges);
      renderBadges();
      queueBadgeToasts(newlyUnlocked);
    }
  }

  let toastQueue = [];
  let toastShowing = false;

  function queueBadgeToasts(badges) {
    toastQueue = toastQueue.concat(badges);
    if (!toastShowing) showNextToast();
  }

  function showNextToast() {
    if (!toastQueue.length) { toastShowing = false; return; }
    toastShowing = true;
    const b = toastQueue.shift();
    const toast = document.getElementById("badge-toast");
    document.getElementById("badge-toast-name").textContent = "🏅 " + b.name;
    document.getElementById("badge-toast-desc").textContent = b.desc + " — Buddy is SO proud.";
    toast.hidden = false;
    fireConfetti(true);
    setTimeout(() => {
      toast.hidden = true;
      setTimeout(showNextToast, 300);
    }, 2600);
  }

  // ---------- Confetti (self-contained, no CDN — must work fully offline) ----------

  function fireConfetti(big) {
    const wrap = document.getElementById("confetti-canvas-wrap");
    const canvas = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    wrap.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const colors = ["#F5A623", "#8B5CF6", "#0D9488", "#0284C7", "#FFFFFF"];
    const count = big ? 140 : 70;
    const particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 60,
        y: window.innerHeight * 0.3 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * (big ? 10 : 7),
        vy: -Math.random() * (big ? 11 : 8) - 3,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.3,
        life: 0
      });
    }
    const gravity = 0.28;
    const maxLife = big ? 110 : 80;

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        if (p.life > maxLife) return;
        alive = true;
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.life++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p.life / maxLife);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      if (alive) {
        requestAnimationFrame(tick);
      } else {
        wrap.removeChild(canvas);
      }
    }
    requestAnimationFrame(tick);
  }

  // ---------- Reset ----------

  function resetProgress() {
    if (!confirm("Reset all points, badges, and checklists? This can't be undone.")) return;
    doneStops = new Set();
    donePhotos = new Set();
    donePretrip = new Set();
    unlockedBadges = new Set();
    [STORAGE_KEYS.done, STORAGE_KEYS.photos, STORAGE_KEYS.pretrip, STORAGE_KEYS.badges].forEach((k) => localStorage.removeItem(k));
    renderScore();
    renderDayPanel();
    renderHunt();
    renderPretrip();
    renderBadges();
  }

  // ---------- Init ----------

  function init() {
    document.getElementById("score-total").textContent = TOTAL_TRIP_POINTS;
    renderCountdown();
    setInterval(renderCountdown, 30000);

    renderDayTabs();
    initMap();
    renderDayPanel();
    renderScore();
    renderHunt();
    renderPretrip();
    renderBadges();
    checkBadges();

    document.getElementById("locate-btn").addEventListener("click", toggleGps);
    document.getElementById("reset-btn").addEventListener("click", resetProgress);

    updateOfflineHint();
    window.addEventListener("online", updateOfflineHint);
    window.addEventListener("offline", updateOfflineHint);

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

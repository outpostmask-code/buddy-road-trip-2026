// BUDDY road trip app — vanilla JS, no build step.

(function () {
  "use strict";

  const STORAGE_KEYS = {
    done: "buddy_done_stops_v1",
    photos: "buddy_photos_v1",
    pretrip: "buddy_pretrip_v1",
    badges: "buddy_badges_v1",
    selectedDay: "buddy_selected_day_v1",
    // When each stop was ticked off. This is how the trip records its OWN real
    // leg times — see the "⏱ Trip timings" button in the footer. Researched
    // drive times are guesses; these are measured, and they are what makes the
    // next vacation app's live-ETA feature accurate instead of optimistic.
    stopTimes: "buddy_stop_times_v1"
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

  function loadMap(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function saveMap(key, obj) {
    try {
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) { /* storage full/unavailable — degrade silently */ }
  }

  let doneStops = loadSet(STORAGE_KEYS.done);
  let donePhotos = loadSet(STORAGE_KEYS.photos);
  let donePretrip = loadSet(STORAGE_KEYS.pretrip);
  let unlockedBadges = loadSet(STORAGE_KEYS.badges);
  let selectedDayId = Number(localStorage.getItem(STORAGE_KEYS.selectedDay)) || null;
  let stopTimes = loadMap(STORAGE_KEYS.stopTimes);   // { stopId: ISO timestamp }

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

  const TRIP_START_PT = Date.UTC(2026, 7, 9, 9, 0, 0);    // Aug 9, 2026, 9:00 AM PT (Vince moved it up 30 min)
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
  let gpsLastFix = null;   // {lat,lng} — feeds the live 'X mi out' estimate

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
      gpsLastFix = null;
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
        gpsLastFix = { lat: latitude, lng: longitude };
        renderScheduleStrip(currentDay());   // live "how far out" line
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
    const rows = projectDay(day);
    const isToday = day.date === pacificDateString(new Date());
    const nextIdx = rows.findIndex((r) => !r.done);

    day.stops.forEach((stop, idx) => {
      const isDone = doneStops.has(stop.id);
      const row = rows[idx];
      const li = document.createElement("li");
      li.className = "stop-card" + (isDone ? " done" : "") + (isToday && idx === nextIdx ? " next-up" : "");
      const dirUrl = "https://maps.google.com/?q=" + encodeURIComponent(stop.address);

      // The live line: what time we now expect to be here. Only shown for
      // TODAY — projecting a future day from "now" would be nonsense.
      // Only show the live chip when it tells you something the printed time
      // doesn't. Echoing "9:00 AM" next to "9:00 AM" is just noise.
      let live = "";
      if (isToday) {
        const d = row.delta;
        if (isDone && row.source === "actual") {
          live = `<span class="stop-live actual">✔ ${escapeHtml(fmtMins(row.eta))}</span>`;
        } else if (row.source === "anchored" && d != null && Math.abs(d) < 10) {
          live = `<span class="stop-live anchored">🔒 booked</span>`;
        } else if (d == null || Math.abs(d) >= 10) {
          const tag = d == null ? "" :
            (d < 0 ? " · " + fmtGap(-d * 60000) + " early" : " · " + fmtGap(d * 60000) + " late");
          live = `<span class="stop-live">~${escapeHtml(fmtMins(row.eta))}${escapeHtml(tag)}</span>`;
        }
      }

      li.innerHTML = `
        <div class="stop-top">
          <div class="stop-badge-num">${idx + 1}</div>
          <div class="stop-info">
            <div class="stop-time">${escapeHtml(stop.time)}${live}</div>
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
      delete stopTimes[stopId];        // untick = it didn't happen yet, drop the stamp
    } else {
      doneStops.add(stopId);
      stopTimes[stopId] = new Date().toISOString();   // stamp WHEN — this is the measurement
      fireConfetti();
    }
    saveMap(STORAGE_KEYS.stopTimes, stopTimes);
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
    renderScheduleStrip(day);
    renderStopList(day);
    renderMapForDay(day);
  }

  function renderScheduleStrip(day) {
    const el = document.getElementById("schedule-strip");
    const st = scheduleStatus(day);
    if (!st) { el.hidden = true; return; }
    let msg = st.text + " — next: " + st.next.stop.name;
    if (gpsLastFix) {
      const out = etaFromGps(st.next.stop);
      if (out) msg += " · " + out;
    }
    el.textContent = msg;
    el.className = "schedule-strip " + st.tone;
    el.hidden = false;
  }

  // ---------- GPS-based "how far out are we?" ----------
  //
  // Straight-line distance is BADLY wrong on Highway 1 — Bixby to McWay is
  // ~28 winding miles that a crow would call 15. So instead of guessing a
  // speed, each leg self-calibrates: we know the real driveMin between the
  // two stops, and we know their straight-line distance, so we derive that
  // leg's own "how much worse than a crow" factor and apply it to how far
  // YOU still are. On a straight 101 leg the factor is near 1; through Big
  // Sur it comes out much higher, automatically.

  function haversineMiles(a, b) {
    const R = 3958.8, toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  function etaFromGps(stop) {
    if (!gpsLastFix) return null;
    const day = currentDay();
    const i = day.stops.findIndex((s) => s.id === stop.id);
    const prev = i > 0 ? day.stops[i - 1] : null;
    const miles = haversineMiles(gpsLastFix, stop);
    if (miles < 0.3) return "you're here";

    // Minutes per straight-line mile, calibrated on THIS leg's real drive time.
    let mpm = 1.6;                                    // fallback ≈ 37 mph
    if (prev && stop.driveMin) {
      const legMi = haversineMiles(prev, stop);
      if (legMi > 0.5) mpm = stop.driveMin / legMi;   // self-calibrating
    }
    const mins = Math.round(miles * mpm);
    return miles.toFixed(miles < 10 ? 1 : 0) + " mi · ~" + fmtGap(mins * 60000) + " out";
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

  // Vince, 2026-08-09: "stuck in the middle of the screen and he can't click
  // on it or dismiss it. It's blocking content." Two things fixed it:
  // (1) style.css no longer sets pointer-events:none on the visible box, so
  // a tap actually reaches it; (2) dismissToast() below is wired to both a
  // tap AND a timer, and whichever fires first wins (the other is
  // cancelled) — so it can NEVER get stuck on screen with no way off it,
  // even if a future bug ever caused it to show unexpectedly.
  let toastQueue = [];
  let toastShowing = false;
  let toastHideTimer = null;
  let toastAdvanceTimer = null;

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
    toastHideTimer = setTimeout(dismissToast, 2600);
  }

  function dismissToast() {
    if (toastHideTimer) { clearTimeout(toastHideTimer); toastHideTimer = null; }
    if (toastAdvanceTimer) { clearTimeout(toastAdvanceTimer); toastAdvanceTimer = null; }
    document.getElementById("badge-toast").hidden = true;
    toastAdvanceTimer = setTimeout(showNextToast, 300);
  }

  // ---------- Live schedule — "when will we actually get there?" ----------
  //
  // THE RULE THAT MAKES THIS WORK: some stops CANNOT move earlier. The hotel
  // won't check you in before 4, the aquarium ticket is for 10, the sun sets
  // when it sets, the table is booked for 7. Those are `anchored: true`.
  // A naive "you're 45 min ahead so everything is 45 min earlier" would tell
  // you dinner is at 6:15 and sunset at 7:15 — confidently wrong, and worse
  // than the printed plan. So running early buys SLACK BEFORE an anchor, not
  // an earlier anchor.

  function minsNowPT() {
    const p = pacificParts(new Date());
    return Number(p.hour) % 24 * 60 + Number(p.minute);
  }

  function fmtMins(m) {
    m = Math.round(m);
    let h = Math.floor(m / 60) % 24, mm = m % 60;
    const ap = h >= 12 ? "PM" : "AM";
    let h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ":" + String(mm).padStart(2, "0") + " " + ap;
  }

  // Walk the day forward and project an arrival time for every stop.
  // Completed stops use their REAL recorded time; the rest are projected.
  function projectDay(day) {
    const nowM = minsNowPT();
    const todayStr = pacificDateString(new Date());
    const isToday = day.date === todayStr;
    let cursor = null;   // when we are free to leave the previous stop

    return day.stops.map((s) => {
      const realIso = stopTimes[s.id];
      const done = doneStops.has(s.id);
      let eta, source;

      if (done && realIso) {
        const p = pacificParts(new Date(realIso));
        eta = Number(p.hour) % 24 * 60 + Number(p.minute);
        source = "actual";
      } else {
        const drive = s.driveMin || 0;
        // Earliest we could physically arrive: from where we are in the day,
        // plus the drive. For the first not-yet-done stop on TODAY that means
        // "from right now"; on a future day, from its planned time.
        const earliest = (cursor === null)
          ? (isToday ? nowM + drive : (s.plannedMin != null ? s.plannedMin : 0))
          : cursor + drive;
        // An anchored stop never happens before its booked time.
        eta = (s.anchored && s.plannedMin != null) ? Math.max(earliest, s.plannedMin) : earliest;
        source = (eta > earliest) ? "anchored" : "projected";
      }
      cursor = eta + (s.dwellMin || 0);
      return { stop: s, eta, source, done,
               delta: s.plannedMin != null ? eta - s.plannedMin : null };
    });
  }

  // "How are we doing?" — measured against the next stop that has a real
  // clock time. Returns null when there is nothing meaningful to say.
  function scheduleStatus(day) {
    if (day.date !== pacificDateString(new Date())) return null;
    const rows = projectDay(day);
    const next = rows.find((r) => !r.done && r.stop.plannedMin != null);
    if (!next) return null;
    const d = Math.round(next.delta);
    if (Math.abs(d) < 10) return { text: "⏱ Right on schedule", tone: "ok", next: next };
    if (d < 0) return { text: "⏱ " + fmtGap(-d * 60000) + " ahead of plan", tone: "ahead", next: next };
    return { text: "⏱ " + fmtGap(d * 60000) + " behind plan", tone: "behind", next: next };
  }

  // ---------- Trip timings — the trip measuring its own drive times ----------
  //
  // Every "We did it!" tap stamps the time. This turns those stamps into a
  // readable list of how long each leg ACTUALLY took, which is the data the
  // next vacation app needs for live ETAs. Researched drive times are guesses;
  // these are real. Copy the text out after the trip.

  function fmtClock(iso) {
    return new Date(iso).toLocaleTimeString("en-US", {
      timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit"
    });
  }

  function fmtGap(ms) {
    const mins = Math.round(ms / 60000);
    if (mins < 60) return mins + " min";
    const h = Math.floor(mins / 60);
    return h + "h " + String(mins % 60).padStart(2, "0") + "m";
  }

  function buildTimingsText() {
    const lines = [];
    let recorded = 0;
    TRIP_DAYS.forEach((day) => {
      lines.push("── Day " + day.id + ": " + day.title + " (" + day.label + ") ──");
      let prev = null;
      day.stops.forEach((s) => {
        const iso = stopTimes[s.id];
        if (!iso) { lines.push("  ·  " + s.name + " — (not marked)"); return; }
        recorded++;
        // Gap from the previous RECORDED stop = drive + time spent there.
        const gap = prev ? "   [+" + fmtGap(new Date(iso) - new Date(prev)) + " since last stop]" : "";
        lines.push("  " + fmtClock(iso) + "  " + s.name + gap);
        prev = iso;
      });
      lines.push("");
    });
    if (!recorded) {
      return "No stops marked yet.\n\nTap “We did it!” at each stop and this fills in\nwith the real times — that's how the next trip's\napp learns how long each drive actually takes.";
    }
    lines.push("(Times are Pacific. Each [+gap] is drive time PLUS however");
    lines.push("long you spent at the previous stop.)");
    return lines.join("\n");
  }

  function toggleTimings() {
    const box = document.getElementById("timings-box");
    if (!box.hidden) { box.hidden = true; return; }
    box.textContent = buildTimingsText();
    box.hidden = false;
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
    stopTimes = {};
    [STORAGE_KEYS.done, STORAGE_KEYS.photos, STORAGE_KEYS.pretrip, STORAGE_KEYS.badges,
     STORAGE_KEYS.stopTimes].forEach((k) => localStorage.removeItem(k));
    const tbox = document.getElementById("timings-box");
    if (tbox) tbox.hidden = true;
    renderScore();
    renderDayPanel();
    renderHunt();
    renderPretrip();
    renderBadges();
  }

  // ---------- Init ----------

  function init() {
    // Belt-and-suspenders: force the badge toast hidden on load. It already
    // carries the `hidden` attribute in index.html and style.css enforces
    // display:none on [hidden] with !important, but a returning visitor
    // whose badges were already unlocked in a previous session should never
    // see it pop on page load — checkBadges() below only queues NEWLY
    // unlocked badges, never re-shows old ones, so this is just a guard.
    document.getElementById("badge-toast").hidden = true;
    // Tap anywhere on the toast to dismiss it immediately (Vince, 2026-08-09
    // — it must never be able to just sit there blocking the screen).
    document.getElementById("badge-toast").addEventListener("click", dismissToast);

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
    document.getElementById("timings-btn").addEventListener("click", toggleTimings);
    document.getElementById("reset-btn").addEventListener("click", resetProgress);

    updateOfflineHint();
    window.addEventListener("online", updateOfflineHint);
    window.addEventListener("offline", updateOfflineHint);

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
      });
      // sw.js is cache-first (offline in Big Sur needs it), which means a
      // shipped fix can sit invisible on a phone that already has the app
      // open — the old JS keeps running in memory even after a new
      // service worker installs in the background. This is exactly what
      // happened with the 2026-08-09 badge-toast fix reaching Vince's
      // phone. Reload ONCE, automatically, the moment a new version
      // actually takes control — so a fix reaches him without having to
      // know to force-close and reopen the app. Guarded so it can only
      // fire once per page life (a second controllerchange should never
      // happen, but a reload loop would be a much worse bug than the one
      // this is fixing).
      let reloadedForUpdate = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloadedForUpdate) return;
        reloadedForUpdate = true;
        window.location.reload();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* ── Health & Longevity Dashboard – app.js ─────────────────────────── */

const KEY = 'hld_data';

// ── IDs that are persisted via localStorage ─────────────────────────
const FIELD_IDS = [
  'sleep-score','hrv','rhr','body-weight',
  'fatigue','soreness',
  'training-call','nutrition-call',
  'daily-notes',
  'glucose-val','a1c-val','ldl-val','hdl-val','creatinine-val','last-labs-date',
  'next-week',
  // weekly checkboxes
  'w-training-1','w-training-2','w-training-3','w-training-4',
  'w-rec-1','w-rec-2','w-rec-3','w-rec-4',
  'w-nut-1','w-nut-2','w-nut-3','w-nut-4',
  'w-risk-1','w-risk-2','w-risk-3','w-risk-4',
];

// ── Init ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTodayDate();
  loadAll();
  hookSliders();
  hookNavHighlight();
});

function setTodayDate() {
  const el = document.getElementById('today-date');
  if (!el) return;
  const d = new Date();
  el.textContent = d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Traffic lights ────────────────────────────────────────────────────
function setLight(color) {
  ['green','yellow','red'].forEach(c => {
    document.getElementById('light-' + c).classList.remove('active');
  });
  document.getElementById('light-' + color).classList.add('active');
  // persist immediately
  const saved = loadRaw();
  saved.dayLight = color;
  saveRaw(saved);
  applyBodyLight(color);
}

function applyBodyLight(color) {
  document.body.dataset.light = color || '';
}

// ── Sliders ───────────────────────────────────────────────────────────
function hookSliders() {
  ['fatigue','soreness'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      document.getElementById(id + '-val').textContent = el.value;
    });
  });
}

// ── Save / Load ───────────────────────────────────────────────────────
function saveAll() {
  const data = loadRaw();
  const today = todayKey();
  if (!data.days) data.days = {};
  const day = {};

  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    day[id] = el.type === 'checkbox' ? el.checked : el.value;
  });

  // persist light separately (already done on click, but sync here too)
  ['green','yellow','red'].forEach(c => {
    if (document.getElementById('light-' + c)?.classList.contains('active')) {
      day.dayLight = c;
    }
  });

  data.days[today] = day;
  saveRaw(data);

  const msg = document.getElementById('saved-msg');
  if (msg) {
    msg.textContent = 'Saved ' + new Date().toLocaleTimeString();
    setTimeout(() => { msg.textContent = ''; }, 3000);
  }
}

function loadAll() {
  const data = loadRaw();
  const today = todayKey();
  const day   = data?.days?.[today] || {};

  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el || day[id] === undefined) return;
    if (el.type === 'checkbox') {
      el.checked = day[id];
    } else {
      el.value = day[id];
    }
  });

  // restore sliders' displayed values
  ['fatigue','soreness'].forEach(id => {
    const el  = document.getElementById(id);
    const val = document.getElementById(id + '-val');
    if (el && val) val.textContent = el.value;
  });

  // restore light
  const light = day.dayLight || data.dayLight;
  if (light) {
    document.getElementById('light-' + light)?.classList.add('active');
    applyBodyLight(light);
  }
}

function loadRaw() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function saveRaw(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ── File drop / upload ────────────────────────────────────────────────
function handleDrop(event, zoneId, previewId) {
  event.preventDefault();
  document.getElementById(zoneId)?.classList.remove('drag-over');
  const file = event.dataTransfer?.files?.[0];
  if (file) showFilePreview(file, previewId);
}

function handleFile(input, previewId) {
  const file = input.files?.[0];
  if (file) showFilePreview(file, previewId);
}

function showFilePreview(file, previewId) {
  const el = document.getElementById(previewId);
  if (!el) return;
  el.innerHTML = '';

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      el.appendChild(img);
    };
    reader.readAsDataURL(file);
  } else {
    const p = document.createElement('p');
    p.className = 'file-name';
    p.textContent = '✓ ' + file.name;
    el.appendChild(p);
  }
}

// ── Sidebar nav highlight on scroll ──────────────────────────────────
function hookNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const target = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (target) target.classList.add('active');
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => observer.observe(s));
}

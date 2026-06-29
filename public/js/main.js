/* =========================================
   SUNGUARD — JavaScript Principal
   Universidad Diego Portales 2026
   ========================================= */

// ============================================================
// ESTADO GLOBAL
// ============================================================
const APP = {
  user: null,
  token: null,
  timerRunning: true,
  timerSeconds: 16337, // 4h 32m 17s demo
  uvValue: 7.4,
  dosis: 182,
  histData: [],
  histPage: 1,
  histPerPage: 10,
  histSort: { col: 'fecha', dir: 'desc' },
  histFilter: { text: '', estado: '' },
  darkMode: false,
  chartData: [],
};

const PAGE = document.body?.dataset.page || 'landing';

function isPage(pageName) {
  return PAGE === pageName;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function applyTheme(theme) {
  APP.darkMode = theme === 'dark';
  document.documentElement.setAttribute('data-theme', APP.darkMode ? 'dark' : 'light');
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) themeIcon.textContent = APP.darkMode ? '☀' : '🌙';
}

function restoreTheme() {
  const savedTheme = localStorage.getItem('sg_theme');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    applyTheme(savedTheme);
    return;
  }
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
}

// ============================================================
// DEMO ACCOUNTS
// ============================================================
const DEMO_USERS = {
  trabajador: {
    nombre: 'Carlos Herrera', email: 'carlos@sunguard.cl',
    tipo: 'trabajador', empresa: 'Constructora Norte S.A.',
    cargo: 'Maestro de obra', avatar: '👷'
  },
  supervisor: {
    nombre: 'Ana Pérez', email: 'ana@sunguard.cl',
    tipo: 'supervisor', empresa: 'Constructora Norte S.A.',
    cargo: 'Supervisora de seguridad', avatar: '👔'
  },
  admin: {
    nombre: 'Admin SunGuard', email: 'admin@sunguard.cl',
    tipo: 'admin', empresa: 'SunGuard Systems',
    cargo: 'Administrador de plataforma', avatar: '🔑'
  }
};

// ============================================================
// LOADING SCREEN
// ============================================================
window.addEventListener('load', () => {
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.classList.add('hidden');
    initApp();
  }, 2200);
});

function initApp() {
  restoreTheme();
  initParticles();
  initScrollObserver();
  initNavScroll();
  bindNavToggle();

  const saved = sessionStorage.getItem('sg_user');
  if (saved) {
    APP.user = JSON.parse(saved);
  }

  const savedToken = sessionStorage.getItem('sg_token');
  if (savedToken) {
    APP.token = savedToken;
  }

  updateUIForUser();

  if (isPage('dashboard')) {
    loadDashboardData();
  }

  if (isPage('historial')) {
    loadHistorialData();
  }
}

// ============================================================
// PARTÍCULAS HERO
// ============================================================
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animationDuration = (3 + Math.random() * 6) + 's';
    p.style.animationDelay = (Math.random() * 4) + 's';
    p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
    container.appendChild(p);
  }
}

// ============================================================
// SCROLL OBSERVER (fade-in animations)
// ============================================================
function initScrollObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ============================================================
// NAVBAR STICKY
// ============================================================
function initNavScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });
}

function bindNavToggle() {
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!navToggle || !navLinks) return;
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    const offset = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

function navClick(id) {
  closeNavMobile();
  setTimeout(() => scrollToSection(id), 50);
}

function closeNavMobile() {
  const navLinks = document.getElementById('nav-links');
  if (navLinks) navLinks.classList.remove('open');
}

// ============================================================
// THEME TOGGLE
// ============================================================
function toggleTheme() {
  const nextTheme = APP.darkMode ? 'light' : 'dark';
  applyTheme(nextTheme);
  localStorage.setItem('sg_theme', nextTheme);
  showToast('Modo ' + (APP.darkMode ? 'oscuro' : 'claro') + ' activado', 'info');
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '✓'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ============================================================
// MODALES
// ============================================================
function openModal(id) {
  const modal = document.getElementById('modal-' + id);
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  closeNavMobile();
}

function closeModal(id) {
  const modal = document.getElementById('modal-' + id);
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalOut(event, id) {
  if (event.target === event.currentTarget) closeModal(id);
}

function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => openModal(to), 200);
}

// ============================================================
// AUTENTICACIÓN
// ============================================================
async function doLogin(e) {
  e.preventDefault();
  const correo = document.getElementById('login-email')?.value?.trim() || '';
  const contrasena = document.getElementById('login-pass')?.value || '';

  if (!correo || !contrasena) {
    showToast('Ingresa correo y contraseña.', 'error');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.error || 'Credenciales inválidas.', 'error');
      return;
    }

    loginSuccess(data.user, data.token, { closeModalId: 'login' });
    const form = document.getElementById('form-login');
    if (form) form.reset();
  } catch (error) {
    showToast('Error de conexión con el servidor.', 'error');
  }
}

function loginDemo(tipo) {
  loginSuccess(DEMO_USERS[tipo]);
}

function normalizeTipo(user) {
  return user?.tipo || user?.rol?.toLowerCase?.() || 'trabajador';
}

function buildAvatar(tipo) {
  if (tipo === 'supervisor') return '👔';
  if (tipo === 'admin') return '🔑';
  return '👷';
}

function normalizeUser(user) {
  if (!user) return null;
  const tipo = normalizeTipo(user);
  return {
    id: user.id || null,
    nombre: user.nombre || '',
    apellido: user.apellido || '',
    email: user.email || user.correo || '',
    correo: user.correo || user.email || '',
    tipo,
    rol: user.rol || tipo,
    empresa: user.empresa || user.nombre_empresa || '—',
    cargo: user.cargo || '—',
    avatar: user.avatar || buildAvatar(tipo),
  };
}

function loginSuccess(user, token = null, options = {}) {
  const normalizedUser = normalizeUser(user);
  APP.user = normalizedUser;
  APP.token = token;
  sessionStorage.setItem('sg_user', JSON.stringify(normalizedUser));
  if (token) sessionStorage.setItem('sg_token', token);
  const closeModalId = options.closeModalId || 'login';
  closeModal(closeModalId);
  updateUIForUser();
  showToast(`Bienvenido/a, ${normalizedUser.nombre}!`, 'success');
  if (isPage('dashboard')) loadDashboardData();
  if (isPage('historial')) loadHistorialData();
}

function logout() {
  APP.user = null;
  APP.token = null;
  sessionStorage.removeItem('sg_user');
  sessionStorage.removeItem('sg_token');
  updateUIForUser();
  showToast('Sesión cerrada correctamente.', 'info');
  if (isPage('dashboard')) clearDashboardData();
  if (isPage('historial')) clearHistorialData();
}

function updateUIForUser() {
  const user = APP.user;
  const loginBtn = document.querySelectorAll('.btn-nav-login, .btn-nav-register');
  const profileItem = document.getElementById('nav-profile-item');
  const logoutItem = document.getElementById('nav-logout-item');

  if (user) {
    loginBtn.forEach(b => b.parentElement.style.display = 'none');
    if (profileItem) profileItem.style.display = '';
    if (logoutItem) logoutItem.style.display = '';
    updatePerfil(user);
    // Show supervisor panel for supervisor/admin
    const sp = document.getElementById('supervisor-panel');
    if (sp) {
      sp.style.display = (user.tipo === 'supervisor' || user.tipo === 'admin') ? 'block' : 'none';
      if (sp.style.display !== 'none') renderSupervisorPanel();
    }
    setText('dashboard-user-msg', `Bienvenido/a, ${user.nombre}. Aquí están tus datos en tiempo real.`);
  } else {
    loginBtn.forEach(b => b.parentElement.style.display = '');
    if (profileItem) profileItem.style.display = 'none';
    if (logoutItem) logoutItem.style.display = 'none';
    const sp = document.getElementById('supervisor-panel');
    if (sp) sp.style.display = 'none';
    setText('dashboard-user-msg', 'Inicia sesión para ver tus datos personalizados en tiempo real.');
  }
}

function updatePerfil(user) {
  const normalized = normalizeUser(user);
  setText('perfil-nombre-modal', normalized.nombre);
  setText('perfil-rol-modal', normalized.tipo.charAt(0).toUpperCase() + normalized.tipo.slice(1));
  setText('perfil-avatar-modal', normalized.avatar || '👤');
  setText('pf-email', normalized.email);
  setText('pf-empresa', normalized.empresa || '—');
  setText('pf-cargo', normalized.cargo || '—');
  setText('pf-tipo', normalized.tipo);
  setText('pf-last-uv', APP.uvValue.toFixed(1));
  setText('pf-dosis', APP.dosis + ' J/m²');
  setText('pf-tiempo', formatDuration(APP.timerSeconds));
}

// ============================================================
// REGISTRO
// ============================================================
async function doRegistro(e) {
  e.preventDefault();
  const nombre = document.getElementById('reg-nombre')?.value?.trim() || '';
  const apellido = document.getElementById('reg-apellido')?.value?.trim() || '';
  const rut = document.getElementById('reg-rut')?.value?.trim() || '';
  const correo = document.getElementById('reg-email')?.value?.trim() || '';
  const contrasena = document.getElementById('reg-pass')?.value || '';
  const pass2 = document.getElementById('reg-pass2')?.value || '';
  const tipoUsuario = document.getElementById('reg-tipo')?.value || '';
  const empresa = document.getElementById('reg-empresa')?.value?.trim() || null;
  const cargo = document.getElementById('reg-cargo')?.value?.trim() || null;
  const telefono = document.getElementById('reg-telefono')?.value?.trim() || null;

  if (!nombre || !apellido || !rut || !correo || !contrasena || !tipoUsuario) {
    showToast('Completa todos los campos obligatorios.', 'error');
    return;
  }

  if (contrasena !== pass2) {
    showToast('Las contraseñas no coinciden.', 'error');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellido, rut, correo, contrasena, tipoUsuario, empresa, cargo, telefono })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.error || 'Error en registro.', 'error');
      return;
    }

    loginSuccess(data.user, data.token, { closeModalId: 'registro' });
    showToast('Cuenta creada correctamente. Sesión iniciada.', 'success');
    const form = document.getElementById('form-registro');
    if (form) form.reset();
    const empresaFields = document.getElementById('empresa-fields');
    if (empresaFields) empresaFields.style.display = 'none';
  } catch (error) {
    showToast('Error de conexión con el servidor.', 'error');
  }
}

function toggleEmpresaFields2() {
  const uso = document.querySelector('input[name="uso"]:checked')?.value;
  const fields = document.getElementById('empresa-fields');
  if (fields) fields.style.display = uso === 'empresa' ? 'block' : 'none';
}

function toggleEmpresaFields() {
  toggleEmpresaFields2();
}

function linkDevice() {
  const codeInput = document.getElementById('device-code');
  const status = document.getElementById('device-status');
  if (!codeInput || !status) return;
  const code = codeInput.value.trim();
  if (!code) {
    status.innerHTML = '<span style="color:var(--red)">Por favor ingresa el código del dispositivo.</span>';
    return;
  }
  if (code.match(/^SG-[A-Z0-9]{4}-[A-Z0-9]{4}$/i)) {
    status.innerHTML = '<span style="color:var(--green)">✓ Dispositivo ' + code.toUpperCase() + ' vinculado correctamente.</span>';
    showToast('Dispositivo vinculado con éxito.', 'success');
  } else {
    status.innerHTML = '<span style="color:var(--yellow)">⚠ Código inválido. Formato esperado: SG-XXXX-XXXX</span>';
  }
}

// ============================================================
// TEMPORIZADOR
// ============================================================
let timerInterval = null;

function startTimer() {
  if (!document.getElementById('timer-display')) return;
  timerInterval = setInterval(() => {
    if (!APP.timerRunning) return;
    APP.timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const duration = formatDuration(APP.timerSeconds);
  const el = document.getElementById('timer-display');
  if (el) el.textContent = duration.time;
  const statTime = document.getElementById('stat-time');
  if (statTime) statTime.textContent = duration.compact;
  if (APP.user) setText('pf-tiempo', duration.compact);
}

function toggleTimer() {
  if (isPage('dashboard')) {
    loadDashboardData();
    showToast('Panel actualizado.', 'info');
    return;
  }
  APP.timerRunning = !APP.timerRunning;
  const btn = document.getElementById('timer-btn');
  if (btn) btn.textContent = APP.timerRunning ? '■ Pausar' : '▶ Reanudar';
  showToast(APP.timerRunning ? 'Monitoreo reanudado.' : 'Monitoreo pausado.', 'info');
}

// ============================================================
// SIMULACIÓN UV EN TIEMPO REAL
// ============================================================
function startUVSimulation() {
  if (!document.getElementById('dosis-val')) return;
  setInterval(() => {
    // Simular variación UV
    const delta = (Math.random() - 0.5) * 0.3;
    APP.uvValue = Math.max(1, Math.min(11, APP.uvValue + delta));
    APP.dosis = Math.min(450, APP.dosis + (APP.timerRunning ? 0.08 : 0));
    updateDashboard();
    updateGaugeData();
  }, 2000);
}

function updateDashboard() {
  // UV gauge value
  const uvEl = document.getElementById('uv-gauge-val');
  const heroUV = document.getElementById('hero-uv');
  if (uvEl) uvEl.textContent = APP.uvValue.toFixed(1);
  if (heroUV) heroUV.textContent = APP.uvValue.toFixed(1);

  // Dosis
  const dosisEl = document.getElementById('dosis-val');
  if (dosisEl) dosisEl.textContent = Math.round(APP.dosis);

  // Progress bar
  const bar = document.getElementById('dosis-bar');
  if (bar) {
    const pct = Math.min(100, (APP.dosis / 400) * 100);
    bar.style.width = pct + '%';
    if (APP.dosis >= 400) {
      bar.style.background = 'linear-gradient(90deg, #2E7D32, #F9A825, #D32F2F)';
    } else if (APP.dosis >= 150) {
      bar.style.background = 'linear-gradient(90deg, #2E7D32, #F9A825)';
    } else {
      bar.style.background = '#2E7D32';
    }
  }

  // Semáforo
  updateSemaforo();

  // Badge
  const badge = document.querySelector('.dash-card-badge.warn');
  if (badge) badge.textContent = getEstado();

  // Stats
  const statMax = document.getElementById('stat-max');
  if (statMax && APP.uvValue > parseFloat(statMax.textContent)) {
    statMax.textContent = APP.uvValue.toFixed(1);
  }
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = value => String(value).padStart(2, '0');
  return {
    time: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    compact: `${hours}h ${pad(minutes)}m`,
  };
}

function updateSemaforo() {
  const green = document.getElementById('sf-green');
  const yellow = document.getElementById('sf-yellow');
  const red = document.getElementById('sf-red');
  const label = document.getElementById('semaforo-label');
  const badge = document.querySelector('#modal-login + * .dash-card-badge.warn');

  if (!green || !yellow || !red) return;

  green.classList.remove('active');
  yellow.classList.remove('active');
  red.classList.remove('active');

  if (APP.dosis < 150) {
    green.classList.add('active');
    if (label) { label.textContent = 'SEGURO'; label.style.color = 'var(--green)'; }
    updateHeroLEDs('green');
  } else if (APP.dosis < 400) {
    yellow.classList.add('active');
    if (label) { label.textContent = 'PRECAUCIÓN'; label.style.color = 'var(--yellow)'; }
    updateHeroLEDs('yellow');
  } else {
    red.classList.add('active');
    if (label) { label.textContent = '⚠ RIESGO'; label.style.color = 'var(--red)'; }
    updateHeroLEDs('red');
  }
}

function updateHeroLEDs(state) {
  const g = document.querySelector('.led-green');
  const y = document.querySelector('.led-yellow');
  const r = document.querySelector('.led-red');
  if (!g || !y || !r) return;
  g.classList.remove('active'); y.classList.remove('active'); r.classList.remove('active');
  if (state === 'green') g.classList.add('active');
  else if (state === 'yellow') y.classList.add('active');
  else r.classList.add('active');
}

function getEstado() {
  if (APP.dosis < 150) return 'SEGURO';
  if (APP.dosis < 400) return 'PRECAUCIÓN';
  return 'RIESGO';
}

function updateGaugeData() {
  const arc = document.getElementById('gauge-arc');
  if (!arc) return;
  const total = 219.9;
  const fraction = APP.uvValue / 11;
  const offset = total * (1 - fraction);
  arc.style.strokeDashoffset = offset;
}

function clearDashboardData() {
  setText('uv-gauge-val', '—');
  setText('dosis-val', '—');
  setText('semaforo-label', 'Sin sesión');
  setText('stat-prom', '—');
  setText('stat-max', '—');
  setText('stat-min', '—');
  setText('stat-time', '—');
  setText('timer-display', '00:00:00');
  const bar = document.getElementById('dosis-bar');
  if (bar) bar.style.width = '0%';
  const badge = document.querySelector('.dash-card-badge.warn');
  if (badge) badge.textContent = 'SIN SESIÓN';
  const alerts = document.querySelector('.alerts-list');
  if (alerts) alerts.innerHTML = '<div class="alert-item level-safe"><span class="alert-msg">Inicia sesión para cargar datos reales.</span></div>';
  const resumen = document.querySelector('.resumen-list');
  if (resumen) resumen.innerHTML = '<div class="resumen-item safe"><span>—</span><span>Sin datos</span></div>';
  const canvas = document.getElementById('uv-chart');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function clearHistorialData() {
  APP.histData = [];
  APP.histPage = 1;
  renderHistorial();
}

async function loadDashboardData() {
  const userId = APP.user?.id;
  if (!userId) {
    clearDashboardData();
    return;
  }

  try {
    const response = await fetch(`/api/dashboard?usuario_id=${encodeURIComponent(userId)}`);
    const data = await response.json();

    if (!response.ok) {
      clearDashboardData();
      showToast(data.error || 'No se pudo cargar el dashboard.', 'error');
      return;
    }

    APP.user = normalizeUser({ ...APP.user, ...data.user });
    APP.uvValue = Number(data.latest?.uv ?? 0);
    APP.dosis = Number(data.latest?.dosis ?? 0);
    APP.timerSeconds = Math.max(0, Math.round(data.stats?.seconds ?? APP.timerSeconds));
    APP.chartData = data.chartData || [];

    setText('uv-gauge-val', data.latest ? APP.uvValue.toFixed(1) : '—');
    setText('dosis-val', data.latest ? Math.round(APP.dosis) : '—');
    setText('stat-prom', data.stats?.promedio || '—');
    setText('stat-max', data.stats?.maximo || '—');
    setText('stat-min', data.stats?.minimo || '—');
    setText('stat-time', data.stats?.tiempo || '—');
    setText('timer-display', formatDuration(APP.timerSeconds).time);

    const badge = document.querySelector('.dash-card-badge.warn');
    if (badge) badge.textContent = data.latest?.estado || 'SEGURO';

    const semaforo = document.getElementById('semaforo-label');
    if (semaforo) {
      semaforo.textContent = data.latest?.estado || 'SEGURO';
      semaforo.style.color = data.latest?.estado === 'RIESGO' ? 'var(--red)' : data.latest?.estado === 'PRECAUCIÓN' ? 'var(--yellow)' : 'var(--green)';
    }

    const bar = document.getElementById('dosis-bar');
    if (bar) {
      const pct = Math.min(100, (APP.dosis / 400) * 100);
      bar.style.width = `${pct}%`;
      if (APP.dosis >= 400) {
        bar.style.background = 'linear-gradient(90deg, #2E7D32, #F9A825, #D32F2F)';
      } else if (APP.dosis >= 150) {
        bar.style.background = 'linear-gradient(90deg, #2E7D32, #F9A825)';
      } else {
        bar.style.background = '#2E7D32';
      }
    }

    const alerts = document.querySelector('.alerts-list');
    if (alerts) {
      alerts.innerHTML = (data.alerts || []).map(alert => `
        <div class="alert-item level-${alert.state === 'RIESGO' ? 'danger' : 'warn'}">
          <span class="alert-time">${alert.time}</span>
          <span class="alert-msg">${alert.message}</span>
        </div>
      `).join('') || '<div class="alert-item level-safe"><span class="alert-msg">Sin alertas recientes.</span></div>';
    }

    const resumen = document.querySelector('.resumen-list');
    if (resumen) {
      resumen.innerHTML = (data.resumen || []).map(item => `
        <div class="resumen-item ${item.state === 'RIESGO' ? 'warn' : 'safe'}">
          <span>${item.time}</span>
          <span>${item.state} · ${item.label}</span>
        </div>
      `).join('') || '<div class="resumen-item safe"><span>—</span><span>Sin datos suficientes</span></div>';
    }

    if (APP.chartData.length > 1) {
      const canvas = document.getElementById('uv-chart');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        renderChart(ctx, canvas);
      }
    }

    updateUIForUser();
  } catch (error) {
    clearDashboardData();
    showToast('Error al cargar el dashboard.', 'error');
  }
}

async function loadHistorialData() {
  const userId = APP.user?.id;
  if (!userId) {
    clearHistorialData();
    return;
  }

  try {
    const response = await fetch(`/api/historial?usuario_id=${encodeURIComponent(userId)}`);
    const data = await response.json();

    if (!response.ok) {
      APP.histData = [];
      renderHistorial();
      showToast(data.error || 'No se pudo cargar el historial.', 'error');
      return;
    }

    APP.histData = (data.historial || []).map(row => ({
      fecha: row.fecha,
      hora: row.hora,
      uv: Number(row.uv),
      dosis: Number(row.dosis),
      estado: row.estado,
      tiempo: row.tiempo,
    }));
    APP.histPage = 1;
    renderHistorial();
  } catch (error) {
    APP.histData = [];
    renderHistorial();
    showToast('Error al cargar el historial.', 'error');
  }
}

// ============================================================
// GRÁFICO CANVAS (mini chart)
// ============================================================
function drawChart() {
  const canvas = document.getElementById('uv-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Generate synthetic 8-hour data
  APP.chartData = [];
  const hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00'];
  const vals = [2.1, 4.5, 6.8, 8.2, 9.1, 7.4, 5.6, 6.2];
  hours.forEach((h, i) => APP.chartData.push({ t: h, v: vals[i] }));

  renderChart(ctx, canvas);

  // Update chart every 5s
  setInterval(() => {
    APP.chartData.push({ t: 'ahora', v: APP.uvValue });
    if (APP.chartData.length > 20) APP.chartData.shift();
    renderChart(ctx, canvas);
  }, 5000);
}

function renderChart(ctx, canvas) {
  const w = canvas.parentElement.offsetWidth - 48;
  const h = 120;
  canvas.width = w;
  canvas.height = h;
  ctx.clearRect(0, 0, w, h);

  const data = APP.chartData;
  if (data.length < 2) return;

  const maxV = 11;
  const padX = 40, padY = 12;
  const cw = w - padX * 2;
  const ch = h - padY * 2;

  // Grid lines
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(30,136,229,0.08)' : 'rgba(30,136,229,0.08)';
  const textColor = isDark ? 'rgba(240,244,255,0.4)' : 'rgba(100,120,160,0.6)';

  for (let i = 0; i <= 4; i++) {
    const y = padY + (ch / 4) * i;
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.moveTo(padX, y);
    ctx.lineTo(w - padX, y);
    ctx.stroke();
    const val = Math.round(maxV - (maxV / 4) * i);
    ctx.fillStyle = textColor;
    ctx.font = '9px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(val, padX - 4, y + 3);
  }

  // Area fill
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = padX + (i / (data.length - 1)) * cw;
    const y = padY + ch - (d.v / maxV) * ch;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  const lastX = padX + cw;
  const firstX = padX;
  ctx.lineTo(lastX, padY + ch);
  ctx.lineTo(firstX, padY + ch);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, padY, 0, h);
  grad.addColorStop(0, 'rgba(30,136,229,0.3)');
  grad.addColorStop(1, 'rgba(30,136,229,0.03)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = padX + (i / (data.length - 1)) * cw;
    const y = padY + ch - (d.v / maxV) * ch;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#1E88E5';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dots + labels
  data.forEach((d, i) => {
    const x = padX + (i / (data.length - 1)) * cw;
    const y = padY + ch - (d.v / maxV) * ch;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#1E88E5';
    ctx.fill();
    if (i % 2 === 0 || i === data.length - 1) {
      ctx.fillStyle = textColor;
      ctx.font = '8px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(d.t, x, h - 2);
    }
  });
}

// ============================================================
// SUPERVISOR PANEL
// ============================================================
const FAKE_WORKERS = [
  { nombre: 'Pedro Soto', dosis: 380, estado: 'RIESGO' },
  { nombre: 'María González', dosis: 95, estado: 'SEGURO' },
  { nombre: 'Juan Muñoz', dosis: 220, estado: 'PRECAUCIÓN' },
  { nombre: 'Ana Torres', dosis: 410, estado: 'RIESGO' },
  { nombre: 'Luis Ramírez', dosis: 55, estado: 'SEGURO' },
  { nombre: 'Carmen López', dosis: 175, estado: 'PRECAUCIÓN' },
];

function renderSupervisorPanel() {
  const grid = document.getElementById('team-status-grid');
  if (!grid) return;
  grid.innerHTML = FAKE_WORKERS.map(w => {
    const color = w.estado === 'SEGURO' ? 'var(--green)' : w.estado === 'PRECAUCIÓN' ? 'var(--yellow)' : 'var(--red)';
    const bg = w.estado === 'SEGURO' ? 'rgba(46,125,50,.1)' : w.estado === 'PRECAUCIÓN' ? 'rgba(249,168,37,.1)' : 'rgba(211,47,47,.1)';
    return `
      <div class="team-status-card">
        <div class="ts-name">${w.nombre}</div>
        <div class="ts-dosis">${w.dosis} J/m²</div>
        <span class="ts-badge" style="background:${bg};color:${color};border:1px solid ${color}">${w.estado}</span>
      </div>`;
  }).join('');
}

// ============================================================
// HISTORIAL
// ============================================================
function generateHistorialData() {
  const hoy = new Date();
  APP.histData = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - Math.floor(i / 4));
    const h = 8 + Math.floor(Math.random() * 8);
    const m = Math.floor(Math.random() * 60);
    const uv = parseFloat((2 + Math.random() * 9).toFixed(1));
    const dosis = Math.round(uv * (30 + Math.random() * 50));
    let estado = 'SEGURO';
    if (dosis >= 150) estado = 'PRECAUCIÓN';
    if (dosis >= 400) estado = 'RIESGO';
    const horas = Math.floor(Math.random() * 6 + 1);
    const mins = Math.floor(Math.random() * 60);
    APP.histData.push({
      fecha: d.toLocaleDateString('es-CL'),
      hora: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
      uv,
      dosis,
      estado,
      tiempo: `${horas}h ${String(mins).padStart(2,'0')}m`
    });
  }
}

function filterHistorial() {
  const search = document.getElementById('hist-search');
  const filter = document.getElementById('hist-filter');
  APP.histFilter.text = search ? search.value.toLowerCase() : '';
  APP.histFilter.estado = filter ? filter.value : '';
  APP.histPage = 1;
  renderHistorial();
}

function sortHistorial(col) {
  if (APP.histSort.col === col) {
    APP.histSort.dir = APP.histSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    APP.histSort.col = col;
    APP.histSort.dir = 'desc';
  }
  renderHistorial();
}

function histPage(dir) {
  const filtered = getFilteredHist();
  const pages = Math.max(1, Math.ceil(filtered.length / APP.histPerPage));
  APP.histPage = Math.max(1, Math.min(pages, APP.histPage + dir));
  renderHistorial();
}

function getFilteredHist() {
  return APP.histData.filter(r => {
    const matchText = !APP.histFilter.text ||
      r.fecha.includes(APP.histFilter.text) ||
      r.estado.toLowerCase().includes(APP.histFilter.text);
    const matchEstado = !APP.histFilter.estado || r.estado === APP.histFilter.estado;
    return matchText && matchEstado;
  }).sort((a, b) => {
    const col = APP.histSort.col;
    const dir = APP.histSort.dir === 'asc' ? 1 : -1;
    if (a[col] < b[col]) return -dir;
    if (a[col] > b[col]) return dir;
    return 0;
  });
}

function renderHistorial() {
  const filtered = getFilteredHist();
  const start = (APP.histPage - 1) * APP.histPerPage;
  const page = filtered.slice(start, start + APP.histPerPage);
  const tbody = document.getElementById('historial-tbody');
  const pages = Math.max(1, Math.ceil(filtered.length / APP.histPerPage));

  if (!tbody) return;

  if (page.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">No se encontraron registros.</td></tr>';
  } else {
    tbody.innerHTML = page.map(r => {
      const cls = r.estado === 'SEGURO' ? 'safe' : r.estado === 'PRECAUCIÓN' ? 'warn' : 'danger';
      return `<tr>
        <td>${r.fecha}</td>
        <td>${r.hora}</td>
        <td>${r.uv}</td>
        <td>${r.dosis}</td>
        <td><span class="hist-badge ${cls}">${r.estado}</span></td>
        <td>${r.tiempo}</td>
      </tr>`;
    }).join('');
  }

  setText('hist-page-info', `Página ${APP.histPage} de ${pages}`);
  const prev = document.getElementById('hist-prev');
  const next = document.getElementById('hist-next');
  if (prev) prev.disabled = APP.histPage <= 1;
  if (next) next.disabled = APP.histPage >= pages;
}

function exportCSV() {
  const data = getFilteredHist();
  const rows = [
    ['Fecha','Hora','Índice UV','Dosis (J/m²)','Estado','Tiempo Exposición'],
    ...data.map(r => [r.fecha, r.hora, r.uv, r.dosis, r.estado, r.tiempo])
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'sunguard_historial.csv';
  a.click(); URL.revokeObjectURL(url);
  showToast('Historial exportado como CSV.', 'success');
}

// ============================================================
// CONTACTO
// ============================================================
function submitContacto(e) {
  e.preventDefault();
  const nombre = document.getElementById('c-nombre')?.value || 'Usuario';
  showToast(`Mensaje enviado, ${nombre}. Te contactaremos pronto.`, 'success');
  e.target.reset();
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['login', 'registro', 'perfil'].forEach(id => closeModal(id));
  }
});

// ============================================================
// RE-RENDER CHART ON RESIZE
// ============================================================
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const canvas = document.getElementById('uv-chart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      renderChart(ctx, canvas);
    }
  }, 200);
});

// ESTO "ENCHUFA" EL BOTÓN CUANDO LA PÁGINA CARGA
document.addEventListener('DOMContentLoaded', () => {
    console.log("Analizando DOM para conectar eventos...");
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', doLogin);
  }
    const formRegistro = document.getElementById('form-registro');
    
    if (formRegistro) {
    formRegistro.addEventListener('submit', doRegistro);
        console.log("✅ Formulario de registro conectado al JS.");
    } else {
        console.error("❌ ERROR: No se encontró '<form id=\"form-registro\">' en el HTML.");
    }
});
/* ============================================================
   MAXX VEÍCULOS — LOGIN.JS
   Login real Supabase Auth · Partículas
   ============================================================ */

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const loginBtn = document.getElementById('loginBtn');
const loginAlert = document.getElementById('loginAlert');
const loginAlertText = document.getElementById('loginAlertText');

const supabaseClient = window.MAXX_SUPABASE;

function showLoginError(message) {
  loginAlertText.textContent = message;
  loginAlert.classList.remove('show');
  void loginAlert.offsetWidth;
  loginAlert.classList.add('show');
}

function hideLoginError() {
  loginAlert.classList.remove('show');
}

async function verificarSessaoAtual() {
  if (!supabaseClient) return;

  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    window.location.href = 'admin.html';
  }
}

passwordToggle?.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';

  passwordInput.type = isPassword ? 'text' : 'password';
  passwordToggle.textContent = isPassword ? '🙈' : '👁';
  passwordToggle.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!supabaseClient) {
    showLoginError('Supabase não carregou. Verifique os scripts no login.html.');
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  hideLoginError();

  if (!email || !password) {
    showLoginError('Preencha e-mail e senha para acessar o painel.');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.classList.add('loading');

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    loginBtn.disabled = false;
    loginBtn.classList.remove('loading');

    passwordInput.value = '';
    passwordInput.focus();

    showLoginError('E-mail ou senha incorretos.');
    return;
  }

  loginBtn.classList.remove('loading');
  loginBtn.textContent = 'Acesso liberado';

  setTimeout(() => {
    window.location.href = 'admin.html';
  }, 450);
});

verificarSessaoAtual();

/* ==================== PARTÍCULAS ==================== */

const canvas = document.getElementById('loginParticles');
const ctx = canvas?.getContext('2d');

if (canvas && ctx) {
  let width = 0;
  let height = 0;
  const particles = [];

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles.length = 0;

    const total = window.innerWidth < 768 ? 34 : 72;

    for (let i = 0; i < total; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.45 + 0.08
      });
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = '#ff3b2f';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  createParticles();
  drawParticles();

  window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
  });
}
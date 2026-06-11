/* ============================================================
   MAXX VEÍCULOS — MAIN.JS
   Funções globais · Navbar · WhatsApp · Reveal · Cards
   ============================================================ */

const MAXX = {
  STORAGE_KEY: 'maxx-veiculos-estoque',

  WHATSAPP: '5515997837725',

  formatMoney(valor) {
    const numero = Number(valor || 0);

    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  },

  onlyNumbers(valor) {
    return String(valor || '').replace(/\D/g, '');
  },

  esc(valor) {
    return String(valor ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  },

  getVehicles() {
    const dados = localStorage.getItem(this.STORAGE_KEY);

    if (!dados) {
      return [];
    }

    try {
      const lista = JSON.parse(dados);
      return Array.isArray(lista) ? lista : [];
    } catch (erro) {
      console.error('Erro ao ler veículos do localStorage:', erro);
      return [];
    }
  },

  saveVehicles(lista) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista || []));
  },

  getAvailableVehicles() {
    return this.getVehicles().filter((veiculo) => {
      return String(veiculo.status || 'disponivel') === 'disponivel';
    });
  },

  getVehicleImage(veiculo) {
    if (veiculo?.imagem) {
      return veiculo.imagem;
    }

    if (Array.isArray(veiculo?.fotos) && veiculo.fotos.length > 0) {
      return veiculo.fotos[0];
    }

    return 'static/img/sem-foto.jpg';
  },

  waLink(mensagem = 'Olá! Vim pelo site da Maxx Veículos.') {
    const telefone = this.onlyNumbers(this.WHATSAPP);
    return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  },

  skeletons(qtd = 3) {
    return Array.from({ length: qtd }).map(() => `
      <div class="skel">
        <div class="skel-img"></div>
        <div class="skel-body">
          <div class="skel-line" style="width:40%"></div>
          <div class="skel-line" style="width:80%"></div>
          <div class="skel-line" style="width:65%"></div>
          <div class="skel-line" style="width:45%"></div>
        </div>
      </div>
    `).join('');
  },

  cardHTML(veiculo) {
    const id = this.esc(veiculo.id);
    const marca = this.esc(veiculo.marca || 'Marca');
    const modelo = this.esc(veiculo.modelo || 'Modelo');
    const ano = this.esc(veiculo.ano || veiculo.anoFab || veiculo.ano_fab || '—');
    const km = Number(veiculo.km || 0).toLocaleString('pt-BR');
    const cambio = this.esc(veiculo.cambio || '—');
    const combustivel = this.esc(veiculo.combustivel || '—');
    const preco = this.formatMoney(veiculo.preco || 0);
    const imagem = this.esc(this.getVehicleImage(veiculo));

    const mensagem = `Olá! Tenho interesse no veículo ${marca} ${modelo}.`;

    return `
      <article class="v-card">
        <a href="veiculo.html?id=${id}" class="v-card-media">
          <img src="${imagem}" alt="${marca} ${modelo}" loading="lazy">

          <div class="v-card-chips">
            <span class="chip chip-primary">Disponível</span>
          </div>

          <span class="v-card-photos">Fotos</span>
        </a>

        <div class="v-card-body">
          <div class="v-card-brand">${marca}</div>

          <h3 class="v-card-name">${modelo}</h3>

          <ul class="v-card-specs">
            <li>Ano <b>${ano}</b></li>
            <li>KM <b>${km}</b></li>
            <li>Câmbio <b>${cambio}</b></li>
            <li>Comb. <b>${combustivel}</b></li>
          </ul>

          <div class="v-card-foot">
            <div class="v-price">
              <small>Valor</small>
              <strong>${preco}</strong>
              <span>Consulte condições</span>
            </div>

            <div class="v-card-actions">
              <a class="icon-btn" href="veiculo.html?id=${id}" aria-label="Ver detalhes">→</a>
              <a class="icon-btn wa" href="${this.waLink(mensagem)}" target="_blank" rel="noopener" aria-label="WhatsApp">☎</a>
            </div>
          </div>
        </div>
      </article>
    `;
  },

  initNavbar() {
    const navbar = document.getElementById('navbar');
    const burger = document.getElementById('navBurger');
    const mobile = document.getElementById('navMobile');

    const updateNavbar = () => {
      if (!navbar) return;

      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    updateNavbar();
    window.addEventListener('scroll', updateNavbar);

    if (burger && mobile) {
      burger.addEventListener('click', () => {
        mobile.classList.toggle('open');
      });

      mobile.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          mobile.classList.remove('open');
        });
      });
    }
  },

  initWhatsApp() {
    document.querySelectorAll('[data-wa]').forEach((item) => {
      const mensagem = item.getAttribute('data-wa') || 'Olá! Vim pelo site da Maxx Veículos.';
      item.setAttribute('href', this.waLink(mensagem));
      item.setAttribute('target', '_blank');
      item.setAttribute('rel', 'noopener');
    });
  },

  initReveal(context = document) {
    const elementos = context.querySelectorAll('.reveal');

    if (!elementos.length) return;

    if (!('IntersectionObserver' in window)) {
      elementos.forEach((el) => el.classList.add('in'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12
    });

    elementos.forEach((el) => observer.observe(el));
  },

  init() {
    this.initNavbar();
    this.initWhatsApp();
    this.initReveal();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MAXX.init();
});
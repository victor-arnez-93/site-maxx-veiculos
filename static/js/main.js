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

    if (!dados) return [];

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
      return veiculo.ativo !== false && veiculo.vendido !== true;
    });
  },

  getVehicleImage(veiculo) {
    const SUPABASE_URL = 'https://anwcdznwsgwtprvqofps.supabase.co';
    const BUCKET = 'veiculos';

    function resolverImagem(valor) {
      if (!valor) return '';

      const img = String(valor).trim();

      if (img.startsWith('http')) return img;
      if (img.startsWith('static/')) return img;
      if (img.startsWith('data:')) return img;

      return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${img}`;
    }

    if (veiculo?.foto_capa) {
      return resolverImagem(veiculo.foto_capa);
    }

    if (Array.isArray(veiculo?.galeria) && veiculo.galeria.length > 0) {
      return resolverImagem(veiculo.galeria[0]);
    }

    if (veiculo?.imagem) {
      return resolverImagem(veiculo.imagem);
    }

    if (Array.isArray(veiculo?.fotos) && veiculo.fotos.length > 0) {
      return resolverImagem(veiculo.fotos[0]);
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

    const marcaRaw = veiculo.marca || 'Marca';
    const modeloRaw = veiculo.modelo || 'Modelo';
    const versaoRaw = veiculo.versao || '';

    const marca = this.esc(marcaRaw);
    const modelo = this.esc(modeloRaw);
    const versao = this.esc(versaoRaw);

    const ano = this.esc(veiculo.ano || '—');
    const km = Number(veiculo.km || 0).toLocaleString('pt-BR');
    const cambio = this.esc(veiculo.cambio || '—');
    const combustivel = this.esc(veiculo.combustivel || '—');
    const preco = this.formatMoney(veiculo.preco || 0);
    const imagem = this.esc(this.getVehicleImage(veiculo));

    const vendido = veiculo.vendido === true;
    const statusClasse = vendido ? 'chip-sold' : 'chip-available';
    const statusTexto = vendido ? 'Vendido' : 'Disponível';

    const nomeCompleto = `${marcaRaw} ${modeloRaw} ${versaoRaw} ${ano}`.trim();

    const mensagem = `Olá! Tenho interesse nesse veículo: ${nomeCompleto}. Ainda está disponível?`;

    return `
      <article class="v-card">
        <button class="v-card-media btn-quick-view" type="button" data-id="${id}">
          <img
            src="${imagem}"
            alt="${marca} ${modelo}"
            loading="lazy"
            onerror="this.onerror=null;this.src='static/img/sem-foto.jpg';"
          >

          <span class="v-card-photos">Fotos</span>
        </button>

        <div class="v-card-body">
          <div class="v-card-head">
          <div class="v-card-brand">${marca}</div>

          <span class="v-card-badge ${statusClasse}">
            ${statusTexto}
          </span>
        </div>

          <h3 class="v-card-name">
            ${modelo}
            ${versao ? `<small>${versao}</small>` : ''}
          </h3>

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
                <button
                  class="icon-btn btn-details btn-quick-view"
                  type="button"
                  data-id="${id}"
                  aria-label="Ver detalhes"
                  title="Ver detalhes"
                >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5c5.05 0 9.27 4.12 10.65 6.43a1.1 1.1 0 0 1 0 1.14C21.27 14.88 17.05 19 12 19S2.73 14.88 1.35 12.57a1.1 1.1 0 0 1 0-1.14C2.73 9.12 6.95 5 12 5Zm0 2C7.95 7 4.54 10.08 3.4 12c1.14 1.92 4.55 5 8.6 5s7.46-3.08 8.6-5C19.46 10.08 16.05 7 12 7Zm0 2.25A2.75 2.75 0 1 1 12 14.75 2.75 2.75 0 0 1 12 9.25Zm0 2A.75.75 0 1 0 12 12.75.75.75 0 0 0 12 11.25Z"/>
                </svg>
              </button>

              <a
                class="icon-btn wa"
                href="${this.waLink(mensagem)}"
                target="_blank"
                rel="noopener"
                aria-label="Chamar no WhatsApp"
                title="Chamar no WhatsApp"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.570-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
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

  initDesktopCarousel() {
    const carousel = document.getElementById('featuredGrid');

    if (!carousel) return;

    let timer = null;
    let paused = false;
    let cloned = false;

    const isDesktop = () => window.matchMedia('(min-width: 769px)').matches;

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const prepareInfiniteLoop = () => {
      if (cloned) return;

      const cards = Array.from(carousel.querySelectorAll('.v-card'));

      if (cards.length <= 3) return;

      cards.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute('data-carousel-clone', 'true');
        carousel.appendChild(clone);
      });

      cloned = true;
    };

    const start = () => {
      stop();

      if (!isDesktop()) return;

      prepareInfiniteLoop();

      timer = setInterval(() => {
        if (paused) return;

        const card = carousel.querySelector('.v-card');

        if (!card) return;

        const gap = 24;
        const step = card.offsetWidth + gap;
        const originalWidth = carousel.scrollWidth / 2;

        if (originalWidth <= carousel.clientWidth) return;

        carousel.scrollBy({
          left: step,
          behavior: 'smooth'
        });

        if (carousel.scrollLeft >= originalWidth) {
          carousel.scrollTo({
            left: carousel.scrollLeft - originalWidth,
            behavior: 'auto'
          });
        }
      }, 4500);
    };

    carousel.addEventListener('mouseenter', () => {
      paused = true;
    });

    carousel.addEventListener('mouseleave', () => {
      paused = false;
    });

    window.addEventListener('resize', start);

    start();
  },

  init() {
    this.initNavbar();
    this.initWhatsApp();
    this.initReveal();
    this.initDesktopCarousel();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MAXX.init();
});
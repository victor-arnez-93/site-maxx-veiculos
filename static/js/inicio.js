/* ============================================================
   MAXX VEÍCULOS — INICIO.JS
   Busca inteligente · Supabase real · Destaques · Contato
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const buscaInput = document.getElementById('sBusca');
  const marcaSelect = document.getElementById('sMarca');
  const modeloSelect = document.getElementById('sModelo');
  const anoSelect = document.getElementById('sAno');
  const precoSelect = document.getElementById('sPreco');
  const combustivelSelect = document.getElementById('sCombustivel');

  const searchForm = document.getElementById('searchForm');
  const featuredGrid = document.getElementById('featuredGrid');
  const featuredPrev = document.getElementById('featuredPrev');
  const featuredNext = document.getElementById('featuredNext');

  const contactForm = document.getElementById('contactForm');

  const searchAlert = document.getElementById('searchAlert');
  const searchAlertClose = document.getElementById('searchAlertClose');

  let veiculos = [];

  init();

  async function init() {
    veiculos = await carregarVeiculos();

    popularBusca();
    renderizarDestaques();
    eventosBusca();
    eventosDestaques();
    eventosContato();
    eventosAlerta();
  }

  function getSupabaseClient() {
    if (window.MAXX_SUPABASE) return window.MAXX_SUPABASE;
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabase && window.supabase.from) return window.supabase;
    return null;
  }

  async function carregarVeiculos() {
    const supabase = getSupabaseClient();

    if (!supabase) {
      console.warn('Supabase não encontrado na home. Usando fallback local.');
      return MAXX.getVehicles ? MAXX.getVehicles() : [];
    }

    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar veículos na home:', error);
      return [];
    }

    return data || [];
  }

  function popularBusca() {
    popularSelect(marcaSelect, 'Todas', getValores('marca'));
    popularSelect(modeloSelect, 'Todos', getValores('modelo'));
    popularSelect(anoSelect, 'Qualquer', getAnos());
    popularSelect(combustivelSelect, 'Qualquer', getValores('combustivel'));
  }

  function getValores(campo) {
    return [...new Set(
      veiculos
        .map(v => v[campo])
        .filter(Boolean)
    )].sort();
  }

  function getAnos() {
    return [...new Set(
      veiculos
        .map(v => Number(v.ano || 0))
        .filter(Boolean)
    )].sort((a, b) => b - a);
  }

  function popularSelect(select, labelInicial, valores) {
    if (!select) return;

    const valorAtual = select.value;

    select.innerHTML = `<option value="">${labelInicial}</option>`;

    valores.forEach((valor) => {
      select.insertAdjacentHTML(
        'beforeend',
        `<option value="${MAXX.esc(valor)}">${MAXX.esc(valor)}</option>`
      );
    });

    if (valorAtual) {
      select.value = valorAtual;
    }
  }

  function atualizarModelosPorMarca() {
    if (!modeloSelect || !marcaSelect) return;

    const marca = marcaSelect.value;

    const modelos = [...new Set(
      veiculos
        .filter(v => !marca || v.marca === marca)
        .map(v => v.modelo)
        .filter(Boolean)
    )].sort();

    popularSelect(modeloSelect, 'Todos', modelos);
  }

  function filtrarBusca() {
    const texto = buscaInput ? buscaInput.value.trim().toLowerCase() : '';
    const marca = marcaSelect ? marcaSelect.value : '';
    const modelo = modeloSelect ? modeloSelect.value : '';
    const ano = anoSelect ? Number(anoSelect.value || 0) : 0;
    const combustivel = combustivelSelect ? combustivelSelect.value : '';
    const preco = precoSelect ? precoSelect.value : '';

    let precoMin = null;
    let precoMax = null;

    if (preco) {
      const partes = preco.split('-');
      precoMin = partes[0] ? Number(partes[0]) : null;
      precoMax = partes[1] ? Number(partes[1]) : null;
    }

    return veiculos.filter((v) => {
      const textoVeiculo = [
        v.marca,
        v.modelo,
        v.versao,
        v.cor,
        v.cambio,
        v.combustivel,
        v.descricao,
        v.opcionais
      ].join(' ').toLowerCase();

      const valor = Number(v.preco || 0);
      const anoVeiculo = Number(v.ano || 0);

      if (texto && !textoVeiculo.includes(texto)) return false;
      if (marca && v.marca !== marca) return false;
      if (modelo && v.modelo !== modelo) return false;
      if (ano && anoVeiculo < ano) return false;
      if (combustivel && v.combustivel !== combustivel) return false;
      if (precoMin !== null && valor < precoMin) return false;
      if (precoMax !== null && valor > precoMax) return false;

      return true;
    });
  }

  function enviarBusca(e) {
    e.preventDefault();

    const resultado = filtrarBusca();

    if (!resultado.length) {
      abrirAlertaBusca();
      return;
    }

    const params = new URLSearchParams();

    if (buscaInput && buscaInput.value.trim()) {
      params.set('q', buscaInput.value.trim());
    }

    if (marcaSelect && marcaSelect.value) {
      params.set('marca', marcaSelect.value);
    }

    if (modeloSelect && modeloSelect.value) {
      params.set('modelo', modeloSelect.value);
    }

    if (anoSelect && anoSelect.value) {
      params.set('ano', anoSelect.value);
    }

    if (combustivelSelect && combustivelSelect.value) {
      params.set('combustivel', combustivelSelect.value);
    }

    if (precoSelect && precoSelect.value) {
      params.set('preco', precoSelect.value);
    }

    window.location.href = `catalogo.html?${params.toString()}`;
  }

  function eventosBusca() {
    if (marcaSelect) {
      marcaSelect.addEventListener('change', atualizarModelosPorMarca);
    }

    if (searchForm) {
      searchForm.addEventListener('submit', enviarBusca);
    }
  }

  function abrirAlertaBusca() {
    if (!searchAlert) return;

    searchAlert.classList.add('open');
    searchAlert.setAttribute('aria-hidden', 'false');
  }

  function fecharAlertaBusca() {
    if (!searchAlert) return;

    searchAlert.classList.remove('open');
    searchAlert.setAttribute('aria-hidden', 'true');
  }

  function eventosAlerta() {
    if (searchAlertClose) {
      searchAlertClose.addEventListener('click', fecharAlertaBusca);
    }

    if (searchAlert) {
      searchAlert.addEventListener('click', (e) => {
        if (e.target === searchAlert) fecharAlertaBusca();
      });
    }
  }

  function renderizarDestaques() {
    if (!featuredGrid) return;

    const destaques = veiculos
      .filter(v => v.destaque === true)
      .slice(0, 8);

    const lista = destaques.length ? destaques : veiculos.slice(0, 8);

    if (!lista.length) {
      featuredGrid.innerHTML = '';
      return;
    }

    featuredGrid.innerHTML = lista.map(v => MAXX.cardHTML(v)).join('');
    MAXX.initReveal(featuredGrid);
  }

  function eventosDestaques() {
    if (!featuredGrid) return;

    featuredGrid.addEventListener('click', (e) => {
      const botao = e.target.closest('.btn-quick-view');

      if (!botao) return;

      e.preventDefault();

      const id = botao.dataset.id;
      const veiculo = veiculos.find(v => String(v.id) === String(id));

      if (!veiculo) return;

      abrirModalVeiculo(veiculo);
    });

    if (featuredPrev) {
      featuredPrev.addEventListener('click', () => {
        featuredGrid.scrollBy({
          left: -featuredGrid.clientWidth,
          behavior: 'smooth'
        });
      });
    }

    if (featuredNext) {
      featuredNext.addEventListener('click', () => {
        featuredGrid.scrollBy({
          left: featuredGrid.clientWidth,
          behavior: 'smooth'
        });
      });
    }
  }

  function abrirModalVeiculo(veiculo) {
    const imagem = MAXX.getVehicleImage(veiculo);
    const nome = `${veiculo.marca || ''} ${veiculo.modelo || ''} ${veiculo.versao || ''}`.trim();
    const ano = veiculo.ano || '—';
    const km = Number(veiculo.km || 0).toLocaleString('pt-BR');
    const preco = MAXX.formatMoney(veiculo.preco || 0);

    const galeria = Array.isArray(veiculo.galeria) && veiculo.galeria.length
      ? veiculo.galeria
      : [imagem];

    const mensagem = `Olá! Tenho interesse nesse veículo: ${nome} ${ano}. Ainda está disponível?`;

    const modalExistente = document.getElementById('quickVehicleModal');
    if (modalExistente) modalExistente.remove();

    document.body.insertAdjacentHTML('beforeend', `
      <div class="quick-modal" id="quickVehicleModal">
        <div class="quick-modal-box">
          <button class="quick-modal-close" type="button" id="closeQuickModal">×</button>

          <div class="quick-modal-photo">
            <img id="quickMainImage" src="${MAXX.esc(imagem)}" alt="${MAXX.esc(nome)}">
          </div>

          <div class="quick-modal-info">
            <div class="quick-modal-head">
              <span>${MAXX.esc(veiculo.marca || '')}</span>
              <h2>${MAXX.esc(nome)}</h2>
            </div>

            <div class="quick-modal-specs">
              <div><small>Ano</small><strong>${ano}</strong></div>
              <div><small>KM</small><strong>${km}</strong></div>
              <div><small>Câmbio</small><strong>${MAXX.esc(veiculo.cambio || '—')}</strong></div>
              <div><small>Combustível</small><strong>${MAXX.esc(veiculo.combustivel || '—')}</strong></div>
              <div><small>Cor</small><strong>${MAXX.esc(veiculo.cor || '—')}</strong></div>
            </div>

            <div class="quick-modal-price">
              <small>Valor</small>
              <strong>${preco}</strong>
            </div>

            ${veiculo.descricao ? `
              <div class="quick-modal-section">
                <h3>Descrição</h3>
                <p>${MAXX.esc(veiculo.descricao)}</p>
              </div>
            ` : ''}

            ${veiculo.opcionais ? `
              <div class="quick-modal-section">
                <h3>Opcionais</h3>
                <p>${MAXX.esc(veiculo.opcionais)}</p>
              </div>
            ` : ''}

            <div class="quick-gallery">
              ${galeria.map(img => {
                const imgUrl = MAXX.getVehicleImage({ foto_capa: img });
                return `
                  <button class="quick-thumb" type="button" data-img="${MAXX.esc(imgUrl)}">
                    <img src="${MAXX.esc(imgUrl)}" alt="${MAXX.esc(nome)}">
                  </button>
                `;
              }).join('')}
            </div>

            <a class="btn btn-primary quick-modal-cta" href="${MAXX.waLink(mensagem)}" target="_blank" rel="noopener">
              Tenho interesse
            </a>
          </div>
        </div>
      </div>
    `);

    document.getElementById('closeQuickModal').addEventListener('click', fecharModalVeiculo);

    document.querySelectorAll('.quick-thumb').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        document.getElementById('quickMainImage').src = thumb.dataset.img;
      });
    });

    document.getElementById('quickVehicleModal').addEventListener('click', (e) => {
      if (e.target.id === 'quickVehicleModal') fecharModalVeiculo();
    });
  }

  function fecharModalVeiculo() {
    const modal = document.getElementById('quickVehicleModal');
    if (modal) modal.remove();
  }

  function eventosContato() {
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nome = document.getElementById('cNome')?.value.trim() || '';
      const fone = document.getElementById('cFone')?.value.trim() || '';
      const email = document.getElementById('cEmail')?.value.trim() || '';
      const assunto = document.getElementById('cAssunto')?.value || '';
      const veiculo = document.getElementById('cVeiculo')?.value.trim() || '';
      const msg = document.getElementById('cMsg')?.value.trim() || '';

      const mensagem = [
        'Olá! Vim pelo site da Maxx Veículos.',
        '',
        `Nome: ${nome}`,
        `WhatsApp: ${fone}`,
        email ? `E-mail: ${email}` : '',
        `Assunto: ${assunto}`,
        veiculo ? `Veículo de interesse: ${veiculo}` : '',
        '',
        `Mensagem: ${msg}`
      ].filter(Boolean).join('\n');

      window.open(MAXX.waLink(mensagem), '_blank', 'noopener');
    });
  }
});
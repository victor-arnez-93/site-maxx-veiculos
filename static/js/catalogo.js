/* ============================================================
   MAXX VEÍCULOS — CATALOGO.JS
   Supabase · Filtros · Busca · Ordenação · Renderização
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('stockGrid');

  const filtersCard = document.getElementById('filtersCard');
  const openFilters = document.getElementById('openFilters');
  const closeFilters = document.getElementById('closeFilters');
  const clearFilters = document.getElementById('clearFilters');

  const countNum = document.getElementById('countNum');
  const countLabel = document.getElementById('countLabel');
  const activeChips = document.getElementById('activeChips');

  const filters = {
    busca: document.getElementById('fBusca'),
    marca: document.getElementById('fMarca'),
    modelo: document.getElementById('fModelo'),
    ano: document.getElementById('fAno'),
    preco: document.getElementById('fPreco'),
    cambio: document.getElementById('fCambio'),
    combustivel: document.getElementById('fCombustivel'),
    ordem: document.getElementById('fOrdem')
  };

  let veiculos = [];

  async function init() {
    if (!grid) return;

    grid.innerHTML = MAXX.skeletons(4);

    veiculos = await carregarVeiculos();

    popularFiltros();
    aplicarParametrosUrl();
    renderizar();

    adicionarEventos();
  }

  async function carregarVeiculos() {
    const supabase = getSupabaseClient();

    if (!supabase) {
      console.warn('Supabase não encontrado. Usando MAXX.getVehicles() como fallback.');
      return normalizarLista(MAXX.getVehicles ? MAXX.getVehicles() : []);
    }

    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .eq('ativo', true)
      .eq('vendido', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar veículos do Supabase:', error);
      grid.innerHTML = `
        <div class="empty-state">
          <h3>Erro ao carregar veículos</h3>
          <p>Verifique a conexão com o Supabase e as policies da tabela.</p>
        </div>
      `;
      return [];
    }

    return normalizarLista(data || []);
  }

  function getSupabaseClient() {
    if (window.MAXX_SUPABASE) return window.MAXX_SUPABASE;
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabase && window.supabase.from) return window.supabase;
    return null;
  }

  function normalizarLista(lista) {
    return lista.map((v) => ({
      id: v.id,

      marca: v.marca || '',
      modelo: v.modelo || '',
      versao: v.versao || '',

      ano: Number(v.ano || 0),
      km: Number(v.km || 0),

      cambio: v.cambio || '',
      combustivel: v.combustivel || '',
      cor: v.cor || '',

      preco: Number(v.preco || 0),

      descricao: v.descricao || '',
      opcionais: v.opcionais || '',

      ativo: v.ativo !== false,
      destaque: v.destaque === true,
      vendido: v.vendido === true,

      foto_capa: v.foto_capa || '',
      galeria: Array.isArray(v.galeria) ? v.galeria : [],

      created_at: v.created_at || null,
      updated_at: v.updated_at || null
    }));
  }

  function popularFiltros() {
    const marcas = [...new Set(veiculos.map(v => v.marca).filter(Boolean))].sort();

    const anos = [...new Set(
      veiculos
        .map(v => Number(v.ano || 0))
        .filter(Boolean)
    )].sort((a, b) => b - a);

    filters.marca.innerHTML = '<option value="">Todas</option>';
    filters.modelo.innerHTML = '<option value="">Todos</option>';
    filters.ano.innerHTML = '<option value="">Qualquer</option>';

    marcas.forEach((marca) => {
      filters.marca.insertAdjacentHTML(
        'beforeend',
        `<option value="${MAXX.esc(marca)}">${MAXX.esc(marca)}</option>`
      );
    });

    anos.forEach((ano) => {
      filters.ano.insertAdjacentHTML(
        'beforeend',
        `<option value="${ano}">${ano} ou mais novo</option>`
      );
    });

    popularModelos();
  }

  function popularModelos() {
    const marcaSelecionada = filters.marca.value;
    const modeloAtual = filters.modelo.value;

    const modelos = [...new Set(
      veiculos
        .filter(v => !marcaSelecionada || v.marca === marcaSelecionada)
        .map(v => v.modelo)
        .filter(Boolean)
    )].sort();

    filters.modelo.innerHTML = '<option value="">Todos</option>';

    modelos.forEach((modelo) => {
      const selected = modelo === modeloAtual ? 'selected' : '';

      filters.modelo.insertAdjacentHTML(
        'beforeend',
        `<option value="${MAXX.esc(modelo)}" ${selected}>${MAXX.esc(modelo)}</option>`
      );
    });
  }

  function aplicarParametrosUrl() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('marca')) {
      filters.marca.value = params.get('marca');
      popularModelos();
    }

    if (params.get('modelo')) filters.modelo.value = params.get('modelo');
    if (params.get('ano')) filters.ano.value = params.get('ano');
    if (params.get('preco')) filters.preco.value = params.get('preco');
    if (params.get('cambio')) filters.cambio.value = params.get('cambio');

    if (params.get('comb')) {
      filters.combustivel.value = params.get('comb');
    }

    if (params.get('combustivel')) {
      filters.combustivel.value = params.get('combustivel');
    }

    if (params.get('q')) {
      filters.busca.value = params.get('q');
    }
  }

  function filtrarVeiculos() {
    const busca = filters.busca.value.trim().toLowerCase();
    const marca = filters.marca.value;
    const modelo = filters.modelo.value;
    const anoMinimo = Number(filters.ano.value || 0);
    const preco = filters.preco.value;
    const cambio = filters.cambio.value;
    const combustivel = filters.combustivel.value;

    let precoMinimo = null;
    let precoMaximo = null;

    if (preco) {
      const partes = preco.split('-');
      precoMinimo = partes[0] ? Number(partes[0]) : null;
      precoMaximo = partes[1] ? Number(partes[1]) : null;
    }

    let resultado = veiculos.filter((veiculo) => {
      const texto = [
        veiculo.marca,
        veiculo.modelo,
        veiculo.versao,
        veiculo.cor,
        veiculo.combustivel,
        veiculo.cambio
      ].join(' ').toLowerCase();

      const ano = Number(veiculo.ano || 0);
      const valor = Number(veiculo.preco || 0);

      if (busca && !texto.includes(busca)) return false;
      if (marca && veiculo.marca !== marca) return false;
      if (modelo && veiculo.modelo !== modelo) return false;
      if (anoMinimo && ano < anoMinimo) return false;
      if (cambio && veiculo.cambio !== cambio) return false;
      if (combustivel && veiculo.combustivel !== combustivel) return false;
      if (precoMinimo !== null && valor < precoMinimo) return false;
      if (precoMaximo !== null && valor > precoMaximo) return false;

      return true;
    });

    resultado = ordenarVeiculos(resultado);

    return resultado;
  }

  function ordenarVeiculos(lista) {
    const ordem = filters.ordem.value;

    return [...lista].sort((a, b) => {
      const precoA = Number(a.preco || 0);
      const precoB = Number(b.preco || 0);

      const kmA = Number(a.km || 0);
      const kmB = Number(b.km || 0);

      const anoA = Number(a.ano || 0);
      const anoB = Number(b.ano || 0);

      const dataA = new Date(a.created_at || 0);
      const dataB = new Date(b.created_at || 0);

      switch (ordem) {
        case 'preco-asc':
          return precoA - precoB;

        case 'preco-desc':
          return precoB - precoA;

        case 'km-asc':
          return kmA - kmB;

        case 'ano-desc':
          return anoB - anoA;

        case 'recentes':
        default:
          return dataB - dataA;
      }
    });
  }

  function renderizar() {
    const lista = filtrarVeiculos();

    countNum.textContent = lista.length;
    countLabel.textContent = lista.length === 1
      ? 'veículo encontrado'
      : 'veículos encontrados';

    renderizarChips();

    if (!lista.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>Nenhum veículo encontrado</h3>
          <p>Tente ajustar os filtros ou limpar a busca.</p>
          <button class="btn btn-secondary btn-sm" id="emptyClear" type="button">
            Limpar filtros
          </button>
        </div>
      `;

      document.getElementById('emptyClear').addEventListener('click', limparFiltros);
      return;
    }

    grid.innerHTML = lista.map((veiculo) => MAXX.cardHTML(veiculo)).join('');

    MAXX.initReveal(grid);
  }

  function renderizarChips() {
    const chips = [];

    function add(elemento, label) {
      if (!elemento.value) return;

      chips.push({
        elemento,
        label
      });
    }

    add(filters.busca, `"${filters.busca.value}"`);
    add(filters.marca, filters.marca.value);
    add(filters.modelo, filters.modelo.value);

    if (filters.ano.value) {
      add(filters.ano, `${filters.ano.value}+`);
    }

    if (filters.preco.value) {
      add(filters.preco, filters.preco.options[filters.preco.selectedIndex].text);
    }

    add(filters.cambio, filters.cambio.value);
    add(filters.combustivel, filters.combustivel.value);

    activeChips.innerHTML = chips.map((chip, index) => `
      <button class="active-chip" type="button" data-index="${index}">
        ${MAXX.esc(chip.label)}
        <span>×</span>
      </button>
    `).join('');

    activeChips.querySelectorAll('.active-chip').forEach((botao) => {
      botao.addEventListener('click', () => {
        const index = Number(botao.dataset.index);
        const item = chips[index];

        item.elemento.value = '';

        if (item.elemento === filters.marca) {
          popularModelos();
        }

        renderizar();
      });
    });
  }

  function limparFiltros() {
    filters.busca.value = '';
    filters.marca.value = '';
    filters.modelo.value = '';
    filters.ano.value = '';
    filters.preco.value = '';
    filters.cambio.value = '';
    filters.combustivel.value = '';
    filters.ordem.value = 'recentes';

    popularModelos();
    renderizar();
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

    document.getElementById('closeQuickModal').addEventListener('click', fecharModalRapido);

    document.querySelectorAll('.quick-thumb').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        document.getElementById('quickMainImage').src = thumb.dataset.img;
      });
    });

    document.getElementById('quickVehicleModal').addEventListener('click', (e) => {
      if (e.target.id === 'quickVehicleModal') fecharModalRapido();
    });
  }

  function fecharModalRapido() {
    const modal = document.getElementById('quickVehicleModal');
    if (modal) modal.remove();
  }

function adicionarEventos() {
  let debounceBusca;

  grid.addEventListener('click', (e) => {
    const botao = e.target.closest('.btn-quick-view');

    if (!botao) return;

    e.preventDefault();
    e.stopPropagation();

    const id = botao.dataset.id;
    const veiculo = veiculos.find(v => String(v.id) === String(id));

    if (!veiculo) return;

    abrirModalVeiculo(veiculo);
  });

    filters.busca.addEventListener('input', () => {
      clearTimeout(debounceBusca);
      debounceBusca = setTimeout(renderizar, 180);
    });

    filters.marca.addEventListener('change', () => {
      popularModelos();
      renderizar();
    });

    filters.modelo.addEventListener('change', renderizar);
    filters.ano.addEventListener('change', renderizar);
    filters.preco.addEventListener('change', renderizar);
    filters.cambio.addEventListener('change', renderizar);
    filters.combustivel.addEventListener('change', renderizar);
    filters.ordem.addEventListener('change', renderizar);

    clearFilters.addEventListener('click', limparFiltros);

    if (openFilters && filtersCard) {
      openFilters.addEventListener('click', () => {
        filtersCard.classList.add('open');
      });
    }

    if (closeFilters && filtersCard) {
      closeFilters.addEventListener('click', () => {
        filtersCard.classList.remove('open');
      });
    }
  }

  init();
});
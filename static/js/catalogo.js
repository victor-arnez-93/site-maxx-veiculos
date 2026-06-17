/* ============================================================
   MAXX VEÍCULOS — CATALOGO.JS
   Supabase · Filtros · Busca · Ordenação · Paginação · Modal
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
  let paginaAtual = 1;

  const ITENS_POR_PAGINA_DESKTOP = 6;
  const ITENS_POR_PAGINA_MOBILE = 4;

  async function init() {
    if (!grid) return;

    grid.innerHTML = MAXX.skeletons(6);

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
      status: v.status || (v.vendido === true ? 'vendido' : 'disponivel'),
      vendido: v.status === 'vendido' || v.vendido === true,

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
        veiculo.cambio,
        veiculo.descricao,
        veiculo.opcionais
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

  function getItensPorPagina() {
    return window.innerWidth <= 768
      ? ITENS_POR_PAGINA_MOBILE
      : ITENS_POR_PAGINA_DESKTOP;
  }

  function getTotalPaginas(totalItens) {
    return Math.max(1, Math.ceil(totalItens / getItensPorPagina()));
  }

  function resetarPagina() {
    paginaAtual = 1;
  }

  function renderizar() {
    const lista = filtrarVeiculos();
    const totalPaginas = getTotalPaginas(lista.length);

    if (paginaAtual > totalPaginas) {
      paginaAtual = totalPaginas;
    }

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

      removerPaginacao();

      document.getElementById('emptyClear').addEventListener('click', limparFiltros);
      return;
    }

    const porPagina = getItensPorPagina();
    const inicio = (paginaAtual - 1) * porPagina;
    const fim = inicio + porPagina;
    const pagina = lista.slice(inicio, fim);

    grid.innerHTML = pagina.map((veiculo) => MAXX.cardHTML(veiculo)).join('');

    renderizarPaginacao(lista.length);

    MAXX.initReveal(grid);
  }

  function renderizarPaginacao(totalItens) {
    removerPaginacao();

    const totalPaginas = getTotalPaginas(totalItens);

    if (totalPaginas <= 1) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'catalog-pagination';
    wrapper.id = 'catalogPagination';

    const paginas = Array.from({ length: totalPaginas }).map((_, index) => {
      const numero = index + 1;
      const ativo = numero === paginaAtual ? 'active' : '';

      return `
        <button class="catalog-page-btn ${ativo}" type="button" data-page="${numero}">
          ${numero}
        </button>
      `;
    }).join('');

    wrapper.innerHTML = `
      <button class="catalog-page-nav" type="button" data-page="prev" ${paginaAtual === 1 ? 'disabled' : ''}>
        Anterior
      </button>

      <div class="catalog-page-numbers">
        ${paginas}
      </div>

      <button class="catalog-page-nav" type="button" data-page="next" ${paginaAtual === totalPaginas ? 'disabled' : ''}>
        Próxima
      </button>
    `;

    grid.insertAdjacentElement('afterend', wrapper);

    wrapper.addEventListener('click', (e) => {
      const botao = e.target.closest('[data-page]');
      if (!botao || botao.disabled) return;

      const action = botao.dataset.page;

      if (action === 'prev') {
        paginaAtual = Math.max(1, paginaAtual - 1);
      } else if (action === 'next') {
        paginaAtual = Math.min(totalPaginas, paginaAtual + 1);
      } else {
        paginaAtual = Number(action);
      }

      renderizar();

      document.querySelector('.stock-content')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }

  function removerPaginacao() {
    const paginacao = document.getElementById('catalogPagination');
    if (paginacao) paginacao.remove();
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

        resetarPagina();
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
    resetarPagina();
    renderizar();
  }

let fotosModal = [];
let fotoAtual = 0;

function atualizarFotoModal() {
  const imgModal = document.getElementById('vehicleModalImage');
  const imgLightbox = document.getElementById('vehicleLightboxImage');

  if (!fotosModal.length) return;

  imgModal.src = fotosModal[fotoAtual];

  if (imgLightbox) {
    imgLightbox.src = fotosModal[fotoAtual];
  }

  document.getElementById('vehicleGalleryCounter').textContent =
    `${fotoAtual + 1} / ${fotosModal.length}`;

  document.getElementById('vehicleLightboxCounter').textContent =
    `${fotoAtual + 1} / ${fotosModal.length}`;

  document.querySelectorAll('.vehicle-gallery-thumbs button')
    .forEach((btn, index) => {
      btn.classList.toggle('active', index === fotoAtual);
    });
}

function fecharModalRapido() {
  document.getElementById('vehicleModal')
    ?.classList.remove('open');

  document.getElementById('vehicleLightbox')
    ?.classList.remove('open');

  document.body.style.overflow = '';
}

function abrirModalVeiculo(veiculo) {

  const capa = MAXX.getVehicleImage(veiculo);

  fotosModal = [];

  fotosModal.push(capa);

  if (Array.isArray(veiculo.galeria)) {
    veiculo.galeria.forEach((foto) => {
      const url = MAXX.getVehicleImage({
        foto_capa: foto
      });

      if (!fotosModal.includes(url)) {
        fotosModal.push(url);
      }
    });
  }

  fotoAtual = 0;

  const nome =
    `${veiculo.marca || ''} ${veiculo.modelo || ''}`
      .trim();

  const titulo =
    `${nome} ${veiculo.versao || ''}`
      .trim();

  const mensagem =
    `Olá! Tenho interesse nesse veículo: ${titulo} ${veiculo.ano}. Ainda está disponível?`;

  document.getElementById('vehicleModalBrand').textContent =
    veiculo.marca || '';

  document.getElementById('vehicleModalTitle').textContent =
    nome;

  document.getElementById('vehicleModalVersion').textContent =
    veiculo.versao || '';

  document.getElementById('vehicleModalPrice').textContent =
    MAXX.formatMoney(veiculo.preco || 0);

  document.getElementById('vehicleModalAno').textContent =
    veiculo.ano || '—';

  document.getElementById('vehicleModalKm').textContent =
    Number(veiculo.km || 0).toLocaleString('pt-BR');

  document.getElementById('vehicleModalCambio').textContent =
    veiculo.cambio || '—';

  document.getElementById('vehicleModalCombustivel').textContent =
    veiculo.combustivel || '—';

  document.getElementById('vehicleModalCor').textContent =
    veiculo.cor || '—';

  document.getElementById('vehicleModalDescricao').textContent =
    veiculo.descricao || 'Sem descrição cadastrada.';

  document.getElementById('vehicleModalOpcionais').textContent =
    veiculo.opcionais || 'Consulte os opcionais disponíveis.';

  document.getElementById('vehicleModalWhatsApp').href =
    MAXX.waLink(mensagem);

  const thumbs =
    document.getElementById('vehicleGalleryThumbs');

  thumbs.innerHTML = fotosModal.map((foto, index) => `
    <button
      type="button"
      class="${index === 0 ? 'active' : ''}"
      data-index="${index}"
    >
      <img src="${foto}" alt="">
    </button>
  `).join('');

  thumbs.querySelectorAll('button')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        fotoAtual = Number(btn.dataset.index);
        atualizarFotoModal();
      });
    });

  atualizarFotoModal();

  document.getElementById('vehicleModal')
    .classList.add('open');

  document.body.style.overflow = 'hidden';
}

  function atualizarFiltrosERenderizar() {
    resetarPagina();
    renderizar();
  }

  function adicionarEventos() {
    let debounceBusca;
    let resizeTimer;

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
      debounceBusca = setTimeout(atualizarFiltrosERenderizar, 180);
    });

    filters.marca.addEventListener('change', () => {
      popularModelos();
      atualizarFiltrosERenderizar();
    });

    filters.modelo.addEventListener('change', atualizarFiltrosERenderizar);
    filters.ano.addEventListener('change', atualizarFiltrosERenderizar);
    filters.preco.addEventListener('change', atualizarFiltrosERenderizar);
    filters.cambio.addEventListener('change', atualizarFiltrosERenderizar);
    filters.combustivel.addEventListener('change', atualizarFiltrosERenderizar);

    filters.ordem.addEventListener('change', () => {
      resetarPagina();
      renderizar();
    });

    clearFilters.addEventListener('click', limparFiltros);

    if (openFilters && filtersCard) {
      openFilters.addEventListener('click', () => {
        filtersCard.classList.add('open');
        document.body.classList.add('filters-open');
      });
    }

    if (closeFilters && filtersCard) {
      closeFilters.addEventListener('click', () => {
        filtersCard.classList.remove('open');
        document.body.classList.remove('filters-open');
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;

      filtersCard?.classList.remove('open');
      document.body.classList.remove('filters-open');
      fecharModalRapido();
    });

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        renderizar();
      }, 180);
    });
    document.getElementById('vehicleModalClose')
  ?.addEventListener('click', fecharModalRapido);

document.querySelector('[data-close-modal]')
  ?.addEventListener('click', fecharModalRapido);

document.getElementById('vehicleGalleryPrev')
  ?.addEventListener('click', () => {

    fotoAtual--;

    if (fotoAtual < 0) {
      fotoAtual = fotosModal.length - 1;
    }

    atualizarFotoModal();
  });

document.getElementById('vehicleGalleryNext')
  ?.addEventListener('click', () => {

    fotoAtual++;

    if (fotoAtual >= fotosModal.length) {
      fotoAtual = 0;
    }

    atualizarFotoModal();
  });

document.getElementById('vehicleGalleryOpen')
  ?.addEventListener('click', () => {

    document.getElementById('vehicleLightbox')
      .classList.add('open');

    atualizarFotoModal();
  });

document.getElementById('vehicleLightboxClose')
  ?.addEventListener('click', () => {
    document.getElementById('vehicleLightbox')
      .classList.remove('open');
  });

document.querySelector('[data-close-lightbox]')
  ?.addEventListener('click', () => {
    document.getElementById('vehicleLightbox')
      .classList.remove('open');
  });

document.getElementById('vehicleLightboxPrev')
  ?.addEventListener('click', () => {

    fotoAtual--;

    if (fotoAtual < 0) {
      fotoAtual = fotosModal.length - 1;
    }

    atualizarFotoModal();
  });

document.getElementById('vehicleLightboxNext')
  ?.addEventListener('click', () => {

    fotoAtual++;

    if (fotoAtual >= fotosModal.length) {
      fotoAtual = 0;
    }

    atualizarFotoModal();
  });
  }

  init();
});
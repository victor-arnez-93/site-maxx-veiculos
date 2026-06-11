/* ============================================================
   MAXX VEÍCULOS — ADMIN.JS
   CRUD temporário com localStorage
   Depois trocar por Supabase
   ============================================================ */

const STORAGE_KEY = 'maxx_veiculos';

if (localStorage.getItem('maxx_admin_logado') !== 'true') {
  window.location.href = 'login.html';
}

const logoutBtn = document.getElementById('logoutBtn');
const quickNovoVeiculoBtn = document.getElementById('quickNovoVeiculoBtn');

const veiculoModal = document.getElementById('veiculoModal');
const fecharModalBtn = document.getElementById('fecharModalBtn');
const cancelarBtn = document.getElementById('cancelarBtn');
const veiculoForm = document.getElementById('veiculoForm');

const veiculosTable = document.getElementById('veiculosTable');
const adminEmpty = document.getElementById('adminEmpty');
const buscaAdmin = document.getElementById('buscaAdmin');
const modalTitle = document.getElementById('modalTitle');

const statTotal = document.getElementById('statTotal');
const statDisponiveis = document.getElementById('statDisponiveis');
const statVendidos = document.getElementById('statVendidos');
const statDestaques = document.getElementById('statDestaques');
const statFotos = document.getElementById('statFotos');
const statPrecoMedio = document.getElementById('statPrecoMedio');

const marcaSelect = document.getElementById('marcaSelect');
const modeloSelect = document.getElementById('modeloSelect');
const marcaOutro = document.getElementById('marcaOutro');
const modeloOutro = document.getElementById('modeloOutro');

const anoInput = document.getElementById('ano');
const kmInput = document.getElementById('km');
const precoInput = document.getElementById('preco');

const modelosPorMarca = {
  Chevrolet: ['Onix', 'Onix Plus', 'Tracker', 'Cruze', 'Spin', 'S10', 'Montana', 'Equinox', 'Outros'],
  Volkswagen: ['Gol', 'Polo', 'Virtus', 'T-Cross', 'Nivus', 'Saveiro', 'Jetta', 'Taos', 'Amarok', 'Outros'],
  Fiat: ['Argo', 'Mobi', 'Cronos', 'Pulse', 'Palio', 'Uno', 'Fastback', 'Toro', 'Strada', 'Fiorino', 'Outros'],
  Toyota: ['Corolla', 'Corolla Cross', 'Hilux', 'SW4', 'Yaris', 'Etios', 'RAV4', 'Outros'],
  Honda: ['Civic', 'City', 'Fit', 'HR-V', 'WR-V', 'CR-V', 'Outros'],
  Hyundai: ['HB20', 'HB20S', 'Creta', 'Tucson', 'Santa Fe', 'Outros'],
  Jeep: ['Renegade', 'Compass', 'Commander', 'Wrangler', 'Outros'],
  Renault: ['Kwid', 'Sandero', 'Logan', 'Duster', 'Oroch', 'Captur', 'Outros'],
  Nissan: ['Kicks', 'Versa', 'Sentra', 'Frontier', 'March', 'Outros'],
  Ford: ['Ka', 'Ka Sedan', 'EcoSport', 'Ranger', 'Territory', 'Fusion', 'Outros'],
  Peugeot: ['208', '2008', '3008', 'Partner', 'Outros'],
  Citroën: ['C3', 'C4 Cactus', 'Aircross', 'Jumpy', 'Outros'],
  Mitsubishi: ['L200 Triton', 'Pajero', 'Outlander', 'ASX', 'Eclipse Cross', 'Outros'],
  Kia: ['Sportage', 'Cerato', 'Sorento', 'Bongo', 'Outros'],
  BMW: ['Série 1', 'Série 3', 'Série 5', 'X1', 'X3', 'X5', 'Outros'],
  'Mercedes-Benz': ['Classe A', 'Classe C', 'Classe E', 'GLA', 'GLC', 'Sprinter', 'Outros'],
  Audi: ['A3', 'A4', 'A5', 'Q3', 'Q5', 'Q7', 'Outros']
};

let veiculos = carregarVeiculos();

/* ==================== MARCA / MODELO ==================== */

function resetarMarcaModelo() {
  marcaSelect.value = '';
  modeloSelect.innerHTML = '<option value="">Selecione a marca primeiro</option>';

  marcaOutro.value = '';
  modeloOutro.value = '';

  marcaOutro.style.display = 'none';
  modeloOutro.style.display = 'none';

  marcaOutro.required = false;
  modeloOutro.required = false;

  marcaSelect.required = true;
  modeloSelect.required = true;
}

function preencherModelos(marca) {
  modeloSelect.innerHTML = '<option value="">Selecione</option>';

  const modelos = modelosPorMarca[marca] || [];

  modelos.forEach((modelo) => {
    const option = document.createElement('option');
    option.value = modelo;
    option.textContent = modelo;
    modeloSelect.appendChild(option);
  });

  modeloOutro.value = '';
  modeloOutro.style.display = 'none';
  modeloOutro.required = false;
}

function obterMarcaAtual() {
  if (marcaSelect.value === 'outros') {
    return marcaOutro.value.trim();
  }

  return marcaSelect.value;
}

function obterModeloAtual() {
  if (modeloSelect.value === 'Outros') {
    return modeloOutro.value.trim();
  }

  return modeloSelect.value;
}

marcaSelect?.addEventListener('change', () => {
  marcaOutro.value = '';
  marcaOutro.style.display = 'none';
  marcaOutro.required = false;

  modeloOutro.value = '';
  modeloOutro.style.display = 'none';
  modeloOutro.required = false;

  if (marcaSelect.value === 'outros') {
    marcaOutro.style.display = 'block';
    marcaOutro.required = true;

    modeloSelect.innerHTML = '<option value="Outros">Outros</option>';
    modeloSelect.value = 'Outros';

    modeloOutro.style.display = 'block';
    modeloOutro.required = true;

    marcaOutro.focus();
    return;
  }

  preencherModelos(marcaSelect.value);
});

modeloSelect?.addEventListener('change', () => {
  modeloOutro.value = '';
  modeloOutro.style.display = 'none';
  modeloOutro.required = false;

  if (modeloSelect.value === 'Outros') {
    modeloOutro.style.display = 'block';
    modeloOutro.required = true;
    modeloOutro.focus();
  }
});

/* ==================== MÁSCARAS ==================== */

function somenteNumeros(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function formatarNumeroBR(valor) {
  const numeros = somenteNumeros(valor);

  if (!numeros) return '';

  return Number(numeros).toLocaleString('pt-BR');
}

function formatarPrecoInput(valor) {
  const numeros = somenteNumeros(valor);

  if (!numeros) return '';

  const centavos = Number(numeros) / 100;

  return centavos.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function converterNumeroBR(valor) {
  return Number(somenteNumeros(valor));
}

function converterPrecoBR(valor) {
  const numeros = somenteNumeros(valor);

  if (!numeros) return 0;

  return Number(numeros) / 100;
}

anoInput?.addEventListener('input', () => {
  anoInput.value = somenteNumeros(anoInput.value).slice(0, 4);
});

kmInput?.addEventListener('input', () => {
  kmInput.value = formatarNumeroBR(kmInput.value);
});

precoInput?.addEventListener('input', () => {
  precoInput.value = formatarPrecoInput(precoInput.value);
});

/* ==================== STORAGE ==================== */

function carregarVeiculos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function salvarVeiculos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(veiculos));
}

/* ==================== FORMATADORES ==================== */

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarKm(valor) {
  return Number(valor || 0).toLocaleString('pt-BR') + ' km';
}

/* ==================== MODAL ==================== */

function abrirModal(veiculo = null) {
  veiculoForm.reset();
  resetarMarcaModelo();

  document.getElementById('veiculoId').value = '';

  if (veiculo) {
    modalTitle.textContent = 'Editar veículo';

    document.getElementById('veiculoId').value = veiculo.id;

    const marcaExiste = !!modelosPorMarca[veiculo.marca];

    if (marcaExiste) {
      marcaSelect.value = veiculo.marca;
      preencherModelos(veiculo.marca);

      if (modelosPorMarca[veiculo.marca].includes(veiculo.modelo)) {
        modeloSelect.value = veiculo.modelo;
      } else {
        modeloSelect.value = 'Outros';
        modeloOutro.style.display = 'block';
        modeloOutro.required = true;
        modeloOutro.value = veiculo.modelo || '';
      }
    } else {
      marcaSelect.value = 'outros';

      marcaOutro.style.display = 'block';
      marcaOutro.required = true;
      marcaOutro.value = veiculo.marca || '';

      modeloSelect.innerHTML = '<option value="Outros">Outros</option>';
      modeloSelect.value = 'Outros';

      modeloOutro.style.display = 'block';
      modeloOutro.required = true;
      modeloOutro.value = veiculo.modelo || '';
    }

    document.getElementById('versao').value = veiculo.versao || '';
    document.getElementById('ano').value = veiculo.ano || '';
    document.getElementById('km').value = formatarNumeroBR(veiculo.km);
    document.getElementById('cambio').value = veiculo.cambio || '';
    document.getElementById('combustivel').value = veiculo.combustivel || '';
    document.getElementById('cor').value = veiculo.cor || '';
    document.getElementById('preco').value = formatarPrecoInput(String(Math.round(Number(veiculo.preco || 0) * 100)));
    document.getElementById('descricao').value = veiculo.descricao || '';
    document.getElementById('opcionais').value = veiculo.opcionais || '';
    document.getElementById('ativo').checked = veiculo.ativo !== false;
    document.getElementById('destaque').checked = !!veiculo.destaque;
    document.getElementById('vendido').checked = !!veiculo.vendido;
  } else {
    modalTitle.textContent = 'Novo veículo';
    document.getElementById('ativo').checked = true;
  }

  veiculoModal.classList.add('open');
}

function fecharModal() {
  veiculoModal.classList.remove('open');
}

/* ==================== FORM ==================== */

function obterDadosFormulario(fotosBase64 = []) {
  const idAtual = document.getElementById('veiculoId').value;
  const existente = veiculos.find((item) => item.id === idAtual);

  const galeriaFinal = fotosBase64.length
    ? fotosBase64
    : existente?.galeria || [];

  return {
    id: idAtual || crypto.randomUUID(),
    marca: obterMarcaAtual(),
    modelo: obterModeloAtual(),
    versao: document.getElementById('versao').value.trim(),
    ano: converterNumeroBR(document.getElementById('ano').value),
    km: converterNumeroBR(document.getElementById('km').value),
    cambio: document.getElementById('cambio').value,
    combustivel: document.getElementById('combustivel').value,
    cor: document.getElementById('cor').value.trim(),
    preco: converterPrecoBR(document.getElementById('preco').value),
    descricao: document.getElementById('descricao').value.trim(),
    opcionais: document.getElementById('opcionais').value.trim(),
    ativo: document.getElementById('ativo').checked,
    destaque: document.getElementById('destaque').checked,
    vendido: document.getElementById('vendido').checked,
    foto_capa: galeriaFinal[0] || '',
    galeria: galeriaFinal,
    atualizado_em: new Date().toISOString()
  };
}

function converterFotosParaBase64(files) {
  const arquivos = Array.from(files || []);

  if (!arquivos.length) {
    return Promise.resolve([]);
  }

  return Promise.all(
    arquivos.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;

      reader.readAsDataURL(file);
    }))
  );
}

/* ==================== RENDER ==================== */

function renderizarVeiculos() {
  const termo = buscaAdmin.value.trim().toLowerCase();

  const filtrados = veiculos.filter((veiculo) => {
    const texto = `${veiculo.marca} ${veiculo.modelo} ${veiculo.versao} ${veiculo.ano}`.toLowerCase();
    return texto.includes(termo);
  });

  veiculosTable.innerHTML = '';
  adminEmpty.style.display = filtrados.length ? 'none' : 'block';

  filtrados.forEach((veiculo) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>
        <div class="admin-car">
          <img class="admin-car-img" src="${veiculo.foto_capa || '../static/img/placeholder-carro.jpg'}" alt="">
          <div>
            <strong>${veiculo.marca} ${veiculo.modelo}</strong>
            <span>${veiculo.versao || 'Sem versão'}</span>
          </div>
        </div>
      </td>

      <td>${veiculo.ano}</td>
      <td>${formatarKm(veiculo.km)}</td>
      <td>${formatarMoeda(veiculo.preco)}</td>
      <td>${veiculo.galeria?.length || 0}</td>

      <td>
        <span class="admin-pill ${veiculo.vendido ? 'off' : 'ok'}">
          ${veiculo.vendido ? 'Vendido' : 'Disponível'}
        </span>
      </td>

      <td>${veiculo.destaque ? 'Sim' : 'Não'}</td>

      <td>
        <div class="admin-actions">
          <button class="admin-icon-btn" onclick="editarVeiculo('${veiculo.id}')" title="Editar">✎</button>
          <button class="admin-icon-btn" onclick="alternarVendido('${veiculo.id}')" title="Vendido">✓</button>
          <button class="admin-icon-btn" onclick="excluirVeiculo('${veiculo.id}')" title="Excluir">×</button>
        </div>
      </td>
    `;

    veiculosTable.appendChild(tr);
  });

  atualizarStats();
}

function atualizarStats() {
  const total = veiculos.length;
  const disponiveis = veiculos.filter((v) => !v.vendido && v.ativo !== false).length;
  const vendidos = veiculos.filter((v) => v.vendido).length;
  const destaques = veiculos.filter((v) => v.destaque).length;

  const totalFotos = veiculos.reduce((soma, veiculo) => {
    return soma + (veiculo.galeria?.length || 0);
  }, 0);

  const somaPrecos = veiculos.reduce((soma, veiculo) => {
    return soma + Number(veiculo.preco || 0);
  }, 0);

  const precoMedio = total ? somaPrecos / total : 0;

  statTotal.textContent = total;
  statDisponiveis.textContent = disponiveis;
  statVendidos.textContent = vendidos;
  statDestaques.textContent = destaques;
  statFotos.textContent = totalFotos;
  statPrecoMedio.textContent = formatarMoeda(precoMedio);
}

/* ==================== AÇÕES ==================== */

function editarVeiculo(id) {
  const veiculo = veiculos.find((item) => item.id === id);

  if (veiculo) {
    abrirModal(veiculo);
  }
}

function alternarVendido(id) {
  veiculos = veiculos.map((veiculo) => {
    if (veiculo.id !== id) return veiculo;

    return {
      ...veiculo,
      vendido: !veiculo.vendido
    };
  });

  salvarVeiculos();
  renderizarVeiculos();
}

function excluirVeiculo(id) {
  const confirmar = confirm('Excluir este veículo?');

  if (!confirmar) return;

  veiculos = veiculos.filter((veiculo) => veiculo.id !== id);

  salvarVeiculos();
  renderizarVeiculos();
}

/* ==================== EVENTOS ==================== */

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('maxx_admin_logado');
  window.location.href = 'login.html';
});

quickNovoVeiculoBtn?.addEventListener('click', () => abrirModal());

fecharModalBtn?.addEventListener('click', fecharModal);
cancelarBtn?.addEventListener('click', fecharModal);
buscaAdmin?.addEventListener('input', renderizarVeiculos);

veiculoForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const fotosInput = document.getElementById('fotos');
  const fotosBase64 = await converterFotosParaBase64(fotosInput.files);

  const dados = obterDadosFormulario(fotosBase64);
  const index = veiculos.findIndex((item) => item.id === dados.id);

  if (index >= 0) {
    veiculos[index] = dados;
  } else {
    veiculos.unshift(dados);
  }

  salvarVeiculos();
  renderizarVeiculos();
  fecharModal();
});

renderizarVeiculos();
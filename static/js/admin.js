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
const novoVeiculoBtn = document.getElementById('novoVeiculoBtn');
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

const anoInput = document.getElementById('ano');
const kmInput = document.getElementById('km');
const precoInput = document.getElementById('preco');

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

let veiculos = carregarVeiculos();

function carregarVeiculos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function salvarVeiculos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(veiculos));
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarKm(valor) {
  return Number(valor || 0).toLocaleString('pt-BR') + ' km';
}

function abrirModal(veiculo = null) {
  veiculoForm.reset();

  document.getElementById('veiculoId').value = '';

  if (veiculo) {
    modalTitle.textContent = 'Editar veículo';

    document.getElementById('veiculoId').value = veiculo.id;
    document.getElementById('marca').value = veiculo.marca;
    document.getElementById('modelo').value = veiculo.modelo;
    document.getElementById('versao').value = veiculo.versao || '';
    document.getElementById('ano').value = veiculo.ano;
    document.getElementById('km').value = formatarNumeroBR(veiculo.km);
    document.getElementById('cambio').value = veiculo.cambio;
    document.getElementById('combustivel').value = veiculo.combustivel;
    document.getElementById('cor').value = veiculo.cor;
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

function obterDadosFormulario(fotosBase64 = []) {
  const idAtual = document.getElementById('veiculoId').value;

  const existente = veiculos.find((item) => item.id === idAtual);

  const galeriaFinal = fotosBase64.length
    ? fotosBase64
    : existente?.galeria || [];

  return {
    id: idAtual || crypto.randomUUID(),
    marca: document.getElementById('marca').value.trim(),
    modelo: document.getElementById('modelo').value.trim(),
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
  statTotal.textContent = veiculos.length;
  statDisponiveis.textContent = veiculos.filter((v) => !v.vendido && v.ativo !== false).length;
  statVendidos.textContent = veiculos.filter((v) => v.vendido).length;
  statDestaques.textContent = veiculos.filter((v) => v.destaque).length;
}

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

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('maxx_admin_logado');
  window.location.href = 'login.html';
});

novoVeiculoBtn?.addEventListener('click', () => abrirModal());
fecharModalBtn?.addEventListener('click', fecharModal);
cancelarBtn?.addEventListener('click', fecharModal);
buscaAdmin?.addEventListener('input', renderizarVeiculos);

veiculoModal?.addEventListener('click', (event) => {
  if (event.target === veiculoModal) {
    fecharModal();
  }
});

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
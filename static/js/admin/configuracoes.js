/* ============================================================
   MAXX VEÍCULOS — CONFIGURAÇÕES.JS
   Empresa · Configurações · Logo · White Label
   ============================================================ */

const BUCKET_LOGOS = 'logos';

let empresaIdAtual = null;
let empresaAtualDados = null;
let configuracaoAtual = null;
let logoAtual = null;

async function protegerAdmin() {
  if (!window.MAXX_SUPABASE) {
    window.location.href = 'login.html';
    return false;
  }

  const { data } = await window.MAXX_SUPABASE.auth.getSession();

  if (!data.session) {
    window.location.href = 'login.html';
    return false;
  }

  return true;
}

function somenteNumeros(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function formatarTelefone(valor) {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return numeros
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatarCnpj(valor) {
  return somenteNumeros(valor)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatarCep(valor) {
  return somenteNumeros(valor)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2');
}

function mostrarToast(mensagem = 'Configurações salvas com sucesso.') {
  let toast = document.querySelector('.config-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'config-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = mensagem;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

function obterUrlPublicaLogo(path) {
  if (!path) return '';

  if (path.startsWith('http')) return path;

  const { data } = window.MAXX_SUPABASE.storage
    .from(BUCKET_LOGOS)
    .getPublicUrl(path);

  return data.publicUrl;
}

function atualizarPreviewLogo(pathOuUrl) {
  const previewWrap = document.querySelector('.config-logo-preview');
  const previewImg = document.getElementById('logoPreview');

  const url = obterUrlPublicaLogo(pathOuUrl);

  if (!url) {
    previewWrap?.classList.remove('has-logo');
    previewImg.removeAttribute('src');
    return;
  }

  previewImg.src = url;
  previewWrap?.classList.add('has-logo');
}

function aplicarMascaraCampos() {
  ['telefoneEmpresa', 'whatsappEmpresa'].forEach((id) => {
    const campo = document.getElementById(id);

    campo?.addEventListener('input', () => {
      campo.value = formatarTelefone(campo.value);
    });
  });

  document.getElementById('cnpj')?.addEventListener('input', (event) => {
    event.target.value = formatarCnpj(event.target.value);
  });

  document.getElementById('cepEmpresa')?.addEventListener('input', (event) => {
    event.target.value = formatarCep(event.target.value);
  });

  document.getElementById('logoEmpresa')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const urlLocal = URL.createObjectURL(file);
    const previewWrap = document.querySelector('.config-logo-preview');
    const previewImg = document.getElementById('logoPreview');

    previewImg.src = urlLocal;
    previewWrap?.classList.add('has-logo');
  });
}

/* ==================== CARREGAR DADOS ==================== */

async function carregarDadosEmpresa() {
  const { data: empresa, error: empresaError } = await window.MAXX_SUPABASE
    .from('empresas')
    .select('*')
    .eq('id', empresaIdAtual)
    .single();

  if (empresaError) {
    console.error(empresaError);
    alert('Erro ao carregar dados da empresa.');
    return;
  }

  const { data: config, error: configError } = await window.MAXX_SUPABASE
    .from('configuracoes_empresa')
    .select('*')
    .eq('empresa_id', empresaIdAtual)
    .single();

  if (configError) {
    console.error(configError);
    alert('Erro ao carregar configurações.');
    return;
  }

  empresaAtualDados = empresa;
  configuracaoAtual = config;
  logoAtual = empresa.logo_url || null;

  preencherFormulario();
}

function preencherFormulario() {
  document.getElementById('nomeFantasia').value = empresaAtualDados.nome_fantasia || '';
  document.getElementById('razaoSocial').value = empresaAtualDados.nome || '';
  document.getElementById('cnpj').value = empresaAtualDados.cnpj || '';
  document.getElementById('emailEmpresa').value = empresaAtualDados.email || '';
  document.getElementById('telefoneEmpresa').value = empresaAtualDados.telefone || '';
  document.getElementById('whatsappEmpresa').value = empresaAtualDados.whatsapp || '';
  document.getElementById('enderecoEmpresa').value = empresaAtualDados.endereco || '';
  document.getElementById('cidadeEmpresa').value = empresaAtualDados.cidade || '';
  document.getElementById('estadoEmpresa').value = empresaAtualDados.estado || '';
  document.getElementById('cepEmpresa').value = empresaAtualDados.cep || '';
  document.getElementById('corPrimaria').value = empresaAtualDados.cor_primaria || '#ff2b2b';
  document.getElementById('corSecundaria').value = empresaAtualDados.cor_secundaria || '#111111';

  document.getElementById('instagramEmpresa').value = configuracaoAtual.instagram || '';
  document.getElementById('facebookEmpresa').value = configuracaoAtual.facebook || '';
  document.getElementById('horarioEmpresa').value = configuracaoAtual.horario_atendimento || '';
  document.getElementById('mensagemWhatsapp').value = configuracaoAtual.mensagem_whatsapp || '';
  document.getElementById('sitePublico').checked = configuracaoAtual.site_publico !== false;

  atualizarPreviewLogo(logoAtual);
}

/* ==================== UPLOAD LOGO ==================== */

async function uploadLogo() {
  const input = document.getElementById('logoEmpresa');
  const file = input.files?.[0];

  if (!file) return logoAtual;

  const ext = file.name.split('.').pop();
  const nomeArquivo = `${empresaIdAtual}/logo-${Date.now()}.${ext}`;

  const { error } = await window.MAXX_SUPABASE.storage
    .from(BUCKET_LOGOS)
    .upload(nomeArquivo, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error(error);
    throw new Error('Erro ao enviar logo.');
  }

  return nomeArquivo;
}

/* ==================== SALVAR ==================== */

async function salvarConfiguracoes(event) {
  event.preventDefault();

  const submitBtn = document.querySelector('#configForm button[type="submit"]');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Salvando...';

  try {
    const logoPath = await uploadLogo();

    const dadosEmpresa = {
      nome_fantasia: document.getElementById('nomeFantasia').value.trim(),
      nome: document.getElementById('razaoSocial').value.trim(),
      cnpj: document.getElementById('cnpj').value.trim(),
      email: document.getElementById('emailEmpresa').value.trim().toLowerCase(),
      telefone: document.getElementById('telefoneEmpresa').value.trim(),
      whatsapp: document.getElementById('whatsappEmpresa').value.trim(),
      endereco: document.getElementById('enderecoEmpresa').value.trim(),
      cidade: document.getElementById('cidadeEmpresa').value.trim(),
      estado: document.getElementById('estadoEmpresa').value.trim(),
      cep: document.getElementById('cepEmpresa').value.trim(),
      cor_primaria: document.getElementById('corPrimaria').value,
      cor_secundaria: document.getElementById('corSecundaria').value,
      logo_url: logoPath,
      updated_at: new Date().toISOString()
    };

    const dadosConfig = {
      empresa_id: empresaIdAtual,
      site_publico: document.getElementById('sitePublico').checked,
      whatsapp_padrao: document.getElementById('whatsappEmpresa').value.trim(),
      mensagem_whatsapp: document.getElementById('mensagemWhatsapp').value.trim(),
      instagram: document.getElementById('instagramEmpresa').value.trim(),
      facebook: document.getElementById('facebookEmpresa').value.trim(),
      horario_atendimento: document.getElementById('horarioEmpresa').value.trim(),
      updated_at: new Date().toISOString()
    };

    const { error: empresaError } = await window.MAXX_SUPABASE
      .from('empresas')
      .update(dadosEmpresa)
      .eq('id', empresaIdAtual);

    if (empresaError) throw empresaError;

    const { error: configError } = await window.MAXX_SUPABASE
      .from('configuracoes_empresa')
      .upsert(dadosConfig, {
        onConflict: 'empresa_id'
      });

    if (configError) throw configError;

    logoAtual = logoPath;
    window.MAXX_EMPRESA = {
      ...window.MAXX_EMPRESA,
      ...dadosEmpresa,
      id: empresaIdAtual
    };

    atualizarPreviewLogo(logoAtual);
    mostrarToast('Configurações salvas com sucesso.');
  } catch (error) {
    console.error(error);
    alert(error.message || 'Erro ao salvar configurações.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar configurações';
  }
}

/* ==================== LOGOUT ==================== */

const logoutBtn = document.getElementById('logoutBtn');

logoutBtn?.addEventListener('click', async () => {
  const confirmar = confirm('Sair do painel?');

  if (!confirmar) return;

  await window.MAXX_SUPABASE.auth.signOut();
  window.location.href = 'login.html';
});

/* ==================== INIT ==================== */

document.getElementById('configForm')?.addEventListener('submit', salvarConfiguracoes);

(async () => {
  aplicarMascaraCampos();

  const ok = await protegerAdmin();

  if (!ok) return;

  const empresa = await carregarEmpresaAtual();

  if (!empresa) {
    alert('Nenhuma empresa vinculada ao usuário.');
    return;
  }

  empresaIdAtual = empresa.id;

  await carregarDadosEmpresa();
})();
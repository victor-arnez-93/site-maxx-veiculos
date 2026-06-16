/* ============================================================
   EMPRESA.JS
   Empresa ativa do usuário logado
   ============================================================ */

const supabaseClient = window.MAXX_SUPABASE;

let empresaAtual = null;

async function carregarEmpresaAtual() {
  const { data, error } = await supabaseClient
    .from('usuarios_empresa')
    .select(`
      empresa_id,
      perfil,
      empresas (
        id,
        nome,
        nome_fantasia,
        slug,
        logo_url,
        cor_primaria,
        cor_secundaria
      )
    `)
    .single();

  if (error) {
    console.error('Erro ao carregar empresa:', error);
    return null;
  }

  empresaAtual = {
    ...data.empresas,
    perfil: data.perfil
  };

  window.MAXX_EMPRESA = empresaAtual;

  return empresaAtual;
}

function obterEmpresaId() {
  return window.MAXX_EMPRESA?.id || null;
}

window.carregarEmpresaAtual = carregarEmpresaAtual;
window.obterEmpresaId = obterEmpresaId;
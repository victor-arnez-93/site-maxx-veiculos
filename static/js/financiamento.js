/* ============================================================
   MAXX VEÍCULOS — FINANCIAMENTO.JS
   Máscara · Slider · Cálculo · WhatsApp
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const TAXA_MENSAL = 0.0149;

  const finValor = document.getElementById('finValor');
  const finEntrada = document.getElementById('finEntrada');

  const entradaPct = document.getElementById('entradaPct');
  const entradaVal = document.getElementById('entradaVal');

  const parcelasOut = document.getElementById('parcelasOut');
  const parcelaOut = document.getElementById('parcelaOut');

  const rowValor = document.getElementById('rowValor');
  const rowEntrada = document.getElementById('rowEntrada');
  const rowFinanciado = document.getElementById('rowFinanciado');
  const rowTotal = document.getElementById('rowTotal');

  const finWa = document.getElementById('finWa');
  const termBtns = document.querySelectorAll('.term-btn');

  let valorVeiculo = 80000;
  let entradaPercentual = 20;
  let prazoAtual = 48;

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    });
  }

  function apenasNumeros(valor) {
    return String(valor || '').replace(/\D/g, '');
  }

  function aplicarMascaraValor() {
    const numero = Number(apenasNumeros(finValor.value));

    valorVeiculo = numero;

    finValor.value = numero ? formatarMoeda(numero) : '';

    calcular();
  }

  function atualizarSlider() {
    entradaPercentual = Number(finEntrada.value || 0);

    finEntrada.style.setProperty('--fill', `${entradaPercentual}%`);

    calcular();
  }

  function calcular() {
    const entrada = valorVeiculo * (entradaPercentual / 100);
    const financiado = valorVeiculo - entrada;

    const parcela = financiado > 0
      ? financiado * TAXA_MENSAL / (1 - Math.pow(1 + TAXA_MENSAL, -prazoAtual))
      : 0;

    const total = parcela * prazoAtual + entrada;

    entradaPct.textContent = `${entradaPercentual}%`;
    entradaVal.textContent = formatarMoeda(entrada);

    parcelasOut.textContent = `${prazoAtual}×`;
    parcelaOut.textContent = parcela ? formatarMoeda(parcela) : 'R$ —';

    rowValor.textContent = formatarMoeda(valorVeiculo);
    rowEntrada.textContent = formatarMoeda(entrada);
    rowFinanciado.textContent = formatarMoeda(financiado);
    rowTotal.textContent = formatarMoeda(total);

    atualizarWhatsapp(entrada, financiado, parcela, total);
  }

  function atualizarWhatsapp(entrada, financiado, parcela, total) {
    if (!finWa) return;

    const mensagem = `
Olá! Fiz uma simulação de financiamento no site da Maxx Veículos.

Valor do veículo: ${formatarMoeda(valorVeiculo)}
Entrada: ${formatarMoeda(entrada)} (${entradaPercentual}%)
Valor financiado: ${formatarMoeda(financiado)}
Prazo: ${prazoAtual}x
Parcela estimada: ${formatarMoeda(parcela)}
Total estimado: ${formatarMoeda(total)}

Podem me ajudar com essa simulação?
    `.trim();

    finWa.href = MAXX.waLink(mensagem);
  }

  function selecionarPrazo(botao) {
    termBtns.forEach(btn => btn.classList.remove('active'));

    botao.classList.add('active');

    prazoAtual = Number(botao.dataset.n || 48);

    calcular();
  }

  function iniciar() {
    finValor.value = formatarMoeda(valorVeiculo);

    finEntrada.value = entradaPercentual;
    finEntrada.style.setProperty('--fill', `${entradaPercentual}%`);

    finValor.addEventListener('input', aplicarMascaraValor);
    finEntrada.addEventListener('input', atualizarSlider);

    termBtns.forEach((botao) => {
      botao.addEventListener('click', () => selecionarPrazo(botao));
    });

    calcular();
  }

  iniciar();
});
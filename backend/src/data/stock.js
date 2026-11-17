/**
 * [MUDANÇA · BACKEND] Estoque por loja (SIMULADO).
 *
 * Em produção isto viria do ERP/WMS. Aqui reproduzimos exatamente os cenários do protótipo
 * para a demonstração continuar igual:
 *   • Bourbon São Leopoldo ....... tem tudo que está no carrinho de exemplo
 *   • Iguatemi Porto Alegre ...... tem o carrinho de exemplo, falta alguns itens do catálogo
 *   • Praia de Belas ............. SEM o mouse (r2) → "Estoque parcial 2/3"
 *   • BarraShoppingSul ........... sem estoque nenhum
 *
 * `generated` aplica ao catálogo gerado (ids n0, n1…) as mesmas regras de "falta" que o
 * protótipo calculava no navegador (nid%7 / nid%11). `deliveryOnly` (itens grandes que só
 * saem por entrega) fica em catalog-stock-meta.json, gerado a partir do catálogo do frontend.
 */
module.exports = {
  'bourbon-sao-leopoldo': { all: false, missing: ['r4', 'r1'] },
  'iguatemi-porto-alegre': { all: false, missing: ['r0', 'a3', 'r1'], generated: (k) => (k + 1) % 11 === 5 },
  'praia-de-belas': { all: false, missing: ['r2', 'a2', 'r4', 'r1'], generated: (k) => (k + 1) % 7 === 3 },
  'barrashoppingsul': { all: true, missing: [] },
};

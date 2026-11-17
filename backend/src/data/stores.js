/**
 * [MUDANÇA · LOJAS REAIS] Pontos de retirada do Click & Collect.
 *
 * ANTES: 4 lojas inventadas ("Av. Principal, 1200", "Rua das Flores, 340"…) com distâncias fixas.
 * AGORA: endereços de shoppings REAIS da Grande Porto Alegre / Vale do Sinos. A "MegaLoja" é uma
 * marca fictícia de protótipo, então cada ponto de retirada é um balcão suposto dentro do shopping.
 * Troque esta lista pelas filiais reais da sua operação.
 *
 * Fontes dos endereços (conferidos em listagens públicas):
 *   - Bourbon Shopping São Leopoldo ........ Rua Primeiro de Março, 821 – Centro, São Leopoldo/RS
 *   - Shopping Iguatemi Porto Alegre ....... Av. João Wallig, 1800 – Passo d'Areia, Porto Alegre/RS
 *   - Praia de Belas Shopping .............. Av. Praia de Belas, 1181 – Praia de Belas, Porto Alegre/RS
 *   - BarraShoppingSul ..................... Av. Diário de Notícias, 300 – Cristal, Porto Alegre/RS
 *
 * ATENÇÃO — confira antes de ir para produção:
 *   • `location` (lat/lng) é APROXIMADA (± algumas centenas de metros). Serve para ordenar por
 *     distância e para o pino do mapa; o botão "Como chegar" usa o ENDEREÇO, então a rota é exata.
 *   • `hours` segue o padrão de shopping (seg–sáb 10h–22h, dom 14h–20h). Os horários de Praia de
 *     Belas e Iguatemi bateram com listagens públicas; os demais são o padrão e podem variar em
 *     feriados. Ajuste conforme o balcão real.
 *
 * `order` define a ordem quando o cliente ainda não informou o CEP (a 1ª loja é a padrão).
 */
const MALL_HOURS = {
  0: ['14:00', '20:00'],
  1: ['10:00', '22:00'],
  2: ['10:00', '22:00'],
  3: ['10:00', '22:00'],
  4: ['10:00', '22:00'],
  5: ['10:00', '22:00'],
  6: ['10:00', '22:00'],
};

module.exports = [
  {
    id: 'bourbon-sao-leopoldo',
    order: 0,
    name: 'MegaLoja Bourbon São Leopoldo',
    shortName: 'Bourbon São Leopoldo',
    address: { street: 'Rua Primeiro de Março', number: '821', district: 'Centro', city: 'São Leopoldo', state: 'RS' },
    location: { lat: -29.7603, lng: -51.1489 },
    hours: MALL_HOURS,
  },
  {
    id: 'iguatemi-porto-alegre',
    order: 1,
    name: 'MegaLoja Iguatemi Porto Alegre',
    shortName: 'Iguatemi Porto Alegre',
    address: { street: 'Avenida João Wallig', number: '1800', district: "Passo d'Areia", city: 'Porto Alegre', state: 'RS' },
    location: { lat: -30.0277, lng: -51.1665 },
    hours: MALL_HOURS,
  },
  {
    id: 'praia-de-belas',
    order: 2,
    name: 'MegaLoja Praia de Belas',
    shortName: 'Praia de Belas',
    address: { street: 'Avenida Praia de Belas', number: '1181', district: 'Praia de Belas', city: 'Porto Alegre', state: 'RS' },
    location: { lat: -30.0487, lng: -51.2299 },
    hours: MALL_HOURS,
  },
  {
    id: 'barrashoppingsul',
    order: 3,
    name: 'MegaLoja BarraShoppingSul',
    shortName: 'BarraShoppingSul',
    address: { street: 'Avenida Diário de Notícias', number: '300', district: 'Cristal', city: 'Porto Alegre', state: 'RS' },
    location: { lat: -30.0846, lng: -51.2467 },
    hours: MALL_HOURS,
  },
];

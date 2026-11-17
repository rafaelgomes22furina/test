/**
 * [MUDANÇA · BACKEND] Cálculo de totais no servidor (espelha as regras do protótipo):
 *   • cupom BEMVINDO10 = 10% sobre os produtos
 *   • retirada na loja: frete R$ 0,00
 *   • entrega "Padrão": grátis a partir de R$ 600 (as demais opções cobram sempre)
 *   • Pix: 5% de desconto sobre (produtos − cupom + frete)
 * O total é SEMPRE recalculado aqui; o valor mostrado no navegador é só informativo.
 */
const config = require('../config');

const cents = (n) => Math.round(n * 100) / 100;

function computeTotals({ items, type, deliveryOptionId = 0, couponCode, paymentMethod }) {
  const gross = items.reduce((a, i) => a + i.price * i.qty, 0);
  const off = (couponCode && config.pricing.coupons[String(couponCode).trim().toUpperCase()]) || 0;
  const discount = cents(gross * off);
  const subtotal = cents(gross - discount);

  let shipping = 0;
  let deliveryOption = null;
  if (type === 'delivery') {
    deliveryOption = config.pricing.deliveryOptions.find((o) => o.id === deliveryOptionId) || config.pricing.deliveryOptions[0];
    shipping = deliveryOption.id === 0 && subtotal >= config.pricing.freeShippingFrom ? 0 : deliveryOption.fee;
  }

  const base = subtotal + shipping;
  const pixDiscount = paymentMethod === 'pix' ? cents(base * config.pricing.pixDiscount) : 0;

  return {
    deliveryOption,
    totals: {
      gross: cents(gross),
      couponCode: off ? String(couponCode).trim().toUpperCase() : null,
      discount,
      subtotal,
      shipping: cents(shipping),
      pixDiscount,
      total: cents(base - pixDiscount),
    },
  };
}

module.exports = { computeTotals };

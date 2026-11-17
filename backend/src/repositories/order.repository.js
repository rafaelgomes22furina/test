/**
 * [MUDANÇA · BACKEND] Persistência dos pedidos.
 *
 * Guarda tudo em memória e grava em `orders.json` (escrita atômica: arquivo temporário + rename,
 * serializada numa fila para nunca corromper o arquivo). Reiniciar o servidor NÃO perde pedidos.
 * É simples de propósito: para produção, troque esta classe por uma que fale com um banco de dados
 * — o `order.service` só conhece estes métodos.
 */
const fs = require('node:fs');
const path = require('node:path');

const SEQ_START = 48215; // o 1º pedido criado será MG-48216 (o protótipo usava MG-48215)

class OrderRepository {
  /** @param {string|null} dir pasta de dados; null = só memória (testes) */
  constructor(dir) {
    this.dir = dir;
    this.file = dir ? path.join(dir, 'orders.json') : null;
    this.orders = new Map();
    this.seq = SEQ_START;
    this._queue = Promise.resolve();
  }

  init() {
    if (!this.file) return this;
    fs.mkdirSync(this.dir, { recursive: true });
    if (fs.existsSync(this.file)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
        this.seq = Number.isInteger(data.seq) ? data.seq : SEQ_START;
        for (const o of data.orders || []) this.orders.set(o.id, o);
      } catch (err) {
        // arquivo corrompido: preserva uma cópia e começa limpo em vez de derrubar o servidor
        fs.renameSync(this.file, `${this.file}.corrompido-${Date.now()}`);
        console.error('[orders] orders.json ilegível, cópia preservada:', err.message);
      }
    }
    return this;
  }

  nextId() {
    this.seq += 1;
    return `MG-${this.seq}`;
  }

  get(id) {
    return this.orders.get(id) || null;
  }

  save(order) {
    this.orders.set(order.id, order);
    this._persist();
    return order;
  }

  _persist() {
    if (!this.file) return;
    const snapshot = JSON.stringify({ seq: this.seq, orders: [...this.orders.values()] }, null, 2);
    this._queue = this._queue
      .then(async () => {
        const tmp = `${this.file}.tmp`;
        await fs.promises.writeFile(tmp, snapshot);
        await fs.promises.rename(tmp, this.file);
      })
      .catch((err) => console.error('[orders] falha ao gravar:', err.message));
  }

  flush() {
    return this._queue;
  }
}

module.exports = { OrderRepository };

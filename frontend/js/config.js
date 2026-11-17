/**
 * [MUDANÇA · FRONTEND↔BACKEND] Endereço base da API.
 * O Express serve o frontend e a API na MESMA origem, então o caminho relativo basta.
 * Para hospedar o frontend em outro domínio, troque por 'https://seu-dominio/api' (e habilite CORS no backend).
 */
const API_BASE = '/api';

/** CPF de teste exibido na própria tela de retirada; usado quando se "pula" etapas pelo menu de demonstração. */
const DEMO_CPF = '529.982.247-25';

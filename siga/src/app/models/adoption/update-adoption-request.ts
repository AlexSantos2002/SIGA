/**
 * Representa um request para atualizar
 * uma adoção
 */
export interface UpdateAdoptionRequest {
  adoptionId: string;
  newStatus: 'aceita' | 'rejeitada' | 'pendente' | 'devolvida';
  decisionDate?: string;
}

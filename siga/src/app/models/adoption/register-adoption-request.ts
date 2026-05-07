export interface RegisterAdoptionRequest {
  adopterId: string,
  animalId: string,
  status: 'pendente' | 'aceita' | 'rejeitada',
  applicationDate: string,
  decisionDate?: string
}

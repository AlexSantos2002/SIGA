import { Adopter } from '../adopter/adopter.model';

export interface Adoption {
  id: string,
  animal: {
    id: string,
    name: string,
    species: string,
    breed: string
  },
  adopter: Adopter,
  status: 'pendente' | 'aceita' | 'rejeitada',
  applicationDate: string, // Dia em que o pedido foi submetido
  decisionDate?: string // Data da decisão (aprovada, rejeitada), pode estar ausente
}

import { Adopter } from '../adopter/adopter.model';

interface AdoptionAnimalRelation {
  id: string;
  name: string;
}

export interface Adoption {
  id: string;
  animal: {
    id: string;
    name: string;
    gender: string | null;
    status: string | null;
    available: boolean;
    species: AdoptionAnimalRelation | null;
    breed: AdoptionAnimalRelation | null;
  };
  adopter: Adopter;
  status: 'pendente' | 'aceita' | 'rejeitada' | 'devolvida';
  applicationDate: string; // Dia em que o pedido foi submetido
  decisionDate?: string; // Data da decisão (aprovada, rejeitada), pode estar ausente
}

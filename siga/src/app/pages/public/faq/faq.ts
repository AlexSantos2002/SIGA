import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.html',
  styleUrl: './faq.css'
})
export class Faq {
  faqs = [
    {
      question: 'O que é o SIGA?',
      answer: 'O SIGA é uma plataforma criada para apoiar organizações na gestão de animais, acompanhamento interno e processos de adoção de forma mais organizada e eficiente.',
      open: true
    },
    {
      question: 'Quem pode utilizar a plataforma?',
      answer: 'A plataforma foi pensada para organizações e associações que trabalham com acolhimento e adoção de animais.',
      open: false
    },
    {
      question: 'O SIGA é gratuito?',
      answer: 'O objetivo do SIGA é disponibilizar uma solução acessível para organizações de proteção animal, especialmente sem fins lucrativos.',
      open: false
    },
    {
      question: 'Que tipo de informação pode ser gerida?',
      answer: 'Informação sobre animais, adotantes, histórico, estado de saúde e acompanhamento.',
      open: false
    },
    {
      question: 'Posso acompanhar o estado dos animais?',
      answer: 'Sim. O sistema permite acompanhar necessidades, evolução e dados importantes de cada animal.',
      open: false
    },
    {
      question: 'Como posso registar a minha organização?',
      answer: 'Através da página de registo, preenchendo os dados da organização e do administrador.',
      open: false
    }
  ];

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
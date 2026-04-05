import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

/**
 * @description
 * Componente responsável pela página de FAQ
 * Apresenta uma lista de perguntas e respostas suportando dois idiomas
 */
@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.html',
  styleUrl: './faq.css'
})
export class Faq implements OnInit {

  /**
   * @description
   * Lista de perguntas frequentes apresentadas na página
   */
  faqs: any[] = [];

  /**
   * @description
   * Método executado quando o componente é inicializado.
   * Define automaticamente o idioma das FAQs com base no URL, se o path tiver /en fica em ingles caso contrario em portugues
   * 
   * @returns {void} Não retorna valor
   */
  ngOnInit(): void {
    const isEnglish = window.location.pathname.includes('/en');

    if (isEnglish) {
      this.faqs = [
        {
          question: 'What is SIGA?',
          answer: 'SIGA is a platform created to support organizations in animal management, internal tracking, and adoption processes in a more organized and efficient way.',
          open: false
        },
        {
          question: 'Who can use the platform?',
          answer: 'The platform is designed for organizations and associations working with animal care and adoption.',
          open: false
        },
        {
          question: 'Is SIGA free?',
          answer: 'The goal of SIGA is to provide an accessible solution for animal welfare organizations, especially non-profit ones.',
          open: false
        },
        {
          question: 'What type of information can be managed?',
          answer: 'Information about animals, adopters, history, health status, and monitoring.',
          open: false
        },
        {
          question: 'Can I track the status of animals?',
          answer: 'Yes. The system allows you to track needs, progress, and important data for each animal.',
          open: false
        },
        {
          question: 'How can I register my organization?',
          answer: 'Through the registration page, by filling in the organization and administrator details.',
          open: false
        }
      ];
    } else {
      this.faqs = [
        {
          question: 'O que é o SIGA?',
          answer: 'O SIGA é uma plataforma criada para apoiar organizações na gestão de animais, acompanhamento interno e processos de adoção de forma mais organizada e eficiente.',
          open: false
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
    }
  }

  /**
   * @description
   * Altera o estado de uma pergunta da FAQ
   * Permite abrir/fechar
   * 
   * @param index Índice da pergunta na lista
   * @returns {void} Não retorna valor
   */
  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface PolicySection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

interface PolicyContent {
  label: string;
  title: string;
  updatedAt: string;
  intro: string[];
  sections: PolicySection[];
}

const policyContent: Record<'pt' | 'en', PolicyContent> = {
  pt: {
    label: 'Política de dados',
    title: 'Privacidade e proteção de dados',
    updatedAt: 'Última atualização: 2 de junho de 2026',
    intro: [
      'A presente Política de Dados descreve o tratamento de dados pessoais realizado no âmbito da utilização do SIGA.',
      'Esta informação aplica-se aos dados fornecidos pelas organizações registadas, pelos seus utilizadores e aos dados inseridos na plataforma no contexto da gestão de animais, adotantes e processos de adoção.',
    ],
    sections: [
      {
        title: '1. Dados tratados pela plataforma',
        paragraphs: [
          'O SIGA trata os dados necessários para permitir o funcionamento da plataforma e a gestão interna das organizações que a utilizam. Os dados podem variar consoante as funcionalidades utilizadas e a informação introduzida por cada organização.',
          'De forma geral, podem ser tratados os seguintes tipos de dados:',
        ],
        items: [
          'Dados da organização, incluindo nome, email, telefone e morada.',
          'Dados de administradores e utilizadores, incluindo nome, email, palavra-passe, perfil de acesso e organização associada.',
          'Dados relativos a animais, incluindo identificação, espécie, raça, sexo, data de nascimento, estado, notas gerais, informação médica, esterilização e microchip.',
          'Dados relativos a adotantes, incluindo nome, apelido, contactos, documento de identificação, data de nascimento, morada, cidade, código postal, tipo de habitação, agregado familiar, experiência com animais, preferências, motivação de adoção e notas internas.',
          'Dados relativos a processos de adoção, incluindo animal, adotante, estado do processo, data de candidatura e data de decisão.',
          'Dados de acompanhamento animal, incluindo consultas veterinárias, vacinas, desparasitações, clínicas, veterinários, datas, resultados, produtos utilizados e notas.',
          'Dados técnicos necessários à autenticação, segurança, manutenção e funcionamento da plataforma.',
        ],
      },
      {
        title: '2. Finalidades do tratamento',
        paragraphs: [
          'Os dados são tratados para disponibilizar a plataforma SIGA e permitir que as organizações registem, consultem e acompanhem a informação necessária ao seu trabalho diário.',
          'Em concreto, os dados podem ser utilizados para:',
        ],
        items: [
          'Criar e gerir contas de organizações, administradores e utilizadores.',
          'Permitir a gestão de animais, adotantes, processos de adoção e histórico de acompanhamento.',
          'Organizar informação operacional e clínica relevante para o cuidado dos animais.',
          'Prestar apoio aos utilizadores e responder a pedidos relacionados com a plataforma.',
          'Garantir a segurança do serviço, prevenir utilizações indevidas e resolver problemas técnicos.',
          'Cumprir obrigações legais, administrativas ou contratuais quando aplicável.',
        ],
      },
      {
        title: '3. Conservação dos dados',
        paragraphs: [
          'Os dados são conservados durante o período necessário para a utilização da plataforma, para a gestão da conta da organização ou para o cumprimento de obrigações legais aplicáveis.',
          'Quando os dados deixarem de ser necessários, poderão ser eliminados, anonimizados ou conservados apenas pelo período estritamente necessário para fins legais, de segurança ou auditoria.',
        ],
      },
      {
        title: '4. Acesso, correção e eliminação',
        paragraphs: [
          'O titular dos dados pode solicitar o acesso, a correção, a limitação do tratamento ou a eliminação dos seus dados pessoais.',
          'Atualmente, estes pedidos devem ser enviados por email para geral@siga.pt, indicando a organização associada, o email utilizado na plataforma e os dados que pretende consultar, corrigir ou eliminar.',
          'Antes de executar o pedido, poderá ser solicitada informação adicional para confirmação de identidade ou legitimidade. Após validação, o SIGA procederá à eliminação ou anonimização dos dados sempre que tal seja possível.',
          'Alguns dados poderão ter de ser mantidos quando exista obrigação legal, necessidade de segurança, prevenção de fraude, resolução de litígios ou outro fundamento legítimo aplicável.',
        ],
      },
      {
        title: '5. Direitos dos titulares dos dados',
        paragraphs: [
          'Nos termos do Regulamento Geral sobre a Proteção de Dados, os titulares podem exercer, quando aplicável, os direitos de acesso, retificação, apagamento, limitação do tratamento, oposição e portabilidade.',
          'O titular dos dados pode ainda apresentar reclamação junto da autoridade de controlo competente, nomeadamente a Comissão Nacional de Proteção de Dados em Portugal.',
        ],
      },
    ],
  },
  en: {
    label: 'Data policy',
    title: 'Privacy and data protection',
    updatedAt: 'Last updated: June 2, 2026',
    intro: [
      'This Data Policy describes the processing of personal data carried out in connection with the use of SIGA.',
      'This information applies to data provided by registered organizations, their users, and data entered into the platform in the context of animal management, adopters, and adoption processes.',
    ],
    sections: [
      {
        title: '1. Data processed by the platform',
        paragraphs: [
          'SIGA processes the data needed to operate the platform and support the internal management of the organizations that use it. The data may vary depending on the features used and the information entered by each organization.',
          'In general, the following types of data may be processed:',
        ],
        items: [
          'Organization data, including name, email, phone number, and address.',
          'Administrator and user data, including name, email, password, access role, and associated organization.',
          'Animal data, including identification, species, breed, sex, date of birth, status, general notes, medical information, sterilization, and microchip.',
          'Adopter data, including first name, last name, contact details, identification document, date of birth, address, city, postal code, housing type, household, animal experience, preferences, adoption motivation, and internal notes.',
          'Adoption process data, including animal, adopter, process status, application date, and decision date.',
          'Animal follow-up data, including veterinary appointments, vaccines, deworming, clinics, veterinarians, dates, results, products used, and notes.',
          'Technical data required for authentication, security, maintenance, and platform operation.',
        ],
      },
      {
        title: '2. Purposes of processing',
        paragraphs: [
          'Data is processed to provide the SIGA platform and enable organizations to register, consult, and monitor information needed for their daily work.',
          'Specifically, data may be used to:',
        ],
        items: [
          'Create and manage organization, administrator, and user accounts.',
          'Enable the management of animals, adopters, adoption processes, and follow-up history.',
          'Organize operational and clinical information relevant to animal care.',
          'Provide user support and respond to platform-related requests.',
          'Ensure service security, prevent misuse, and resolve technical issues.',
          'Comply with legal, administrative, or contractual obligations where applicable.',
        ],
      },
      {
        title: '3. Data retention',
        paragraphs: [
          'Data is retained for the period required to use the platform, manage the organization account, or comply with applicable legal obligations.',
          'When data is no longer needed, it may be deleted, anonymized, or retained only for the strictly necessary period for legal, security, or audit purposes.',
        ],
      },
      {
        title: '4. Access, correction, and deletion',
        paragraphs: [
          'The data subject may request access, correction, restriction of processing, or deletion of their personal data.',
          'At this stage, these requests should be sent by email to geral@siga.pt, identifying the associated organization, the email used on the platform, and the data to be accessed, corrected, or deleted.',
          'Before carrying out the request, additional information may be requested to confirm identity or legitimacy. After validation, SIGA will delete or anonymize the data whenever possible.',
          'Some data may need to be retained where there is a legal obligation, security need, fraud prevention need, dispute resolution need, or other applicable legitimate basis.',
        ],
      },
      {
        title: '5. Data subject rights',
        paragraphs: [
          'Under the General Data Protection Regulation, data subjects may exercise, where applicable, the rights of access, rectification, erasure, restriction of processing, objection, and portability.',
          'The data subject may also lodge a complaint with the competent supervisory authority, namely the Comissão Nacional de Proteção de Dados in Portugal.',
        ],
      },
    ],
  },
};

/**
 * @description
 * Componente responsável pela política de dados e privacidade.
 */
@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.css',
})
export class PrivacyPolicy {
  readonly content = policyContent[this.isEnglishPage() ? 'en' : 'pt'];

  private isEnglishPage(): boolean {
    return window.location.pathname.includes('/en');
  }
}

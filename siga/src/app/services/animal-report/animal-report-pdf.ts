import { jsPDF } from 'jspdf';

import {
  ANIMAL_GENDER_LABELS,
  ANIMAL_STATUS_LABELS,
  DEWORMING_TYPES,
  STERILIZATION_STATUS_LABELS,
  VACCINE_STATUSES,
  getMappedLabel,
  getOptionLabel,
} from '../../constants/form-options';
import { Adoption } from '../../models/adoption/adoption.model';
import { AnimalDeworming } from '../../models/animal/animal-deworming.model';
import { Animal } from '../../models/animal/animal.model';
import { AnimalVetAppointment } from '../../models/animal/animal-vet-appointment.model';
import { AnimalVaccine } from '../../models/vaccines/animal-vaccines.model';

export interface AnimalReportData {
  organizationName: string;
  animal: Animal;
  vaccines: AnimalVaccine[];
  dewormingRecords: AnimalDeworming[];
  vetAppointments: AnimalVetAppointment[];
  acceptedAdoption: Adoption | null;
  generatedAt?: Date;
}

export interface AnimalReportAssets {
  logoDataUrl?: string | null;
  animalImageDataUrl?: string | null;
}

interface ReportField {
  label: string;
  value: string;
}

const PAGE_WIDTH = 210;
const MARGIN_X = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const CONTENT_TOP = 43;
const CONTENT_BOTTOM = 279;
const LINE_HEIGHT = 4.5;
const BRAND_BLUE: [number, number, number] = [30, 78, 121];
const BRAND_CYAN: [number, number, number] = [22, 170, 197];
const TEXT: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [100, 116, 139];
const PALE_BLUE: [number, number, number] = [239, 246, 255];
const BORDER: [number, number, number] = [226, 232, 240];

export function createAnimalReportPdf(
  data: AnimalReportData,
  assets: AnimalReportAssets = {},
): jsPDF {
  const document = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const generatedAt = data.generatedAt ?? new Date();
  let cursorY = CONTENT_TOP;

  const drawHeader = (): void => {
    document.setFillColor(...BRAND_BLUE);
    document.rect(0, 0, PAGE_WIDTH, 34, 'F');
    document.setFillColor(...BRAND_CYAN);
    document.rect(0, 34, PAGE_WIDTH, 2, 'F');

    if (assets.logoDataUrl) {
      try {
        document.addImage(assets.logoDataUrl, 14, 7, 25, 20);
      } catch {
        drawLogoFallback(document);
      }
    } else {
      drawLogoFallback(document);
    }

    document.setTextColor(255, 255, 255);
    document.setFont('helvetica', 'bold');
    document.setFontSize(17);
    document.text('Relatório SIGA', 46, 14);
    document.setFont('helvetica', 'normal');
    document.setFontSize(9.5);
    document.text(data.organizationName || 'Organização', 46, 21);
    document.setFontSize(8);
    document.text('Ficha individual do animal', 46, 26.5);
  };

  const addPage = (): void => {
    document.addPage();
    drawHeader();
    cursorY = CONTENT_TOP;
  };

  const ensureSpace = (height: number): void => {
    if (cursorY + height > CONTENT_BOTTOM) {
      addPage();
    }
  };

  const drawSectionTitle = (title: string): void => {
    // Reserva espaço para o título e para o primeiro conteúdo da secção,
    // evitando títulos isolados no fim de uma página.
    ensureSpace(72);
    document.setFillColor(...PALE_BLUE);
    document.roundedRect(MARGIN_X, cursorY, CONTENT_WIDTH, 10, 2, 2, 'F');
    document.setFillColor(...BRAND_CYAN);
    document.roundedRect(MARGIN_X, cursorY, 3, 10, 1.5, 1.5, 'F');
    document.setTextColor(...BRAND_BLUE);
    document.setFont('helvetica', 'bold');
    document.setFontSize(11);
    document.text(title, MARGIN_X + 7, cursorY + 6.6);
    cursorY += 14;
  };

  const drawFieldGrid = (fields: ReportField[]): void => {
    const gap = 4;
    const columnWidth = (CONTENT_WIDTH - gap) / 2;

    for (let index = 0; index < fields.length; index += 2) {
      const row = fields.slice(index, index + 2);
      const lineSets = row.map((field) =>
        document.splitTextToSize(displayValue(field.value), columnWidth - 8) as string[],
      );
      const rowHeight = Math.max(17, ...lineSets.map((lines) => 11 + lines.length * LINE_HEIGHT));
      ensureSpace(rowHeight + 3);

      row.forEach((field, columnIndex) => {
        const x = MARGIN_X + columnIndex * (columnWidth + gap);
        document.setFillColor(248, 250, 252);
        document.setDrawColor(...BORDER);
        document.roundedRect(x, cursorY, columnWidth, rowHeight, 2, 2, 'FD');
        document.setTextColor(...MUTED);
        document.setFont('helvetica', 'bold');
        document.setFontSize(7.5);
        document.text(field.label.toUpperCase(), x + 4, cursorY + 5.5);
        document.setTextColor(...TEXT);
        document.setFont('helvetica', 'normal');
        document.setFontSize(9.5);
        document.text(lineSets[columnIndex], x + 4, cursorY + 11.5);
      });

      cursorY += rowHeight + 3;
    }
  };

  const drawTextBlock = (label: string, value: string | null): void => {
    const lines = document.splitTextToSize(displayValue(value), CONTENT_WIDTH - 10) as string[];
    let offset = 0;

    while (offset < lines.length) {
      const availableLines = Math.max(1, Math.floor((CONTENT_BOTTOM - cursorY - 13) / LINE_HEIGHT));
      if (availableLines <= 1 && cursorY > CONTENT_TOP) {
        addPage();
        continue;
      }

      const chunk = lines.slice(offset, offset + availableLines);
      const blockHeight = 12 + chunk.length * LINE_HEIGHT;
      ensureSpace(blockHeight + 3);
      document.setFillColor(248, 250, 252);
      document.setDrawColor(...BORDER);
      document.roundedRect(MARGIN_X, cursorY, CONTENT_WIDTH, blockHeight, 2, 2, 'FD');
      document.setTextColor(...MUTED);
      document.setFont('helvetica', 'bold');
      document.setFontSize(8);
      document.text(offset === 0 ? label.toUpperCase() : `${label.toUpperCase()} (continuação)`, MARGIN_X + 5, cursorY + 6);
      document.setTextColor(...TEXT);
      document.setFont('helvetica', 'normal');
      document.setFontSize(9.5);
      document.text(chunk, MARGIN_X + 5, cursorY + 12);
      cursorY += blockHeight + 3;
      offset += chunk.length;
    }
  };

  const drawEmptyState = (message: string): void => {
    ensureSpace(13);
    document.setTextColor(...MUTED);
    document.setFont('helvetica', 'italic');
    document.setFontSize(9);
    document.text(message, MARGIN_X + 2, cursorY + 5);
    cursorY += 11;
  };

  const drawRecord = (title: string, fields: ReportField[]): void => {
    const recordHeight =
      18 +
      fields.reduce((height, field) => {
        const valueLines = document.splitTextToSize(
          displayValue(field.value),
          CONTENT_WIDTH - 49,
        ) as string[];
        return height + Math.max(6, valueLines.length * LINE_HEIGHT + 1);
      }, 0);

    // Mantém cada registo unido sempre que ele cabe numa página completa.
    ensureSpace(Math.min(recordHeight, CONTENT_BOTTOM - CONTENT_TOP));
    document.setFillColor(248, 250, 252);
    document.setDrawColor(...BORDER);
    document.roundedRect(MARGIN_X, cursorY, CONTENT_WIDTH, 9, 2, 2, 'FD');
    document.setTextColor(...BRAND_BLUE);
    document.setFont('helvetica', 'bold');
    document.setFontSize(9.5);
    document.text(title, MARGIN_X + 4, cursorY + 6);
    cursorY += 12;

    fields.forEach((field) => {
      const labelWidth = 43;
      const valueLines = document.splitTextToSize(
        displayValue(field.value),
        CONTENT_WIDTH - labelWidth - 6,
      ) as string[];
      const fieldHeight = Math.max(6, valueLines.length * LINE_HEIGHT + 1);
      ensureSpace(fieldHeight + 2);
      document.setTextColor(...MUTED);
      document.setFont('helvetica', 'bold');
      document.setFontSize(8);
      document.text(field.label, MARGIN_X + 3, cursorY + 3.6);
      document.setTextColor(...TEXT);
      document.setFont('helvetica', 'normal');
      document.setFontSize(9);
      document.text(valueLines, MARGIN_X + labelWidth, cursorY + 3.6);
      cursorY += fieldHeight;
    });

    document.setDrawColor(...BORDER);
    document.line(MARGIN_X, cursorY + 1, PAGE_WIDTH - MARGIN_X, cursorY + 1);
    cursorY += 6;
  };

  drawHeader();

  const heroHeight = assets.animalImageDataUrl ? 42 : 29;
  ensureSpace(heroHeight + 5);
  document.setFillColor(248, 250, 252);
  document.setDrawColor(...BORDER);
  document.roundedRect(MARGIN_X, cursorY, CONTENT_WIDTH, heroHeight, 3, 3, 'FD');
  document.setTextColor(...TEXT);
  document.setFont('helvetica', 'bold');
  document.setFontSize(19);
  document.text(data.animal.name, MARGIN_X + 7, cursorY + 11);
  document.setFont('helvetica', 'normal');
  document.setFontSize(9.5);
  document.setTextColor(...MUTED);
  document.text(
    [data.animal.species?.name, data.animal.breed?.name].filter(Boolean).join(' - ') || 'Espécie não definida',
    MARGIN_X + 7,
    cursorY + 18,
  );
  document.setFontSize(7.5);
  document.text(`Referência: ${data.animal.id}`, MARGIN_X + 7, cursorY + 24);

  if (assets.animalImageDataUrl) {
    try {
      document.addImage(assets.animalImageDataUrl, PAGE_WIDTH - MARGIN_X - 34, cursorY + 4, 30, 34);
    } catch {
      // A fotografia é opcional; o relatório continua válido se o formato não for suportado.
    }
  }

  cursorY += heroHeight + 5;

  drawSectionTitle('Identificação');
  drawFieldGrid([
    { label: 'Nome', value: data.animal.name },
    { label: 'Espécie', value: data.animal.species?.name ?? '-' },
    { label: 'Raça', value: data.animal.breed?.name ?? '-' },
    { label: 'Género', value: getMappedLabel(ANIMAL_GENDER_LABELS, data.animal.gender) },
    { label: 'Data de nascimento', value: formatDate(data.animal.birthDate) },
    { label: 'Estado', value: getMappedLabel(ANIMAL_STATUS_LABELS, data.animal.status) },
    { label: 'Disponibilidade', value: data.animal.available ? 'Disponível' : 'Indisponível' },
    { label: 'Registado em', value: formatDate(data.animal.createdAt, true) },
  ]);

  drawSectionTitle('Saúde e identificação eletrónica');
  drawFieldGrid([
    {
      label: 'Esterilização / castração',
      value: getMappedLabel(
        STERILIZATION_STATUS_LABELS,
        data.animal.sterilizationStatus,
        'Não definido',
      ),
    },
    { label: 'Data da esterilização', value: formatDate(data.animal.sterilizationDate) },
    { label: 'Tem microchip', value: data.animal.hasMicrochip ? 'Sim' : 'Não' },
    { label: 'Número do microchip', value: data.animal.microchipNumber ?? '-' },
    { label: 'Data de colocação', value: formatDate(data.animal.microchipDate) },
  ]);

  drawSectionTitle('Notas');
  drawTextBlock('Notas gerais', data.animal.generalNotes);
  drawTextBlock('Notas médicas', data.animal.medicalNotes);

  if (data.acceptedAdoption) {
    const adopter = data.acceptedAdoption.adopter;
    drawSectionTitle('Adoção');
    drawFieldGrid([
      {
        label: 'Adotante',
        value: [adopter.name, adopter.lastName].filter(Boolean).join(' ') || '-',
      },
      { label: 'Email', value: adopter.email || '-' },
      { label: 'Telefone', value: adopter.phone || '-' },
      { label: 'Data do pedido', value: formatDate(data.acceptedAdoption.applicationDate) },
      { label: 'Data da decisão', value: formatDate(data.acceptedAdoption.decisionDate) },
      { label: 'Referência da adoção', value: data.acceptedAdoption.id },
    ]);
  }

  drawSectionTitle(`Vacinação (${data.vaccines.length})`);
  if (data.vaccines.length === 0) {
    drawEmptyState('Não existem vacinas registadas.');
  } else {
    data.vaccines.forEach((vaccine, index) =>
      drawRecord(`${index + 1}. ${vaccine.name}`, [
        { label: 'Estado', value: getOptionLabel(VACCINE_STATUSES, vaccine.status) },
        { label: 'Data administrada', value: formatDate(vaccine.dateTaken) },
        { label: 'Data agendada', value: formatDate(vaccine.scheduledDate) },
        { label: 'Próxima dose', value: formatDate(vaccine.nextDueDate) },
        { label: 'Notas', value: vaccine.notes ?? '-' },
        { label: 'Registada em', value: formatDate(vaccine.createdAt, true) },
      ]),
    );
  }

  drawSectionTitle(`Desparasitação (${data.dewormingRecords.length})`);
  if (data.dewormingRecords.length === 0) {
    drawEmptyState('Não existem desparasitações registadas.');
  } else {
    data.dewormingRecords.forEach((record, index) =>
      drawRecord(`${index + 1}. ${getOptionLabel(DEWORMING_TYPES, record.type)}`, [
        { label: 'Data realizada', value: formatDate(record.dateDone) },
        { label: 'Próxima aplicação', value: formatDate(record.nextDueDate) },
        { label: 'Produto', value: record.productName ?? '-' },
        { label: 'Notas', value: record.notes ?? '-' },
        { label: 'Registada em', value: formatDate(record.createdAt, true) },
      ]),
    );
  }

  drawSectionTitle(`Consultas veterinárias (${data.vetAppointments.length})`);
  if (data.vetAppointments.length === 0) {
    drawEmptyState('Não existem consultas veterinárias registadas.');
  } else {
    data.vetAppointments.forEach((appointment, index) =>
      drawRecord(`${index + 1}. ${formatDate(appointment.appointmentDate)}`, [
        { label: 'Motivo', value: appointment.reason },
        { label: 'Clínica', value: appointment.clinicName ?? '-' },
        { label: 'Veterinário', value: appointment.veterinarianName ?? '-' },
        { label: 'Resultado', value: appointment.result ?? '-' },
        { label: 'Próxima consulta', value: formatDate(appointment.nextAppointmentDate) },
        { label: 'Notas', value: appointment.notes ?? '-' },
        { label: 'Registada em', value: formatDate(appointment.createdAt, true) },
      ]),
    );
  }

  const pageCount = document.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    document.setPage(page);
    document.setDrawColor(...BORDER);
    document.line(MARGIN_X, 284, PAGE_WIDTH - MARGIN_X, 284);
    document.setTextColor(...MUTED);
    document.setFont('helvetica', 'normal');
    document.setFontSize(7.5);
    document.text(`Gerado em ${formatDate(generatedAt.toISOString(), true)} | SIGA`, MARGIN_X, 289);
    document.text(`Página ${page} de ${pageCount}`, PAGE_WIDTH - MARGIN_X, 289, { align: 'right' });
  }

  return document;
}

export function getAnimalReportFilename(animalName: string): string {
  const safeName = animalName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `relatorio-siga-${safeName || 'animal'}.pdf`;
}

function drawLogoFallback(document: jsPDF): void {
  document.setFillColor(255, 255, 255);
  document.circle(26, 17, 10, 'F');
  document.setTextColor(...BRAND_BLUE);
  document.setFont('helvetica', 'bold');
  document.setFontSize(11);
  document.text('SIGA', 26, 19.5, { align: 'center' });
}

function displayValue(value: string | null | undefined): string {
  const normalized = value?.toString().trim();
  return normalized || '-';
}

function formatDate(value: string | null | undefined, includeTime = false): string {
  if (!value) {
    return '-';
  }

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

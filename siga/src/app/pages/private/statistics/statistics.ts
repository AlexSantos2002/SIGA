import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
  type ChartConfiguration,
  type ChartOptions,
  type Plugin,
} from 'chart.js';
import type { Workbook as ExcelWorkbook, Worksheet as ExcelWorksheet } from 'exceljs';
import { Subscription } from 'rxjs';

import {
  ANIMAL_GENDER_LABELS,
  ANIMAL_STATUS_LABELS,
  getMappedLabel,
} from '../../../constants/form-options';
import { Adoption } from '../../../models/adoption/adoption.model';
import {
  AnimalCareRecord,
  AnimalCareType,
} from '../../../models/animal-health/animal-care-record.model';
import { Adopter } from '../../../models/adopter/adopter.model';
import { Animal } from '../../../models/animal/animal.model';
import { AdoptionService } from '../../../services/adoption/adoption.service';
import { AdoptersService } from '../../../services/adopter/adopters.service';
import { AnimalCareService } from '../../../services/animal-health/animal-care.service';
import { AnimalService } from '../../../services/animal/animal.service';
import { getTimelineState } from '../care/care-timeline.helpers';

interface SummaryMetric {
  label: string;
  value: string | number;
  detail: string;
}

interface ChartEntry {
  label: string;
  value: number;
  color: string;
}

interface ExportSection {
  title: string;
  rows: (string | number)[][];
}

interface BarChartItem extends ChartEntry {
  percent: number;
}

interface PieSegment extends ChartEntry {
  percent: number;
}

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
);

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics.html',
  styleUrl: './statistics.css',
})
export class Statistics implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('statisticsChart') private chartCanvases?: QueryList<ElementRef<HTMLCanvasElement>>;

  animals: Animal[] = [];
  adoptions: Adoption[] = [];
  adopters: Adopter[] = [];
  careRecords: AnimalCareRecord[] = [];

  isLoading = true;
  isExporting = false;
  errorMessage = '';

  private charts = new Map<string, Chart>();
  private chartCanvasChangesSubscription?: Subscription;

  private readonly chartColors = [
    '#2f6fd6',
    '#16a34a',
    '#f59e0b',
    '#a855f7',
    '#ef4444',
    '#0f766e',
    '#64748b',
  ];

  constructor(
    private animalService: AnimalService,
    private adoptionService: AdoptionService,
    private adoptersService: AdoptersService,
    private animalCareService: AnimalCareService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadStatistics();
  }

  ngAfterViewInit(): void {
    this.chartCanvasChangesSubscription = this.chartCanvases?.changes.subscribe(() => {
      this.renderCharts();
    });

    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.chartCanvasChangesSubscription?.unsubscribe();
    this.destroyCharts();
  }

  get metrics(): SummaryMetric[] {
    return [
      {
        label: 'Animais registados',
        value: this.animals.length,
        detail: `${this.availableAnimalsCount} disponiveis para adocao`,
      },
      {
        label: 'Taxa de adocao',
        value: `${this.adoptionSuccessRate}%`,
        detail: `${this.acceptedAdoptionsCount} processos aceites`,
      },
      {
        label: 'Processos em aberto',
        value: this.pendingAdoptionsCount,
        detail: `${this.completedAdoptionsCount} processos concluidos`,
      },
      {
        label: 'Avisos de cuidados',
        value: this.careAlertsCount,
        detail: `${this.pendingCareRecordsCount} cuidados pendentes`,
      },
      {
        label: 'Adotantes',
        value: this.adopters.length,
        detail: `${this.flaggedAdoptersCount} sinalizados`,
      },
    ];
  }

  get animalStatusBars(): BarChartItem[] {
    const counts = this.countBy(this.animals, (animal) =>
      getMappedLabel(ANIMAL_STATUS_LABELS, animal.status, 'Nao definido'),
    );

    return this.createBarItems(this.mapCountsToEntries(counts));
  }

  get speciesBars(): BarChartItem[] {
    const counts = this.countBy(this.animals, (animal) => animal.species?.name ?? 'Sem especie');

    return this.createBarItems(this.mapCountsToEntries(counts, 6));
  }

  get adoptionMonthlyBars(): BarChartItem[] {
    const months = this.getLastMonths(6);
    const entries = months.map((month, index) => {
      const value = this.adoptions.filter((adoption) =>
        this.isDateInMonth(adoption.applicationDate, month.date),
      ).length;

      return {
        label: month.label,
        value,
        color: this.chartColors[index % this.chartColors.length],
      };
    });

    return this.createBarItems(entries);
  }

  get acceptedAdoptionMonthlyBars(): BarChartItem[] {
    const months = this.getLastMonths(6);
    const entries = months.map((month, index) => {
      const value = this.acceptedAdoptions.filter((adoption) =>
        this.isDateInMonth(adoption.decisionDate ?? adoption.applicationDate, month.date),
      ).length;

      return {
        label: month.label,
        value,
        color: this.chartColors[index % this.chartColors.length],
      };
    });

    return this.createBarItems(entries);
  }

  get adoptedSpeciesBars(): BarChartItem[] {
    const counts = this.countBy(
      this.acceptedAdoptions,
      (adoption) => adoption.animal.species?.name ?? 'Sem especie',
    );

    return this.createBarItems(this.mapCountsToEntries(counts, 6));
  }

  get adoptedBreedBars(): BarChartItem[] {
    const counts = this.countBy(
      this.acceptedAdoptions,
      (adoption) => adoption.animal.breed?.name ?? 'Sem raca',
    );

    return this.createBarItems(this.mapCountsToEntries(counts, 6));
  }

  get adopterHousingBars(): BarChartItem[] {
    const counts = this.countBy(this.adopters, (adopter) =>
      this.formatSimpleLabel(adopter.housingType, 'Nao indicado'),
    );

    return this.createBarItems(this.mapCountsToEntries(counts, 6));
  }

  get adopterPreferredSpeciesBars(): BarChartItem[] {
    const counts = this.countBy(this.adopters, (adopter) =>
      this.formatSimpleLabel(adopter.preferredSpecies, 'Nao indicado'),
    );

    return this.createBarItems(this.mapCountsToEntries(counts, 6));
  }

  get careTypeBars(): BarChartItem[] {
    const labels: Record<AnimalCareType, string> = {
      vaccine: 'Vacinas',
      deworming: 'Desparasitacoes',
      appointment: 'Consultas',
    };

    const counts = this.countBy(this.careRecords, (record) => labels[record.type]);

    return this.createBarItems(this.mapCountsToEntries(counts));
  }

  get animalAvailabilityPie(): PieSegment[] {
    return this.createPieSegments([
      {
        label: 'Disponiveis',
        value: this.availableAnimalsCount,
        color: '#16a34a',
      },
      {
        label: 'Indisponiveis',
        value: this.animals.length - this.availableAnimalsCount,
        color: '#94a3b8',
      },
    ]);
  }

  get adoptionStatusPie(): PieSegment[] {
    return this.createPieSegments([
      { label: 'Em aberto', value: this.pendingAdoptionsCount, color: '#f59e0b' },
      { label: 'Aceites', value: this.acceptedAdoptionsCount, color: '#16a34a' },
      {
        label: 'Rejeitados',
        value: this.adoptions.filter((adoption) => adoption.status === 'rejeitada').length,
        color: '#ef4444',
      },
      {
        label: 'Devolvidos',
        value: this.adoptions.filter((adoption) => adoption.status === 'devolvida').length,
        color: '#64748b',
      },
    ]);
  }

  get animalGenderPie(): PieSegment[] {
    const counts = this.countBy(this.animals, (animal) =>
      getMappedLabel(ANIMAL_GENDER_LABELS, animal.gender, 'Nao definido'),
    );

    return this.createPieSegments(this.mapCountsToEntries(counts));
  }

  get careStatusPie(): PieSegment[] {
    return this.createPieSegments([
      {
        label: 'Pendentes',
        value: this.pendingCareRecordsCount,
        color: '#f59e0b',
      },
      {
        label: 'Concluidos',
        value: this.careRecords.filter((record) => record.status === 'completed').length,
        color: '#16a34a',
      },
    ]);
  }

  get microchipPie(): PieSegment[] {
    return this.createPieSegments([
      {
        label: 'Com microchip',
        value: this.animals.filter((animal) => animal.hasMicrochip).length,
        color: '#2f6fd6',
      },
      {
        label: 'Sem microchip',
        value: this.animals.filter((animal) => !animal.hasMicrochip).length,
        color: '#94a3b8',
      },
    ]);
  }

  get availableAnimalsCount(): number {
    return this.animals.filter((animal) => animal.available).length;
  }

  get pendingAdoptionsCount(): number {
    return this.adoptions.filter((adoption) => adoption.status === 'pendente').length;
  }

  get acceptedAdoptionsCount(): number {
    return this.adoptions.filter((adoption) => adoption.status === 'aceita').length;
  }

  get completedAdoptionsCount(): number {
    return this.adoptions.filter((adoption) => adoption.status !== 'pendente').length;
  }

  get pendingCareRecordsCount(): number {
    return this.activeCareRecords.filter((record) => record.status === 'pending').length;
  }

  get careAlertsCount(): number {
    return this.activeCareRecords.filter((record) => {
      const state = getTimelineState(record);

      return state === 'overdue' || state === 'due_soon';
    }).length;
  }

  get flaggedAdoptersCount(): number {
    return this.adopters.filter((adopter) => adopter.isFlagged).length;
  }

  get adoptionSuccessRate(): number {
    if (this.completedAdoptionsCount === 0) {
      return 0;
    }

    return Math.round((this.acceptedAdoptionsCount / this.completedAdoptionsCount) * 100);
  }

  async exportStatisticsToExcel(): Promise<void> {
    if (this.isExporting) {
      return;
    }

    try {
      this.isExporting = true;
      this.cdr.detectChanges();

      const ExcelJS = await import('exceljs');
      const sections = this.buildExportSections();
      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'SIGA';
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.subject = 'Estatísticas da organização';
      workbook.title = 'Estatísticas SIGA';

      this.createSummaryWorksheet(workbook, sections);
      this.createDataWorksheet(workbook, sections);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `estatisticas-siga-${this.getExportDate()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      this.isExporting = false;
      this.cdr.detectChanges();
    }
  }

  private renderCharts(): void {
    if (this.isLoading || this.errorMessage || !this.chartCanvases) {
      return;
    }

    this.renderBarChart('animal-status', this.animalStatusBars, 'y');
    this.renderDoughnutChart('animal-availability', this.animalAvailabilityPie);
    this.renderBarChart('adoption-monthly', this.adoptionMonthlyBars, 'x');
    this.renderBarChart('accepted-adoption-monthly', this.acceptedAdoptionMonthlyBars, 'x');
    this.renderDoughnutChart('adoption-status', this.adoptionStatusPie);
    this.renderBarChart('adopted-species', this.adoptedSpeciesBars, 'y');
    this.renderBarChart('adopted-breeds', this.adoptedBreedBars, 'y');
    this.renderBarChart('species', this.speciesBars, 'y');
    this.renderDoughnutChart('animal-gender', this.animalGenderPie);
    this.renderDoughnutChart('microchip', this.microchipPie);
    this.renderBarChart('care-types', this.careTypeBars, 'y');
    this.renderDoughnutChart('care-status', this.careStatusPie);
    this.renderBarChart('adopter-housing', this.adopterHousingBars, 'y');
    this.renderBarChart('adopter-preferred-species', this.adopterPreferredSpeciesBars, 'y');
  }

  private renderBarChart(chartId: string, items: BarChartItem[], indexAxis: 'x' | 'y'): void {
    const canvas = this.getChartCanvas(chartId);

    if (!canvas || items.length === 0) {
      this.destroyChart(chartId);
      return;
    }

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: items.map((item) => item.label),
        datasets: [
          {
            data: items.map((item) => item.value),
            backgroundColor: items.map((item) => item.color),
            borderColor: items.map((item) => item.color),
            borderRadius: 7,
            borderSkipped: false,
            maxBarThickness: indexAxis === 'y' ? 20 : 46,
          },
        ],
      },
      options: this.getBarChartOptions(indexAxis),
      plugins: [this.createBarValueLabelsPlugin(indexAxis)],
    };

    this.replaceChart(chartId, canvas, config);
  }

  private renderDoughnutChart(chartId: string, segments: PieSegment[]): void {
    const canvas = this.getChartCanvas(chartId);

    if (!canvas || segments.length === 0) {
      this.destroyChart(chartId);
      return;
    }

    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: segments.map((segment) => segment.label),
        datasets: [
          {
            data: segments.map((segment) => segment.value),
            backgroundColor: segments.map((segment) => segment.color),
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 4,
          },
        ],
      },
      options: this.getDoughnutChartOptions(),
      plugins: [this.createCenterTextPlugin(chartId, `${total}`)],
    };

    this.replaceChart(chartId, canvas, config);
  }

  private getBarChartOptions(indexAxis: 'x' | 'y'): ChartOptions<'bar'> {
    const isHorizontal = indexAxis === 'y';

    return {
      animation: false,
      indexAxis,
      maintainAspectRatio: false,
      responsive: true,
      layout: {
        padding: isHorizontal ? { right: 34 } : { top: 20 },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => `Quantidade: ${context.parsed[isHorizontal ? 'x' : 'y']}`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: isHorizontal ? '#e5e7eb' : 'transparent',
          },
          ticks: {
            color: '#64748b',
            precision: 0,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: isHorizontal ? 'transparent' : '#e5e7eb',
          },
          ticks: {
            autoSkip: false,
            color: '#374151',
            precision: 0,
          },
        },
      },
    };
  }

  private getDoughnutChartOptions(): ChartOptions<'doughnut'> {
    return {
      animation: false,
      cutout: '58%',
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Number(context.raw ?? 0);
              const dataset = context.dataset.data.map((item) => Number(item));
              const total = dataset.reduce((sum, item) => sum + item, 0);
              const percent = total === 0 ? 0 : Math.round((value / total) * 100);

              return `${context.label}: ${value} (${percent}%)`;
            },
          },
        },
      },
    };
  }

  private createBarValueLabelsPlugin(indexAxis: 'x' | 'y'): Plugin<'bar'> {
    return {
      id: `bar-value-labels-${indexAxis}`,
      afterDatasetsDraw: (chart) => {
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        const isHorizontal = indexAxis === 'y';

        chart.ctx.save();
        chart.ctx.fillStyle = '#111827';
        chart.ctx.font = '600 13px Arial, sans-serif';
        chart.ctx.textAlign = isHorizontal ? 'left' : 'center';
        chart.ctx.textBaseline = 'middle';

        meta.data.forEach((element, index) => {
          const value = Number(dataset.data[index] ?? 0);
          const position = element.tooltipPosition(true);
          const x = position.x ?? 0;
          const y = position.y ?? 0;

          chart.ctx.fillText(`${value}`, isHorizontal ? x + 8 : x, isHorizontal ? y : y - 10);
        });

        chart.ctx.restore();
      },
    };
  }

  private createCenterTextPlugin(chartId: string, text: string): Plugin<'doughnut'> {
    return {
      id: `center-text-${chartId}`,
      afterDraw: (chart) => {
        const { bottom, left, right, top } = chart.chartArea;

        chart.ctx.save();
        chart.ctx.fillStyle = '#111827';
        chart.ctx.font = '700 22px Arial, sans-serif';
        chart.ctx.textAlign = 'center';
        chart.ctx.textBaseline = 'middle';
        chart.ctx.fillText(text, (left + right) / 2, (top + bottom) / 2);
        chart.ctx.restore();
      },
    };
  }

  private getChartCanvas(chartId: string): HTMLCanvasElement | null {
    return (
      this.chartCanvases?.find(
        (chartCanvas) => chartCanvas.nativeElement.dataset['chartId'] === chartId,
      )?.nativeElement ?? null
    );
  }

  private replaceChart(
    chartId: string,
    canvas: HTMLCanvasElement,
    config: ChartConfiguration<'bar'> | ChartConfiguration<'doughnut'>,
  ): void {
    this.destroyChart(chartId);
    this.charts.set(chartId, new Chart(canvas, config));
  }

  private destroyChart(chartId: string): void {
    this.charts.get(chartId)?.destroy();
    this.charts.delete(chartId);
  }

  private destroyCharts(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts.clear();
  }

  private get activeCareRecords(): AnimalCareRecord[] {
    return this.careRecords.filter((record) => record.animal.status !== 'adotado');
  }

  private get acceptedAdoptions(): Adoption[] {
    return this.adoptions.filter((adoption) => adoption.status === 'aceita');
  }

  private async loadStatistics(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const [animals, adoptions, adopters, careRecords] = await Promise.all([
        this.animalService.getAnimalsFromCurrentOrganization(),
        this.adoptionService.getAll(),
        this.adoptersService.getAll(),
        this.animalCareService.getAll(),
      ]);

      this.animals = animals;
      this.adoptions = adoptions;
      this.adopters = adopters;
      this.careRecords = careRecords;
    } catch (error: any) {
      console.error('Erro ao carregar estatisticas:', error);
      this.errorMessage =
        error?.message || error?.details || 'Nao foi possivel carregar as estatisticas.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
      this.renderCharts();
    }
  }

  private countBy<TItem>(
    items: TItem[],
    getKey: (item: TItem) => string | null | undefined,
  ): Map<string, number> {
    const counts = new Map<string, number>();

    for (const item of items) {
      const key = getKey(item)?.trim() || 'Nao definido';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return counts;
  }

  private mapCountsToEntries(counts: Map<string, number>, limit?: number): ChartEntry[] {
    const entries = [...counts.entries()]
      .map(([label, value], index) => ({
        label,
        value,
        color: this.chartColors[index % this.chartColors.length],
      }))
      .sort((firstEntry, secondEntry) => secondEntry.value - firstEntry.value);

    return typeof limit === 'number' ? entries.slice(0, limit) : entries;
  }

  private createBarItems(entries: ChartEntry[]): BarChartItem[] {
    const maxValue = Math.max(...entries.map((entry) => entry.value), 1);

    return entries.map((entry) => ({
      ...entry,
      percent: entry.value === 0 ? 0 : Math.max((entry.value / maxValue) * 100, 3),
    }));
  }

  private createPieSegments(entries: ChartEntry[]): PieSegment[] {
    const total = entries.reduce((sum, entry) => sum + entry.value, 0);

    if (total === 0) {
      return [];
    }

    return entries
      .filter((entry) => entry.value > 0)
      .map((entry) => ({
        ...entry,
        percent: (entry.value / total) * 100,
      }));
  }

  private buildExportSections(): ExportSection[] {
    return [
      {
        title: 'Resumo',
        rows: [
          ['Indicador', 'Valor', 'Detalhe'],
          ...this.metrics.map((metric) => [metric.label, metric.value, metric.detail]),
        ],
      },
      this.createChartExportSection('Animais por estado', this.animalStatusBars),
      this.createChartExportSection('Animais por especie', this.speciesBars),
      this.createChartExportSection('Genero dos animais', this.animalGenderPie),
      this.createChartExportSection('Disponibilidade dos animais', this.animalAvailabilityPie),
      this.createChartExportSection('Animais com microchip', this.microchipPie),
      this.createChartExportSection('Estado das adocoes', this.adoptionStatusPie),
      this.createChartExportSection('Pedidos de adocao por mes', this.adoptionMonthlyBars),
      this.createChartExportSection('Adocoes aceites por mes', this.acceptedAdoptionMonthlyBars),
      this.createChartExportSection('Especies mais adotadas', this.adoptedSpeciesBars),
      this.createChartExportSection('Racas mais adotadas', this.adoptedBreedBars),
      this.createChartExportSection('Tipo de habitacao dos adotantes', this.adopterHousingBars),
      this.createChartExportSection(
        'Especies preferidas pelos adotantes',
        this.adopterPreferredSpeciesBars,
      ),
      this.createChartExportSection('Cuidados registados', this.careTypeBars),
      this.createChartExportSection('Estado dos cuidados', this.careStatusPie),
    ];
  }

  private createChartExportSection(
    title: string,
    items: (BarChartItem | PieSegment)[],
  ): ExportSection {
    return {
      title,
      rows: [
        ['Categoria', 'Quantidade', 'Percentagem'],
        ...items.map((item) => [item.label, item.value, Number((item.percent / 100).toFixed(4))]),
      ],
    };
  }

  private createSummaryWorksheet(workbook: ExcelWorkbook, sections: ExportSection[]): void {
    const sheet = workbook.addWorksheet('Resumo', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    sheet.columns = [
      { width: 3 },
      { width: 34 },
      { width: 18 },
      { width: 42 },
      { width: 4 },
      { width: 34 },
      { width: 18 },
      { width: 18 },
    ];

    this.addPlainReportTitle(
      sheet,
      'B2',
      'Estatísticas SIGA',
      `Relatório gerado em ${new Intl.DateTimeFormat('pt-PT').format(new Date())}`,
    );

    let row = this.addPlainTable(sheet, 'B5', sections[0].title, sections[0]) + 2;
    row = this.addPlainTable(
      sheet,
      `B${row}`,
      'Estado das adoções',
      this.getExportSection(sections, 'Estado das adocoes'),
    );
    row += 2;
    row = this.addPlainTable(
      sheet,
      `B${row}`,
      'Espécies mais adotadas',
      this.getExportSection(sections, 'Especies mais adotadas'),
    );
    row += 2;
    this.addPlainTable(
      sheet,
      `B${row}`,
      'Raças mais adotadas',
      this.getExportSection(sections, 'Racas mais adotadas'),
    );
  }

  private createDataWorksheet(workbook: ExcelWorkbook, sections: ExportSection[]): void {
    const sheet = workbook.addWorksheet('Tabelas', {
      views: [{ state: 'frozen', ySplit: 4, showGridLines: true }],
    });

    sheet.columns = [{ width: 4 }, { width: 38 }, { width: 18 }, { width: 18 }, { width: 4 }];
    this.addPlainReportTitle(
      sheet,
      'B2',
      'Tabelas de estatísticas',
      'Dados exportados em tabelas simples, sem gráficos e sem cores.',
    );

    let row = 6;

    sections.forEach((section) => {
      row = this.addPlainTable(sheet, `B${row}`, section.title, section) + 2;
    });
  }

  private addPlainReportTitle(
    sheet: ExcelWorksheet,
    startCell: string,
    title: string,
    subtitle: string,
  ): void {
    const { column, row } = this.getCellCoordinates(startCell);
    const titleCell = sheet.getCell(row, column);

    titleCell.value = title;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { vertical: 'middle' };

    const subtitleCell = sheet.getCell(row + 1, column);
    subtitleCell.value = subtitle;
    subtitleCell.alignment = { vertical: 'middle' };

    sheet.getRow(row).height = 24;
    sheet.getRow(row + 1).height = 22;
  }

  private addPlainTable(
    sheet: ExcelWorksheet,
    startCell: string,
    title: string,
    section: ExportSection,
  ): number {
    const { column, row } = this.getCellCoordinates(startCell);
    const headers = section.rows[0];
    const rows = section.rows.slice(1);
    const tableRows =
      rows.length > 0 ? rows : [headers.map((_, index) => (index === 0 ? 'Sem dados' : ''))];
    const titleCell = sheet.getCell(row, column);

    titleCell.value = title;
    titleCell.font = { bold: true, size: 12 };
    titleCell.alignment = { vertical: 'middle' };

    headers.forEach((header, index) => {
      const cell = sheet.getCell(row + 1, column + index);

      cell.value = header;
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = {
        bottom: { style: 'thin' },
      };
    });

    tableRows.forEach((tableRow, rowIndex) => {
      tableRow.forEach((value, columnIndex) => {
        const cell = sheet.getCell(row + 2 + rowIndex, column + columnIndex);
        const header = String(headers[columnIndex]);

        cell.value = value;
        cell.alignment = { vertical: 'middle', wrapText: true };

        if (header.toLowerCase().includes('percentagem')) {
          cell.numFmt = '0%';
        }
      });
    });

    return row + tableRows.length + 2;
  }

  private getExportSection(sections: ExportSection[], title: string): ExportSection {
    return (
      sections.find((section) => section.title === title) ?? {
        title,
        rows: [['Categoria', 'Quantidade', 'Percentagem']],
      }
    );
  }

  private getCellCoordinates(cellAddress: string): { row: number; column: number } {
    const match = /^([A-Z]+)(\d+)$/i.exec(cellAddress);

    if (!match) {
      return { row: 1, column: 1 };
    }

    const column = match[1]
      .toUpperCase()
      .split('')
      .reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0);

    return {
      row: Number(match[2]),
      column,
    };
  }

  private getExportDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatSimpleLabel(value: string | null | undefined, fallback: string): string {
    if (!value) {
      return fallback;
    }

    return value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private getLastMonths(count: number): { date: Date; label: string }[] {
    const today = new Date();
    const months: { date: Date; label: string }[] = [];

    for (let index = count - 1; index >= 0; index -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - index, 1);

      months.push({
        date,
        label: new Intl.DateTimeFormat('pt-PT', {
          month: 'short',
        })
          .format(date)
          .replace('.', ''),
      });
    }

    return months;
  }

  private isDateInMonth(dateValue: string | null | undefined, monthDate: Date): boolean {
    if (!dateValue) {
      return false;
    }

    const date = new Date(dateValue);

    return (
      date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth()
    );
  }
}

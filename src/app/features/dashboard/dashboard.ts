import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../core/dashboard/dashboard.service';
import {
  AcceptedRejectedDatum,
  BrigadeDatum,
  CorrectiveActionProgressDatum,
  DashboardFilterOptions,
  DashboardFilters,
  DashboardSummary,
  MonthlyByStageDatum,
  ProcessDatum,
  StageFlowDatum,
  StatusDatum,
  TimeByStageDatum,
} from '../../core/dashboard/dashboard.models';
import { AuthService } from '../../core/auth/auth.service';

interface DonutDatum extends AcceptedRejectedDatum {
  label: string;
  color: string;
  percent: number;
  start: number;
  end: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  filters: DashboardFilters = {};

  readonly summary = signal<DashboardSummary | null>(null);
  readonly acceptedRejected = signal<AcceptedRejectedDatum[]>([]);
  readonly byStatus = signal<StatusDatum[]>([]);
  readonly byBrigade = signal<BrigadeDatum[]>([]);
  readonly byProcess = signal<ProcessDatum[]>([]);
  readonly stageFlow = signal<StageFlowDatum[]>([]);
  readonly correctiveProgress = signal<CorrectiveActionProgressDatum[]>([]);
  readonly timeByStage = signal<TimeByStageDatum[]>([]);
  readonly monthlyByStage = signal<MonthlyByStageDatum[]>([]);
  readonly filterOptions = signal<DashboardFilterOptions | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly lastUpdatedAt = signal<Date | null>(null);
  readonly authService = inject(AuthService);

  readonly maxStatusTotal = computed(() => this.maxTotal(this.byStatus()));
  readonly maxBrigadeTotal = computed(() => this.maxTotal(this.byBrigade()));
  readonly maxProcessTotal = computed(() => this.maxTotal(this.byProcess()));
  readonly maxStageFlowTotal = computed(() => this.maxTotal(this.stageFlow()));
  readonly maxCorrectiveTotal = computed(() => this.maxTotal(this.correctiveProgress()));
  readonly maxStageDays = computed(() => Math.max(...this.timeByStage().map((item) => item.diasPromedio), 1));
  readonly maxMonthlyTotal = computed(() => this.maxTotal(this.monthlyByStage()));
  readonly monthlyStageNames = computed(() => {
    const names = new Set<string>();
    this.monthlyByStage().forEach((month) => month.etapas.forEach((stage) => names.add(stage.nombre)));
    return Array.from(names);
  });
  readonly acceptedRejectedTotal = computed(() =>
    this.acceptedRejected().reduce((sum, current) => sum + current.valor, 0)
  );
  readonly acceptedRejectedChart = computed<DonutDatum[]>(() => {
    const total = this.acceptedRejectedTotal();
    let offset = 0;

    return this.acceptedRejected().map((item) => {
      const percent = total ? Math.round((item.valor / total) * 100) : 0;
      const start = offset;
      offset += percent;

      return {
        ...item,
        label: this.normalizeOutcome(item.estado),
        color: this.outcomeColor(item.estado),
        percent,
        start,
        end: offset,
      };
    });
  });
  readonly acceptedRejectedGradient = computed(() => {
    const segments = this.acceptedRejectedChart().filter((item) => item.valor > 0);

    if (!segments.length) {
      return 'conic-gradient(#eef3f5 0% 100%)';
    }

    return `conic-gradient(${segments
      .map((item) => `${item.color} ${item.start}% ${item.end}%`)
      .join(', ')})`;
  });

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      summary: this.dashboardService.getSummary(this.filters),
      acceptedRejected: this.dashboardService.getAcceptedRejected(this.filters),
      byStatus: this.dashboardService.getByStatus(this.filters),
      byBrigade: this.dashboardService.getByBrigade(this.filters),
      byProcess: this.dashboardService.getByProcess(this.filters),
      stageFlow: this.dashboardService.getStageFlow(this.filters),
      correctiveProgress: this.dashboardService.getCorrectiveActionProgress(this.filters),
      timeByStage: this.dashboardService.getTimeByStage(this.filters),
      monthlyByStage: this.dashboardService.getMonthlyByStage(this.filters),
    }).subscribe({
      next: (data) => {
        this.summary.set(data.summary);
        this.acceptedRejected.set(data.acceptedRejected);
        this.byStatus.set(data.byStatus);
        this.byBrigade.set(data.byBrigade);
        this.byProcess.set(data.byProcess);
        this.stageFlow.set(data.stageFlow);
        this.correctiveProgress.set(data.correctiveProgress);
        this.timeByStage.set(data.timeByStage);
        this.monthlyByStage.set(data.monthlyByStage);
        this.lastUpdatedAt.set(new Date());
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar la informacion del dashboard');
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.loadDashboard();
  }

  clearFilters(): void {
    this.filters = {};
    this.loadDashboard();
  }

  barWidth(value: number, max: number): string {
    if (max <= 0) return '0%';
    return `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%`;
  }

  progressWidth(value: number): string {
    return `${Math.min(Math.max(value, 0), 100)}%`;
  }

  monthlyBarHeight(value: number): string {
    const max = this.maxMonthlyTotal();
    if (max <= 0) return '0%';
    return `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%`;
  }

  monthlySegmentHeight(value: number, total: number): string {
    if (total <= 0) return '0%';
    return `${(value / total) * 100}%`;
  }

  stageTotal(month: MonthlyByStageDatum, name: string): number {
    return month.etapas.find((stage) => stage.nombre === name)?.total ?? 0;
  }

  stageColor(name: string): string {
    const colors = ['#20a8d8', '#f28c28', '#16875a', '#a6540b', '#7b61ff', '#e45f9a', '#0f5f78', '#8d99ae'];
    const index = this.monthlyStageNames().indexOf(name);
    return colors[Math.max(index, 0) % colors.length];
  }

  acceptedRejectedPercent(item: AcceptedRejectedDatum): number {
    const total = this.acceptedRejectedTotal();
    if (!total) return 0;
    return Math.round((item.valor / total) * 100);
  }

  private loadFilterOptions(): void {
    this.dashboardService.getFilterOptions().subscribe({
      next: (options) => this.filterOptions.set(options),
      error: () => this.filterOptions.set(null),
    });
  }

  private normalizeOutcome(value: string): string {
    const normalized = value.toLowerCase();
    if (normalized.includes('proceso')) return 'En proceso';
    if (normalized.includes('resuelt')) return 'Resueltos';
    if (normalized.includes('acept')) return 'Resueltos';
    if (normalized.includes('rechaz') || normalized.includes('anulad')) return 'Rechazados o anulados';
    return 'Pendientes';
  }

  private outcomeColor(value: string): string {
    const normalized = value.toLowerCase();
    if (normalized.includes('resuelt') || normalized.includes('acept')) return '#16875a';
    if (normalized.includes('rechaz') || normalized.includes('anulad')) return '#a6540b';
    return '#20a8d8';
  }

  private maxTotal(items: Array<{ total: number }>): number {
    return Math.max(...items.map((item) => item.total), 1);
  }
}

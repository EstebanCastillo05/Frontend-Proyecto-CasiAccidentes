import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../core/dashboard/dashboard.service';
import {
  AcceptedRejectedDatum,
  BrigadeDatum,
  CorrectiveActionProgressDatum,
  DashboardSummary,
  StatusDatum,
  TimeByStageDatum,
} from '../../core/dashboard/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly acceptedRejected = signal<AcceptedRejectedDatum[]>([]);
  readonly byStatus = signal<StatusDatum[]>([]);
  readonly byBrigade = signal<BrigadeDatum[]>([]);
  readonly correctiveProgress = signal<CorrectiveActionProgressDatum[]>([]);
  readonly timeByStage = signal<TimeByStageDatum[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly maxStatusTotal = computed(() => this.maxTotal(this.byStatus()));
  readonly maxBrigadeTotal = computed(() => this.maxTotal(this.byBrigade()));
  readonly maxStageDays = computed(() => Math.max(...this.timeByStage().map((item) => item.diasPromedio), 1));

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      summary: this.dashboardService.getSummary(),
      acceptedRejected: this.dashboardService.getAcceptedRejected(),
      byStatus: this.dashboardService.getByStatus(),
      byBrigade: this.dashboardService.getByBrigade(),
      correctiveProgress: this.dashboardService.getCorrectiveActionProgress(),
      timeByStage: this.dashboardService.getTimeByStage(),
    }).subscribe({
      next: (data) => {
        this.summary.set(data.summary);
        this.acceptedRejected.set(data.acceptedRejected);
        this.byStatus.set(data.byStatus);
        this.byBrigade.set(data.byBrigade);
        this.correctiveProgress.set(data.correctiveProgress);
        this.timeByStage.set(data.timeByStage);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar la informacion del dashboard');
        this.isLoading.set(false);
      },
    });
  }

  barWidth(value: number, max: number): string {
    if (max <= 0) return '0%';
    return `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%`;
  }

  acceptedRejectedPercent(item: AcceptedRejectedDatum): number {
    const total = this.acceptedRejected().reduce((sum, current) => sum + current.valor, 0);
    if (!total) return 0;
    return Math.round((item.valor / total) * 100);
  }

  private maxTotal(items: Array<{ total: number }>): number {
    return Math.max(...items.map((item) => item.total), 1);
  }
}

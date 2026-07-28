import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { CasoService } from '../../core/casos/caso.service';
import { Caso } from '../../core/casos/caso.models';

@Component({
  selector: 'app-acciones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './acciones.html',
  styleUrl: './acciones.css',
})
export class AccionesComponent implements OnInit {
  private readonly casoService = inject(CasoService);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly accionesList = signal<Caso[]>([]);
  readonly displayedColumns: string[] = ['numero_caso', 'titulo', 'estado', 'acciones'];

  ngOnInit(): void {
    this.cargarAcciones();
  }

  cargarAcciones(): void {
    this.isLoading.set(true);
    this.casoService.getAccionesCorrectivas().subscribe({
      next: (casos) => {
        this.accionesList.set(casos);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar acciones correctivas:', err);
        this.isLoading.set(false);
      },
    });
  }

  verCaso(idCaso: number | undefined): void {
    if (!idCaso) return;
    this.router.navigate(['/casos', idCaso, 'editar']);
  }
}
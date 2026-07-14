import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CasoService } from '../../core/casos/caso.service';
import { Caso, Catalogo } from '../../core/casos/caso.models';
import { ESTADOS_CASO } from '../../core/casos/caso-estados.data';
import { DatePipe } from '@angular/common';

const ESTADOS_EDITABLES = [5, 7, 8, 9, 10];
const ESTADO_ANULADO_ID = 14;
const ESTADOS_CERRADOS = [12, 13];

@Component({
  selector: 'app-caso-list',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    DatePipe,
  ],
  templateUrl: './caso-list.html',
  styleUrl: './caso-list.css',
})
export class CasoList implements OnInit {
  private readonly casoService = inject(CasoService);
  private readonly router = inject(Router);

  readonly casos = signal<Caso[]>([]);
  readonly regiones = signal<Catalogo[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly feedback = signal('');

  readonly estadosDisponibles = ESTADOS_CASO;
  readonly filtroRegion = signal<number | null>(null);
  readonly filtroEstado = signal<number | null>(null);

  readonly displayedColumns = ['numero_caso', 'titulo', 'brigada', 'region', 'estado', 'fecha_reporte', 'acciones'];

  ngOnInit(): void {
    this.casoService.getRegiones().subscribe({
      next: (regiones) => this.regiones.set(regiones.filter((r) => r.activo !== false)),
      error: () => {},
    });
    this.cargarCasos();
  }

  cargarCasos(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const filtros = {
      id_region: this.filtroRegion() ?? undefined,
      id_estado: this.filtroEstado() ?? undefined,
    };

    this.casoService.getCasos(filtros).subscribe({
      next: (casos) => {
        this.casos.set(casos);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudieron cargar los casos');
      },
    });
  }

  limpiarFiltros(): void {
    this.filtroRegion.set(null);
    this.filtroEstado.set(null);
    this.cargarCasos();
  }

  puedeEditar(caso: Caso): boolean {
    return ESTADOS_EDITABLES.includes(caso.id_estado ?? 0);
  }

  puedeAnular(caso: Caso): boolean {
    const estado = caso.id_estado ?? 0;
    return estado !== ESTADO_ANULADO_ID && !ESTADOS_CERRADOS.includes(estado);
  }

  claseEstado(caso: Caso): string {
    const estado = caso.id_estado ?? 0;
    if (estado === ESTADO_ANULADO_ID) return 'estado-anulado';
    if (estado === 5) return 'estado-rechazado';
    if (ESTADOS_CERRADOS.includes(estado)) return 'estado-cerrado';
    return 'estado-en-proceso';
  }

  nuevoCaso(): void {
    this.router.navigateByUrl('/casos/nuevo');
  }

  anular(caso: Caso): void {
    const motivo = window.prompt(`Motivo para anular el caso ${caso.numero_caso}:`);
    if (motivo === null) return; // cancelo el prompt
    if (!motivo.trim()) {
      this.errorMessage.set('El motivo es obligatorio para anular un caso');
      return;
    }

    this.casoService.anularCaso(caso.id_casi_accidente, motivo.trim()).subscribe({
      next: () => {
        this.feedback.set(`Caso ${caso.numero_caso} anulado correctamente`);
        this.cargarCasos();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'No se pudo anular el caso');
      },
    });
  }
}
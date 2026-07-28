import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CasoService } from '../../core/casos/caso.service';
import { Brigada, Caso, Catalogo } from '../../core/casos/caso.models';
import { ESTADOS_CASO } from '../../core/casos/caso-estados.data';
import { DatePipe } from '@angular/common';
import { MotivoDialogComponent } from '../../shared/components/motivo-dialog/motivo-dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../core/auth/auth.service';
import {
  ROL_ADMINISTRADOR, ROL_BRIGADA, ROL_PRL_CONTRATISTA,
  ROL_RESPONSABLE_PROCESO, ROL_GESTOR_SYMA, ROL_GESTION_CONTROL_SYMA,
} from '../../core/auth/roles.constants';

const ESTADOS_EDITABLES = [5, 7, 8, 9, 10];
const ESTADO_ANULADO_ID = 14;
const ESTADOS_CERRADOS = [12, 13];

const ROLES_PUEDEN_CREAR = [ROL_ADMINISTRADOR, ROL_BRIGADA];
const ROLES_PUEDEN_EDITAR = [ROL_ADMINISTRADOR, ROL_PRL_CONTRATISTA, ROL_RESPONSABLE_PROCESO, ROL_GESTOR_SYMA, ROL_GESTION_CONTROL_SYMA];
const ROLES_PUEDEN_ANULAR = [ROL_ADMINISTRADOR, ROL_PRL_CONTRATISTA];

@Component({
  selector: 'app-caso-list',
  standalone: true,
  imports: [
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
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
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly brigadaSearch$ = new Subject<string>();

  readonly casos = signal<Caso[]>([]);
  readonly regiones = signal<Catalogo[]>([]);
  readonly filteredBrigadas = signal<Brigada[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly feedback = signal('');

  readonly estadosDisponibles = ESTADOS_CASO;
  readonly filtroRegion = signal<number | null>(null);
  readonly filtroEstado = signal<number | null>(null);
  readonly filtroBrigadaId = signal<number | null>(null);
  readonly brigadaSearchTerm = signal('');

  // Título fijo para la pantalla de gestión general
  readonly tituloVista = computed(() => 'Gestión de Casos');

  readonly puedeCrear = computed(() => {
    const user = this.authService.currentUser();
    return !!user && ROLES_PUEDEN_CREAR.includes(user.id_rol);
  });

  readonly displayedColumns = ['numero_caso', 'titulo', 'brigada', 'region', 'estado', 'fecha_reporte', 'acciones'];

  ngOnInit(): void {
    const feedbackMsg = history.state?.feedback;
    if (feedbackMsg) this.feedback.set(feedbackMsg);

    this.casoService.getRegiones().subscribe({
      next: (regiones) => this.regiones.set(regiones.filter((r) => r.activo !== false)),
      error: () => {},
    });

    this.brigadaSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((texto) => this.casoService.searchBrigadas(texto))
      )
      .subscribe({
        next: (brigadas) => this.filteredBrigadas.set(brigadas.filter((b) => b.activo !== false)),
        error: () => {},
      });

    this.cargarCasos();
  }

  cargarCasos(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const user = this.authService.currentUser();
    if (!user) {
      this.isLoading.set(false);
      return;
    }

    const filtros = {
      id_region: this.filtroRegion() ?? undefined,
      id_estado: this.filtroEstado() ?? undefined,
      id_brigada: this.filtroBrigadaId() ?? undefined,
    };

    // Gestión de Casos consume directamente el endpoint general de casos
    this.casoService.getCasos(filtros).subscribe({
      next: (casos) => {
        this.casos.set(casos);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'No se pudieron cargar los casos');
      },
    });
  }

  displayBrigada(brigada: Brigada | string): string {
    if (typeof brigada === 'string') return brigada;
    return brigada?.nombre || '';
  }

  onBrigadaInput(): void {
    this.brigadaSearch$.next(this.brigadaSearchTerm());
    if (this.filtroBrigadaId() !== null) {
      this.filtroBrigadaId.set(null);
      this.cargarCasos();
    }
  }

  onBrigadaSelected(event: MatAutocompleteSelectedEvent): void {
    const brigada = event.option.value as Brigada;
    this.filtroBrigadaId.set(brigada.id_brigada);
    this.brigadaSearchTerm.set(brigada.nombre || '');
    this.cargarCasos();
  }

  limpiarFiltros(): void {
    this.filtroRegion.set(null);
    this.filtroEstado.set(null);
    this.filtroBrigadaId.set(null);
    this.brigadaSearchTerm.set('');
    this.filteredBrigadas.set([]);
    this.cargarCasos();
  }

  puedeEditar(caso: Caso): boolean {
    const user = this.authService.currentUser();
    if (!user || !ROLES_PUEDEN_EDITAR.includes(user.id_rol)) return false;
    return ESTADOS_EDITABLES.includes(caso.id_estado ?? 0);
  }

  puedeAnular(caso: Caso): boolean {
    const user = this.authService.currentUser();
    if (!user || !ROLES_PUEDEN_ANULAR.includes(user.id_rol)) return false;
    const estado = caso.id_estado ?? 0;
    return estado !== ESTADO_ANULADO_ID && !ESTADOS_CERRADOS.includes(estado);
  }

  puedeReactivar(caso: Caso): boolean {
    const user = this.authService.currentUser();
    if (!user || !ROLES_PUEDEN_ANULAR.includes(user.id_rol)) return false; 
    return caso.id_estado === ESTADO_ANULADO_ID;
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
    const dialogRef = this.dialog.open(MotivoDialogComponent, {
      width: '450px',
      data: {
        titulo: `Anular Caso ${caso.numero_caso}`,
        subtitulo: 'Por favor, ingresa el motivo obligatorio para proceder con la anulación del expediente:',
      },
    });

    dialogRef.afterClosed().subscribe((motivo) => {
      if (!motivo) return;

      this.isSaving.set(true);
      this.casoService.anularCaso(caso.id_casi_accidente, motivo).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.feedback.set(`Caso ${caso.numero_caso} anulado correctamente`);
          this.cargarCasos();
        },
        error: (error) => {
          this.isSaving.set(false);
          this.errorMessage.set(error.error?.message || 'No se pudo anular el caso');
        },
      });
    });
  }

  editarCaso(caso: Caso): void {
    this.router.navigate(['/casos', caso.id_casi_accidente, 'editar']);
  }

  reactivar(caso: Caso): void {
    this.isSaving.set(true);
    this.casoService.reactivarCaso(caso.id_casi_accidente).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.feedback.set(`Caso ${caso.numero_caso} reactivado correctamente`);
        this.cargarCasos();
      },
      error: (error) => {
        this.isSaving.set(false);
        this.errorMessage.set(error.error?.message || 'No se pudo reactivar el caso');
      },
    });
  }
}
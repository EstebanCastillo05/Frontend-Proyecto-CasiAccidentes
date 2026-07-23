import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CasoService } from '../../core/casos/caso.service';
import { Brigada, Caso, Catalogo } from '../../core/casos/caso.models';
import { DocumentoListComponent } from '../documentos/documento-list/documento-list';
import { DocumentoUploadComponent } from '../documentos/documento-upload/documento-upload';
import { MotivoDialogComponent } from '../../shared/components/motivo-dialog/motivo-dialog';
import { CasoTimelineComponent, HistorialEstadoItem } from './components/caso-timeline/caso-timeline';

const ESTADOS_EDITABLES = [5, 7, 8, 9, 10];

@Component({
  selector: 'app-caso-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDialogModule,
    TextFieldModule,
    DocumentoUploadComponent,
    DocumentoListComponent,
    CasoTimelineComponent,
  ],
  templateUrl: './caso-form.html',
  styleUrl: './caso-form.css',
})
export class CasoForm implements OnInit {
  private readonly casoService = inject(CasoService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  readonly filteredBrigadas = signal<Brigada[]>([]);
  readonly procesos = signal<Catalogo[]>([]);
  readonly contratistas = signal<Catalogo[]>([]);
  readonly regionSeleccionada = signal<string>('');
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly savedCaso = signal<Caso | null>(null);

  readonly isEditMode = signal(false);
  readonly casoId = signal<number | null>(null);
  readonly formBloqueado = signal(false);
  readonly mostrarSeccionDocumentos = signal(false);
  readonly documentoList = viewChild(DocumentoListComponent);

  // Señal para alimentar la línea de tiempo con la trazabilidad del backend
  readonly historialCaso = signal<HistorialEstadoItem[]>([]);

  readonly casoIdParaDocumentos = computed(() => this.savedCaso()?.id_casi_accidente ?? this.casoId() ?? null);

  // Control de estados para la UI condicional
  readonly casoActual = signal<Caso | null>(null);
  readonly esNuevo = computed(() => this.casoActual()?.id_estado === 1);
  readonly esEvaluado = computed(() => {
    const estado = this.casoActual()?.id_estado ?? 0;
    return [2, 3, 4, 7, 8, 9, 10, 11].includes(estado);
  });
  readonly esCerrado = computed(() => {
    const estado = this.casoActual()?.id_estado ?? 0;
    return [12, 13, 14].includes(estado);
  });

  readonly form = this.formBuilder.nonNullable.group({
    titulo: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    brigadaSearch: ['', [Validators.required]],
    id_brigada: [0, [Validators.required, Validators.min(1)]],
    procesoSearch: ['', [Validators.required]],
    id_proceso: [0, [Validators.required, Validators.min(1)]],
    id_contratista: [null as number | null],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode.set(true);
      this.casoId.set(Number(idParam));
    }

    this.form.controls.brigadaSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((texto) => this.casoService.searchBrigadas(texto || ''))
      )
      .subscribe({
        next: (brigadas) => this.filteredBrigadas.set(brigadas.filter((b) => b.activo !== false)),
        error: () => this.errorMessage.set('No se pudieron buscar brigadas'),
      });

    this.casoService.getProcesos().subscribe({
      next: (procesos) => this.procesos.set(procesos.filter((p) => p.activo !== false)),
      error: () => this.errorMessage.set('No se pudieron cargar los procesos'),
    });

    this.casoService.getContratistas().subscribe({
      next: (contratistas) => this.contratistas.set(contratistas.filter((c) => c.activo !== false)),
      error: () => {},
    });

    if (this.isEditMode() && this.casoId()) {
      this.cargarCasoParaEditar(this.casoId()!);
    } else {
      this.isLoading.set(false);
    }
  }

  private cargarCasoParaEditar(id: number): void {
    this.isLoading.set(true);
    this.casoService.getCaso(id).subscribe({
      next: (caso) => {
        this.casoActual.set(caso);
        
        // Mapeo del historial para la línea de tiempo
        if (caso.historial_estados && Array.isArray(caso.historial_estados)) {
          this.historialCaso.set(caso.historial_estados);
        }

        if (this.esCerrado()) {
          this.isLoading.set(false);
          this.form.disable();
          this.formBloqueado.set(true);
          this.errorMessage.set(`El caso se encuentra cerrado o anulado (${caso.estados?.nombre})`);
          return;
        }

        this.form.patchValue({
          titulo: caso.titulo ?? '',
          descripcion: caso.descripcion ?? '',
          brigadaSearch: caso.brigadas?.nombre ?? '',
          id_brigada: caso.id_brigada ?? 0,
          procesoSearch: caso.procesos?.nombre ?? '',
          id_proceso: caso.id_proceso ?? 0,
          id_contratista: caso.id_contratista ?? null,
        });
        this.regionSeleccionada.set(caso.regiones?.nombre || 'Sin región asignada');
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudo cargar el caso para editar');
      },
    });
  }

  displayBrigada(brigada: Brigada | string): string {
    if (typeof brigada === 'string') return brigada;
    return brigada?.nombre || '';
  }

  displayProceso(proceso: Catalogo | string): string {
    if (typeof proceso === 'string') return proceso;
    return proceso?.nombre || '';
  }

  onBrigadaSelected(event: MatAutocompleteSelectedEvent): void {
    const brigada = event.option.value as Brigada;
    this.form.patchValue({
      id_brigada: brigada.id_brigada,
      brigadaSearch: brigada.nombre || '',
    });
    this.regionSeleccionada.set(brigada.regiones?.nombre || 'Sin región asignada');
  }

  onBrigadaSearchChange(): void {
    this.form.controls.id_brigada.setValue(0);
    this.regionSeleccionada.set('');
  }

  onProcesoSelected(event: MatAutocompleteSelectedEvent): void {
    const proceso = event.option.value as Catalogo;
    this.form.patchValue({
      id_proceso: proceso.id_proceso,
      procesoSearch: proceso.nombre || '',
    });
  }

  onProcesoSearchChange(): void {
    this.form.controls.id_proceso.setValue(0);
  }

  filteredProcesos(): Catalogo[] {
    const texto = (this.form.controls.procesoSearch.value || '').toLowerCase();
    if (!texto) return this.procesos();
    return this.procesos().filter((p) => (p.nombre || '').toLowerCase().includes(texto));
  }

  evaluarCaso(): void {
    const id = this.casoId();
    if (!id) return;

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.casoService.evaluarCaso(id).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/casos'], { state: { feedback: 'Caso evaluado correctamente' } });
      },
      error: (error) => {
        this.isSaving.set(false);
        this.errorMessage.set(error.error?.message || 'No se pudo evaluar el caso');
      },
    });
  }

  asignarCorreccion(): void {
    const id = this.casoId();
    if (!id) return;

    this.router.navigate(['/casos', id, 'correcciones']);
  }

  cerrarCaso(): void {
    const id = this.casoId();
    if (!id) return;

    const dialogRef = this.dialog.open(MotivoDialogComponent, {
      width: '450px',
      data: {
        titulo: 'Cierre Formal de Caso',
        subtitulo: 'Por favor, ingresa el motivo y las observaciones obligatorias para realizar el cierre formal:',
      },
    });

    dialogRef.afterClosed().subscribe((motivo) => {
      if (!motivo) return;

      this.isSaving.set(true);
      this.errorMessage.set('');

      this.casoService.cerrarCaso(id, motivo).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.router.navigate(['/casos'], { state: { feedback: 'Caso cerrado formalmente con éxito' } });
        },
        error: (error) => {
          this.isSaving.set(false);
          this.errorMessage.set(error.error?.message || 'No se pudo cerrar el caso');
        },
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const { titulo, descripcion, id_brigada, id_proceso, id_contratista } = this.form.getRawValue();
    const payload = { titulo, descripcion, id_brigada, id_proceso, id_contratista: id_contratista || undefined };

    if (this.isEditMode() && this.casoId()) {
      this.casoService.updateCaso(this.casoId()!, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.router.navigate(['/casos'], { state: { feedback: 'Caso actualizado correctamente' } });
        },
        error: (error) => {
          this.isSaving.set(false);
          this.errorMessage.set(error.error?.message || 'No se pudo actualizar el caso');
        },
      });
      return;
    }

    this.casoService.createCaso(payload).subscribe({
      next: (caso) => {
        this.isSaving.set(false);
        this.savedCaso.set(caso);
      },
      error: (error) => {
        this.isSaving.set(false);
        this.errorMessage.set(error.error?.message || 'No se pudo registrar el caso');
      },
    });
  }

  irASubirFormato(): void {
    this.mostrarSeccionDocumentos.set(true);
  }

  onDocumentoSubido(): void {
    this.documentoList()?.reload();
  }

  irABandeja(): void {
    this.router.navigateByUrl('/casos');
  }

  registrarOtro(): void {
    this.savedCaso.set(null);
    this.regionSeleccionada.set('');
    this.filteredBrigadas.set([]);
    this.form.reset({
      titulo: '',
      descripcion: '',
      brigadaSearch: '',
      id_brigada: 0,
      procesoSearch: '',
      id_proceso: 0,
      id_contratista: null,
    });
  }
}
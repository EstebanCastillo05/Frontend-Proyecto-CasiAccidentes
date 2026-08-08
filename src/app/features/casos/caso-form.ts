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
import { AuthService } from '../../core/auth/auth.service';
import {
  ROL_RESPONSABLE_PROCESO,
  ROL_PRL_CONTRATISTA,
  ROL_GESTOR_SYMA,
  ROL_GESTION_CONTROL_SYMA,
} from '../../core/auth/roles.constants';

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
  private readonly authService = inject(AuthService);

  readonly filteredBrigadas = signal<Brigada[]>([]);
  readonly procesos = signal<Catalogo[]>([]);
  readonly regionSeleccionada = signal<string>('');
  readonly responsableAsignado = signal<string>('');
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly savedCaso = signal<Caso | null>(null);

  readonly isEditMode = signal(false);
  readonly casoId = signal<number | null>(null);
  readonly formBloqueado = signal(false);
  readonly mostrarSeccionDocumentos = signal(false);
  readonly documentoList = viewChild(DocumentoListComponent);

  readonly historialCaso = signal<HistorialEstadoItem[]>([]);
  readonly casoIdParaDocumentos = computed(() => this.savedCaso()?.id_casi_accidente ?? this.casoId() ?? null);

  readonly casoActual = signal<Caso | null>(null);
  readonly esNuevo = computed(() => this.casoActual()?.id_estado === 1);
  
  // Bloquea el formulario si está cerrado, anulado o rechazado (ID 5 o texto que incluya 'rechazado')
  readonly esBloqueado = computed(() => {
    const estado = this.casoActual()?.id_estado ?? 0;
    const estadoNombre = (this.casoActual()?.estados?.nombre || '').toLowerCase();
    return [12, 13, 14].includes(estado) || estado === 5 || estadoNombre.includes('rechazado');
  });

  // Señales específicas para el Responsable de Proceso
  readonly esResponsableRevisionInicial = computed(() => {
    const estadoId = this.casoActual()?.id_estado ?? 0;
    const estado = (this.casoActual()?.estados?.nombre || '').toLowerCase();
    const user = this.authService.currentUser();
    return user?.id_rol === ROL_RESPONSABLE_PROCESO &&
      estadoId === 3 &&
      estado.includes('pendiente de revision del responsable');
  });

  readonly esResponsableEnviarPrl = computed(() => {
    const estadoId = this.casoActual()?.id_estado ?? 0;
    const estado = (this.casoActual()?.estados?.nombre || '').toLowerCase();
    const user = this.authService.currentUser();
    return user?.id_rol === ROL_RESPONSABLE_PROCESO &&
      (estadoId === 6 || estado.includes('aceptado') || estado.includes('procede')) &&
      !this.tieneAprobacionSymaDivulgacion();
  });

  readonly esResponsablePostDivulgacion = computed(() => {
    const estadoId = this.casoActual()?.id_estado ?? 0;
    const estado = (this.casoActual()?.estados?.nombre || '').toLowerCase();
    const user = this.authService.currentUser();
    return user?.id_rol === ROL_RESPONSABLE_PROCESO &&
      (estadoId === 6 || estado.includes('aceptado') || estado.includes('procede')) &&
      this.tieneAprobacionSymaDivulgacion();
  });

  // Señales para el PRL
  readonly esPrlDivulgacion = computed(() => {
    const estado = (this.casoActual()?.estados?.nombre || '').toLowerCase();
    const user = this.authService.currentUser();
    return user?.id_rol === ROL_PRL_CONTRATISTA && estado.includes('pendiente de formato de divulgacion');
  });

  readonly esPrlEvidencias = computed(() => {
    const estado = (this.casoActual()?.estados?.nombre || '').toLowerCase();
    const user = this.authService.currentUser();
    return user?.id_rol === ROL_PRL_CONTRATISTA && (estado.includes('pendiente de evidencias') || estado.includes('acciones correctivas'));
  });

  // Señal para SYMA
  readonly esSymaFase = computed(() => {
    const estado = (this.casoActual()?.estados?.nombre || '').toLowerCase();
    const user = this.authService.currentUser();
    return (user?.id_rol === ROL_GESTOR_SYMA || user?.id_rol === ROL_GESTION_CONTROL_SYMA) && 
           (estado.includes('syma') || estado.includes('evidencias'));
  });

  readonly esSymaRevisionEvidencias = computed(() => {
    const estadoId = this.casoActual()?.id_estado ?? 0;
    const estado = (this.casoActual()?.estados?.nombre || '').toLowerCase();
    return estadoId === 11 || estado.includes('evidencias en revision');
  });

  readonly form = this.formBuilder.nonNullable.group({
    titulo: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    brigadaSearch: ['', [Validators.required]],
    id_brigada: [0, [Validators.required, Validators.min(1)]],
    procesoSearch: ['', [Validators.required]],
    id_proceso: [0, [Validators.required, Validators.min(1)]],
  });

  nombrePrlActual(): string {
    return this.authService.currentUser()?.nombre || 'Usuario no identificado';
  }

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
        
        if (caso.historial_estados && Array.isArray(caso.historial_estados)) {
          this.historialCaso.set(caso.historial_estados);
        }

        if (this.esBloqueado()) {
          this.isLoading.set(false);
          this.form.disable();
          this.formBloqueado.set(true);
          this.errorMessage.set(`El expediente se encuentra en modo de solo lectura (${caso.estados?.nombre})`);
          return;
        }

        this.form.patchValue({
          titulo: caso.titulo ?? '',
          descripcion: caso.descripcion ?? '',
          brigadaSearch: caso.brigadas?.nombre ?? '',
          id_brigada: caso.id_brigada ?? 0,
          procesoSearch: caso.procesos?.nombre ?? '',
          id_proceso: caso.id_proceso ?? 0,
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

    const asignacion = brigada.brigada_asignacion?.[0];
    this.responsableAsignado.set(asignacion?.usuarios_responsable?.nombre || '');
  }

  onBrigadaSearchChange(): void {
    this.form.controls.id_brigada.setValue(0);
    this.regionSeleccionada.set('');
    this.responsableAsignado.set('');
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

  marcarProcedencia(procede: boolean): void {
    const id = this.casoId();
    if (!id) return;

    if (!procede) {
      const dialogRef = this.dialog.open(MotivoDialogComponent, {
        width: '450px',
        data: {
          titulo: 'Caso No Procede',
          subtitulo: 'Ingresa el motivo por el cual este casi accidente no procede:',
        },
      });

      dialogRef.afterClosed().subscribe((motivo) => {
        if (!motivo) return;
        this.ejecutarValidacionProcedencia(false, motivo);
      });
    } else {
      this.ejecutarValidacionProcedencia(true);
    }
  }

  private ejecutarValidacionProcedencia(procede: boolean, motivo?: string): void {
    const id = this.casoId();
    if (!id) return;

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.casoService.validarProcedencia(id, procede, motivo).subscribe({
      next: () => {
        this.isSaving.set(false);
        const mensaje = procede ? 'Caso validado como procedente' : 'Caso marcado como no procedente';
        this.router.navigate(['/casos'], { state: { feedback: mensaje } });
      },
      error: (error) => {
        this.isSaving.set(false);
        this.errorMessage.set(error.error?.message || 'No se pudo procesar la validación');
      },
    });
  }

  enviarResponsable(): void {
    const id = this.casoId();
    if (!id) return;

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.casoService.gestionarResponsable(id, 'AVANZAR').subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/casos'], { state: { feedback: 'Caso gestionado por el responsable exitosamente' } });
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Error al procesar la gestión del responsable');
      },
    });
  }

  enviarResponsableAccion(accion: 'ENVIAR_CIERRE' | 'ENVIAR_ACCIONES' | 'CERRAR_SIN_ACCIONES'): void {
    const id = this.casoId();
    if (!id) return;

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.casoService.gestionarResponsable(id, accion).subscribe({
      next: () => {
        this.isSaving.set(false);
        const feedback =
          accion === 'CERRAR_SIN_ACCIONES'
            ? 'Caso cerrado sin acciones correctamente'
            : 'Caso derivado correctamente por el responsable';
        this.router.navigate(['/casos'], { state: { feedback } });
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Error al derivar el caso');
      },
    });
  }

  enviarPrlAResponsable(): void {
    const id = this.casoId();
    if (!id) return;

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.casoService.gestionarPrl(id).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/casos'], { state: { feedback: 'Caso devuelto al responsable con éxito' } });
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Error al enviar el caso al responsable');
      },
    });
  }

  ejecutarSyma(aprobado: boolean): void {
    const id = this.casoId();
    if (!id) return;

    if (!aprobado) {
      const dialogRef = this.dialog.open(MotivoDialogComponent, {
        width: '450px',
        data: {
          titulo: 'Gestión SYMA',
          subtitulo: 'Ingresa el motivo de rechazo o devolución por parte de SYMA:',
        },
      });
      dialogRef.afterClosed().subscribe((motivo) => {
        if (!motivo) return;
        this.enviarSymaBackend(id, false, motivo);
      });
    } else {
      this.enviarSymaBackend(id, true);
    }
  }

  private enviarSymaBackend(id: number, aprobado: boolean, motivo?: string): void {
    this.isSaving.set(true);
    this.errorMessage.set('');

    this.casoService.gestionarSyma(id, aprobado, motivo).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/casos'], { state: { feedback: 'Gestión SYMA completada correctamente' } });
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Error en la gestión SYMA');
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const { titulo, descripcion, id_brigada, id_proceso } = this.form.getRawValue();
    const payload = { titulo, descripcion, id_brigada, id_proceso };

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

  irABandeja(): void {
    this.router.navigateByUrl('/casos');
  }

  registrarOtro(): void {
    this.savedCaso.set(null);
    this.regionSeleccionada.set('');
    this.responsableAsignado.set('');
    this.filteredBrigadas.set([]);
    this.form.reset({
      titulo: '',
      descripcion: '',
      brigadaSearch: '',
      id_brigada: 0,
      procesoSearch: '',
      id_proceso: 0,
    });
  }

  onDocumentoSubido(): void {
    this.documentoList()?.reload();
  }

  private tieneAprobacionSymaDivulgacion(): boolean {
    let prlEnvioFormato = false;
    const normalizar = (texto: string) =>
      texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return this.historialCaso().some((item: any) => {
      const accion = normalizar(item.accion || '');
      const estadoOrigen = normalizar(item.estado_origen || '');

      if (accion.includes('prl_enviar_responsable') && estadoOrigen.includes('formato de divulgacion')) {
        prlEnvioFormato = true;
      }

      return prlEnvioFormato && accion.includes('syma_aprobar_divulgacion');
    });
  }
}

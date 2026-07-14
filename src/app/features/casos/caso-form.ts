import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CasoService } from '../../core/casos/caso.service';
import { Brigada, Caso, Catalogo } from '../../core/casos/caso.models';
import { TextFieldModule } from '@angular/cdk/text-field';

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
    TextFieldModule,
  ],
  templateUrl: './caso-form.html',
  styleUrl: './caso-form.css',
})
export class CasoForm implements OnInit {
  private readonly casoService = inject(CasoService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly brigadas = signal<Brigada[]>([]);
  readonly contratistas = signal<Catalogo[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly savedCaso = signal<Caso | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    titulo: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    brigadaSearch: ['', [Validators.required]],
    id_brigada: [0, [Validators.required, Validators.min(1)]],
    id_contratista: [null as number | null],
  });

  readonly filteredBrigadas = computed(() => {
    const texto = (this.form.controls.brigadaSearch.value || '').toLowerCase();
    if (!texto) return this.brigadas();
    return this.brigadas().filter((b) => (b.nombre || '').toLowerCase().includes(texto));
  });

  ngOnInit(): void {
    this.casoService.getBrigadas().subscribe({
      next: (brigadas) => {
        this.brigadas.set(brigadas.filter((b) => b.activo !== false));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudieron cargar las brigadas');
      },
    });

    this.casoService.getContratistas().subscribe({
      next: (contratistas) => this.contratistas.set(contratistas.filter((c) => c.activo !== false)),
      error: () => {}, // Si falla, simplemente no se ofrece el select; no bloquea el registro del caso.
    });
  }

  displayBrigada(brigada: Brigada | string): string {
    if (typeof brigada === 'string') return brigada;
    return brigada?.nombre || '';
  }

  onBrigadaSelected(event: MatAutocompleteSelectedEvent): void {
    const brigada = event.option.value as Brigada;
    this.form.patchValue({
      id_brigada: brigada.id_brigada,
      brigadaSearch: brigada.nombre || '',
    });
  }

  onBrigadaSearchChange(): void {
    // Si el usuario edita el texto despues de haber seleccionado una brigada,
    // invalidamos la seleccion previa para forzar que elija una opcion real de la lista.
    this.form.controls.id_brigada.setValue(0);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const { titulo, descripcion, id_brigada, id_contratista } = this.form.getRawValue();

    this.casoService
      .createCaso({ titulo, descripcion, id_brigada, id_contratista: id_contratista || undefined })
      .subscribe({
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
    const caso = this.savedCaso();
    if (!caso) return;
    this.router.navigate(['/documentos/nuevo', caso.id_casi_accidente]);
  }

  irABandeja(): void {
    this.router.navigateByUrl('/casos');
  }

  registrarOtro(): void {
    this.savedCaso.set(null);
    this.form.reset({ titulo: '', descripcion: '', brigadaSearch: '', id_brigada: 0, id_contratista: null });
  }
}
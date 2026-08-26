import { DatePipe } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { HistorialEstadoItem } from '../../../core/casos/caso.models';
import { BitacoraService } from '../../../core/bitacora/bitacora.service';

@Component({
  selector: 'app-bitacora-list',
  standalone: true,
  templateUrl: './bitacora-list.html',
  styleUrl: './bitacora-list.css',
  imports: [
    FormsModule,
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
})
export class BitacoraList implements OnChanges {
  @Input() idCaso?: number;

  private readonly bitacoraService = inject(BitacoraService);

  numeroCaso = '';
  historial = signal<HistorialEstadoItem[]>([]);
  isLoading = signal(false);
  buscado = signal(false);
  errorMessage = signal('');
  casoTitulo = signal('');

  readonly displayedColumns = ['accion', 'estado', 'usuario', 'comentario', 'fecha'];

  get modoBusqueda(): boolean {
    return !this.idCaso;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idCaso'] && this.idCaso) {
      this.cargarPorCaso();
    }
  }

  cargarPorCaso(): void {
    if (!this.idCaso) return;

    this.isLoading.set(true);
    this.buscado.set(true);
    this.errorMessage.set('');

    this.bitacoraService.obtenerPorCaso(this.idCaso).subscribe({
      next: (historial) => {
        this.historial.set(historial);
        this.isLoading.set(false);
      },
      error: () => {
        this.historial.set([]);
        this.isLoading.set(false);
        this.errorMessage.set('No se pudo cargar el historial del caso.');
      },
    });
  }

  buscar(): void {
    const numero = this.numeroCaso.trim();
    if (!numero) return;

    this.buscado.set(true);
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.casoTitulo.set('');

    this.bitacoraService.buscarPorNumeroCaso(numero).subscribe({
      next: (resp) => {
        this.historial.set(resp.data);
        this.casoTitulo.set(resp.caso?.titulo || '');
        this.isLoading.set(false);
      },
      error: (error) => {
        this.historial.set([]);
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'No se pudo consultar la bitacora e historial.');
      },
    });
  }
}
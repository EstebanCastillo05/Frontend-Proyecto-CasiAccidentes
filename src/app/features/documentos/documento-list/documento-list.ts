import { Component, Input, OnChanges, SimpleChanges, inject, signal, } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Documento } from '../../../core/documentos/documento.models';
import { DocumentoService } from '../../../core/documentos/documento.service';
import { DocumentoViewerComponent } from '../documento-viewer/documento-viewer';

@Component({
  selector: 'app-documento-list',
  standalone: true,
  templateUrl: './documento-list.html',
  styleUrl: './documento-list.css',
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
export class DocumentoListComponent implements OnChanges {

  @Input() idCaso?: number;

  private documentoService = inject(DocumentoService);
  private dialog = inject(MatDialog);

  documentos = signal<Documento[]>([]);
  isLoading = signal(false);
  buscado = signal(false);

  numeroCaso = '';

  readonly displayedColumns = [
    'tipo',
    'nombre',
    'version',
    'descripcion',
    'fecha',
    'acciones',
  ];

  get modoBusqueda(): boolean {
    return !this.idCaso;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idCaso'] && this.idCaso) {
      this.cargarPorCaso();
    }
  }

  reload(): void {
    if (this.idCaso) {
      this.cargarPorCaso();
    }
  }

  cargarPorCaso(): void {
    this.isLoading.set(true);
    this.buscado.set(true);
    this.documentoService.obtenerPorCaso(this.idCaso!).subscribe({
      next: (resp) => {
        console.log(resp);
        this.documentos.set(resp.data);
        this.isLoading.set(false);
      },

      error: (err) => {
        console.error(err);
        this.documentos.set([]);
        this.isLoading.set(false);
      }
    });
  }

  buscar(): void {
    if (!this.numeroCaso.trim()) {
      return;
    }

    this.buscado.set(true);
    this.isLoading.set(true);
    this.documentoService.buscarPorNumeroCaso(this.numeroCaso).subscribe({
      next: (resp) => {
        this.documentos.set(resp.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.documentos.set([]);
        this.isLoading.set(false);
      }
    });
  }

  abrirVistaPrevia(documento: Documento): void {
    this.dialog.open(DocumentoViewerComponent, {
      width: '95vw',
      maxWidth: '1400px',
      height: '90vh',
      data: documento
    });
  }

  descargar(documento: Documento): void {
    if (!documento.id_documento) return;
    this.documentoService
      .obtenerUrl(documento.id_documento)
      .subscribe({
        next: (resp) => {
          window.open(resp.data.url, '_blank');
        }
      });
  }
}
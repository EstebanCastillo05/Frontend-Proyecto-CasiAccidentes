import { Component, Input, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Documento } from '../../../core/documentos/documento.models';
import { DocumentoService } from '../../../core/documentos/documento.service';
import { DocumentoViewerComponent } from '../documento-viewer/documento-viewer';

@Component({
  selector: 'app-documento-list',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatMenuModule, MatTableModule, MatTooltipModule],
  templateUrl: './documento-list.html',
  styleUrl: './documento-list.css',
})
export class DocumentoListComponent implements OnChanges {
  @Input({ required: true }) idCaso!: number;

  private readonly documentoService = inject(DocumentoService);
  private readonly dialog = inject(MatDialog);

  readonly documentos = signal<Documento[]>([]);
  readonly isLoading = signal(false);

  readonly displayedColumns = ['tipo_documento', 'nombre', 'version', 'descripcion', 'fecha', 'usuario', 'acciones'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idCaso'] && this.idCaso) {
      this.cargarDocumentos();
    }
  }

  reload(): void {
    if (this.idCaso) {
      this.cargarDocumentos();
    }
  }

  cargarDocumentos(): void {
    this.isLoading.set(true);
    this.documentoService.obtenerPorCaso(this.idCaso).subscribe({
      next: (documentos) => {
        this.documentos.set(documentos);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  abrirVistaPrevia(documento: Documento): void {
    this.dialog.open(DocumentoViewerComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: documento,
    });
  }

  descargar(documento: Documento): void {
    if (!documento.id_documento) return;

    this.documentoService.descargar(documento.id_documento).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = documento.nombre_archivo ?? 'documento';
        link.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }
}

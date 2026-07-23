import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Documento } from '../../../core/documentos/documento.models';
import { DocumentoService } from '../../../core/documentos/documento.service';

@Component({
  selector: 'app-documento-viewer',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './documento-viewer.html',
  styleUrl: './documento-viewer.css',
})
export class DocumentoViewerComponent implements OnInit, OnDestroy {
  private readonly documentoService = inject(DocumentoService);
  private readonly dialogRef = inject(MatDialogRef<DocumentoViewerComponent>);
  private readonly dialogData = inject<Documento>(MAT_DIALOG_DATA);
  private readonly sanitizer = inject(DomSanitizer);

  readonly documento = this.dialogData;
  readonly previewUrl = signal<string | null>(null);
  readonly safePreviewUrl = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl() ?? ''));
  readonly isPdf = (this.documento?.nombre_archivo?.toLowerCase() ?? '').endsWith('.pdf');
  readonly isImage = ['.png', '.jpg', '.jpeg'].some((ext) => (this.documento?.nombre_archivo?.toLowerCase() ?? '').endsWith(ext));
  readonly isSupported = this.isPdf || this.isImage;

  ngOnInit(): void {
    if (!this.documento?.id_documento) {
      return;
    }

    this.documentoService.visualizar(this.documento.id_documento).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        this.previewUrl.set(url);
      },
    });
  }

  ngOnDestroy(): void {
    const currentUrl = this.previewUrl();
    if (currentUrl) {
      window.URL.revokeObjectURL(currentUrl);
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  descargar(): void {
    if (!this.documento.id_documento) return;

    this.documentoService.descargar(this.documento.id_documento).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.documento.nombre_archivo ?? 'documento';
        link.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }
}

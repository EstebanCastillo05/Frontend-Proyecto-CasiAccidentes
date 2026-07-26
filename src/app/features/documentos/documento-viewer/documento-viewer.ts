import {Component, OnInit, computed, inject, signal} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Documento } from '../../../core/documentos/documento.models';
import { DocumentoService } from '../../../core/documentos/documento.service';

@Component({
  selector: 'app-documento-viewer',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './documento-viewer.html',
  styleUrl: './documento-viewer.css',
})
export class DocumentoViewerComponent implements OnInit {

  private readonly documentoService = inject(DocumentoService);
  private readonly dialogRef = inject(MatDialogRef<DocumentoViewerComponent>);
  private readonly sanitizer = inject(DomSanitizer);

  readonly documento = inject<Documento>(MAT_DIALOG_DATA);

  readonly previewUrl = signal('');

  readonly safePreviewUrl = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl())
  );

  readonly isPdf =
    this.documento.nombre_archivo
      ?.toLowerCase()
      .endsWith('.pdf');

  readonly isImage =
    ['.png', '.jpg', '.jpeg', '.gif', '.webp']
      .some(ext =>
        this.documento.nombre_archivo
          ?.toLowerCase()
          .endsWith(ext)
      );

  readonly isSupported =
    this.isPdf || this.isImage;

  ngOnInit(): void {

    if (!this.documento.id_documento) {
      return;
    }

    this.documentoService
      .obtenerUrl(this.documento.id_documento)
      .subscribe({

        next: (resp) => {

          this.previewUrl.set(resp.data.url);

        }

      });

  }

  close(): void {

    this.dialogRef.close();

  }

  descargar(): void {

    window.open(this.previewUrl(), '_blank');

  }

}
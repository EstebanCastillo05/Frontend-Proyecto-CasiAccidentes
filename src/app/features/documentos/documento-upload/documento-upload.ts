import { Component, ElementRef, EventEmitter, Input, Output, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { DocumentoService } from '../../../core/documentos/documento.service';

@Component({
  selector: 'app-documento-upload',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    DecimalPipe,
  ],
  templateUrl: './documento-upload.html',
  styleUrl: './documento-upload.css',
})
export class DocumentoUploadComponent {
  @Input({ required: true }) idCaso!: number;
  @Output() documentoSubido = new EventEmitter<void>();

  private readonly documentoService = inject(DocumentoService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  // Cambiado a un arreglo de archivos para soportar múltiples selecciones
  readonly selectedFiles = signal<File[]>([]);
  readonly isUploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly errorMessage = signal('');
  readonly isDragOver = signal(false);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly form = this.formBuilder.nonNullable.group({
    idTipoDocumento: [1, [Validators.required]],
    descripcion: ['', [Validators.required, Validators.maxLength(500)]],
  });

  readonly tiposDocumento = [
    { value: 1, label: 'FO.PG.SEG.03.02' },
    { value: 2, label: 'FO.PG.SEG.04.03' },
    { value: 3, label: 'Evidencia' },
  ];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.handleFiles(files);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    this.handleFiles(files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  removeFile(index: number): void {
    const current = [...this.selectedFiles()];
    current.splice(index, 1);
    this.selectedFiles.set(current);
    this.errorMessage.set('');
  }

  clearSelection(): void {
    this.selectedFiles.set([]);
    this.errorMessage.set('');
  }

  triggerFileInput(): void {
    this.fileInput()?.nativeElement.click();
  }

  submit(): void {
    const files = this.selectedFiles();
    const tipoDocumento = this.form.controls.idTipoDocumento.value;
    const descripcion = this.form.controls.descripcion.value.trim();

    if (files.length === 0) {
      this.errorMessage.set('Selecciona al menos un archivo para cargar.');
      return;
    }

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Completa la descripción y selecciona un tipo de documento.');
      return;
    }

    const formData = new FormData();
    
    // Adjuntamos cada archivo al FormData bajo la misma clave 'archivos'
    files.forEach((file) => {
      formData.append('archivos', file, file.name);
    });

    formData.append('idCaso', String(this.idCaso));
    formData.append('idTipoDocumento', String(tipoDocumento));
    formData.append('descripcion', descripcion);

    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.errorMessage.set('');

    this.documentoService.subirDocumentos(formData).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((event.loaded / event.total) * 100));
        }
        if (event.type === HttpEventType.Response) {
          this.isUploading.set(false);
          this.uploadProgress.set(100);
          const message = event.body?.message ?? 'Documentos cargados correctamente.';
          this.snackBar.open(message, 'Cerrar', {
            duration: 1000
          });
          this.resetForm();
          this.documentoSubido.emit();
        }
      },
      error: (error) => {
        this.isUploading.set(false);
        this.uploadProgress.set(0);
        const message = error?.error?.message ?? 'No se pudieron cargar los documentos. Inténtalo nuevamente.';
        this.errorMessage.set(message);
        this.snackBar.open(message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  private handleFiles(files: File[]): void {
    this.errorMessage.set('');
    if (files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of files) {
      if (!this.isAllowedFile(file)) {
        this.errorMessage.set(`El archivo "${file.name}" no tiene un formato permitido.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage.set(`El archivo "${file.name}" supera los 5 MB.`);
        return;
      }
      validFiles.push(file);
    }

    // Acumula los archivos seleccionados
    this.selectedFiles.set([...this.selectedFiles(), ...validFiles]);
  }

  private resetForm(): void {
    this.selectedFiles.set([]);
    this.form.reset({ idTipoDocumento: 1, descripcion: '' });
  }

  private isAllowedFile(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const type = file.type.toLowerCase();
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'xls', 'xlsx', 'csv', 'xlsm'];
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
    ];

    return allowedExtensions.includes(extension) || allowedTypes.includes(type);
  }
}

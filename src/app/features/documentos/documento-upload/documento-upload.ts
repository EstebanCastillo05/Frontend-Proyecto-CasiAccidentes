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

  readonly selectedFile = signal<File | null>(null);
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
    const file = input.files?.[0] ?? null;
    this.handleFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    this.handleFile(event.dataTransfer?.files?.[0] ?? null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  clearSelection(): void {
    this.selectedFile.set(null);
    this.errorMessage.set('');
  }

  triggerFileInput(): void {
    this.fileInput()?.nativeElement.click();
  }

  submit(): void {
    const file = this.selectedFile();
    const tipoDocumento = this.form.controls.idTipoDocumento.value;
    const descripcion = this.form.controls.descripcion.value.trim();

    if (!file) {
      this.errorMessage.set('Selecciona un archivo para cargar.');
      return;
    }

    if (!this.isAllowedFile(file)) {
      this.errorMessage.set('Solo se permiten archivos PDF, PNG o JPG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('El archivo no puede superar los 5 MB.');
      return;
    }

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Completa la descripción y selecciona un tipo de documento.');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', file, file.name);
    formData.append('idCaso', String(this.idCaso));
    formData.append('idTipoDocumento', String(tipoDocumento));
    formData.append('descripcion', descripcion);

    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.errorMessage.set('');

    this.documentoService.subirDocumento(formData).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((event.loaded / event.total) * 100));
        }

        if (event.type === HttpEventType.Response) {
          this.isUploading.set(false);
          this.uploadProgress.set(100);
          const message = event.body?.message ?? 'Documento cargado correctamente.';
          this.snackBar.open(message, 'Cerrar', { duration: 3500 });
          this.resetForm();
          this.documentoSubido.emit();
        }
      },
      error: (error) => {
        this.isUploading.set(false);
        this.uploadProgress.set(0);
        const message = error?.error?.message ?? 'No se pudo cargar el documento. Inténtalo nuevamente.';
        this.errorMessage.set(message);
        this.snackBar.open(message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  private handleFile(file: File | null): void {
    this.errorMessage.set('');
    if (!file) {
      return;
    }

    if (!this.isAllowedFile(file)) {
      this.errorMessage.set('Solo se permiten archivos PDF, PNG o JPG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('El archivo no puede superar los 5 MB.');
      return;
    }

    this.selectedFile.set(file);
  }

  private resetForm(): void {
    this.selectedFile.set(null);
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

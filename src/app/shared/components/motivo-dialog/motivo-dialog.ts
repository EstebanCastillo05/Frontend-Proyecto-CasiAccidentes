import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface MotivoDialogData {
  titulo: string;
  subtitulo: string;
}

@Component({
  selector: 'app-motivo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>
      <p class="dialog-sub">{{ data.subtitulo }}</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Motivo obligatorio</mat-label>
        <textarea 
          matInput 
          [(ngModel)]="motivo" 
          placeholder="Escribe el motivo detallado..." 
          rows="4" 
          required>
        </textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button 
        mat-flat-button 
        color="warn" 
        [disabled]="!motivo().trim()" 
        (click)="confirmar()">
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-top: 8px;
    }
    .dialog-sub {
      color: rgba(0, 0, 0, 0.7);
      margin-bottom: 12px;
    }
  `]
})
export class MotivoDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MotivoDialogComponent>);
  readonly data = inject<MotivoDialogData>(MAT_DIALOG_DATA);
  readonly motivo = signal('');

  confirmar(): void {
    if (this.motivo().trim()) {
      this.dialogRef.close(this.motivo().trim());
    }
  }
}
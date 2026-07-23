import { Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface HistorialEstadoItem {
  fecha: string | Date;
  estado: string;
  usuario?: string;
  comentario?: string;
  icono?: string;
}

@Component({
  selector: 'app-caso-timeline',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule],
  templateUrl: './caso-timeline.html',
  styleUrl: './caso-timeline.css'
})
export class CasoTimelineComponent {
  readonly historial = input<HistorialEstadoItem[]>([]);
}
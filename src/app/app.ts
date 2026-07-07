import { Component, signal } from '@angular/core';
import { Menu } from './layout/menu/menu';

@Component({
  selector: 'app-root',
  imports: [Menu],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Frontend-Proyecto-CasiAccidente');
}

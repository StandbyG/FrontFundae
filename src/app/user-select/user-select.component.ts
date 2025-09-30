import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../services/usuario.service';
import { Usuario } from '../core/models/usuario.model';

@Component({
  standalone: true,
  selector: 'app-user-select',
  imports: [CommonModule, FormsModule],
  template: `
  <label class="user-select">
    <span *ngIf="label">{{ label }}</span>
    <select [(ngModel)]="value" (ngModelChange)="onChange($event)">
      <option [ngValue]="undefined">-- Seleccionar usuario --</option>
      <option *ngFor="let u of usuarios()" [ngValue]="u.idUsuario">
        {{u.idUsuario}} - {{u.nombre}} ({{u.correo}}) | {{u.nombreEmpresa || '—'}}
      </option>
    </select>
  </label>
  <small *ngIf="loading()">Cargando usuarios...</small>
  <small *ngIf="error()" class="error">{{error()}}</small>
  `,
  styles: [`
    .user-select { display:flex; flex-direction:column; gap:6px; }
    select { padding: 8px; border-radius: 8px; border: 1px solid #ddd; }
    .error { color:#c00 }
  `]
})
export class UserSelectComponent {
  private api = inject(UsuarioService);

  @Input() label: string = 'Usuario';
  @Input() value: number | undefined;
  @Output() valueChange = new EventEmitter<number | undefined>();

  /** Emite el usuario completo para autocompletar empresa u otros campos */
  @Output() userChange = new EventEmitter<Usuario | null>();

  usuarios = signal<Usuario[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loading.set(true);
    this.api.getAllUsuarios().subscribe({
      next: data => { this.usuarios.set(data); this.loading.set(false); },
      error: _ => { this.error.set('No se pudieron cargar los usuarios'); this.loading.set(false); }
    });
  }

  onChange(id: number | undefined) {
    this.valueChange.emit(id);
    const user = this.usuarios().find(u => u.idUsuario === id) ?? null;
    this.userChange.emit(user);
  }
}

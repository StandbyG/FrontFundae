import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService, ReporteCumplimientoDTO } from '../services/reportes.service';
import { UserSelectComponent } from '../user-select/user-select.component';
import { Usuario } from '../core/models/usuario.model';

@Component({
  standalone: true,
  selector: 'app-reporte-cumplimiento',
  imports: [CommonModule, FormsModule,UserSelectComponent],
  template: `
  <div class="card">
    <h2>Reporte de cumplimiento</h2>

    <form class="filters" (ngSubmit)="load()">
      <app-user-select [(value)]="usuarioId" (userChange)="onUserChange($event)" label="Usuario"></app-user-select>
      <label>Empresa
        <input type="text" [(ngModel)]="empresa" name="empresa" placeholder="FUNDAE">
      </label>
      <label>Desde
        <input type="date" [(ngModel)]="desde" name="desde">
      </label>
      <label>Hasta
        <input type="date" [(ngModel)]="hasta" name="hasta">
      </label>
      <button type="submit">Consultar</button>
    </form>

    <div *ngIf="loading()">Cargando...</div>
    <div *ngIf="error()" class="error">{{ error() }}</div>

    <div *ngIf="data() && !loading()">
      <table class="table">
        <tr><th>Pendientes</th><td>{{data()?.totalPendientes}}</td></tr>
        <tr><th>Implementados</th><td>{{data()?.totalImplementados}}</td></tr>
        <tr><th>Rechazados</th><td>{{data()?.totalRechazados}}</td></tr>
      </table>

      <div class="grid">
        <div class="kpi">
          <div class="kpi-label">% Pendientes</div>
          <div class="kpi-value">{{data()?.porcentajePendientes}}%</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">% Implementados</div>
          <div class="kpi-value">{{data()?.porcentajeImplementados}}%</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">% Rechazados</div>
          <div class="kpi-value">{{data()?.porcentajeRechazados}}%</div>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .card { padding: 16px; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,.08); }
    .filters { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; align-items: end; margin-bottom: 16px;}
    .filters label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .table th, .table td { padding: 8px; border-bottom: 1px solid #eee; text-align: left; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
    .kpi { background: #fafafa; border-radius: 10px; padding: 12px; text-align: center; }
    .kpi-label { font-size: 12px; color: #666; }
    .kpi-value { font-weight: 700; font-size: 18px; }
    .error { color: #c00; margin-top: 8px; }
  `]
})
export class ReporteCumplimientoComponent {
  private api = inject(ReportesService);

  usuarioId?: number;
  empresa = '';
  desde = '';
  hasta = '';

  data = signal<ReporteCumplimientoDTO | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() { this.load(); }
  
 onUserChange(user: Usuario | null) {
   this.empresa = user?.nombreEmpresa ?? '';
 }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.cumplimiento({
      usuarioId: this.usuarioId,
      empresa: this.empresa?.trim() || undefined,
      desde: this.desde || undefined,
      hasta: this.hasta || undefined,
    }).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: e => { this.error.set('No se pudo cargar el reporte'); this.loading.set(false); }
    });
  }
}

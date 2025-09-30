import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReportesService,
  ReporteVencidosDTO,
} from '../services/reportes.service';
import { UserSelectComponent } from '../user-select/user-select.component';
import { Usuario } from '../core/models/usuario.model';

@Component({
  standalone: true,
  selector: 'app-reporte-vencidos',
  imports: [CommonModule, FormsModule,UserSelectComponent],
  template: `
    <div class="card">
      <h2>Reporte de vencidos</h2>

      <form class="filters" (ngSubmit)="load()">
        <app-user-select [(value)]="usuarioId" (userChange)="onUserChange($event)" label="Usuario"></app-user-select>
        <label
          >Empresa
          <input
            type="text"
            [(ngModel)]="empresa"
            name="empresa"
            placeholder="FUNDAE"
          />
        </label>
        <label
          >Fecha corte
          <input type="date" [(ngModel)]="fechaCorte" name="fechaCorte" />
        </label>
        <button type="submit">Consultar</button>
      </form>

      <div *ngIf="loading()">Cargando...</div>
      <div *ngIf="error()" class="error">{{ error() }}</div>

      <div *ngIf="data() && !loading()">
        <p><strong>Fecha corte:</strong> {{ data()?.fechaCorte }}</p>
        <table class="table">
          <tr>
            <th>Vencidos</th>
            <td>{{ data()?.totalVencidos }}</td>
          </tr>
          <tr>
            <th>Pendientes</th>
            <td>{{ data()?.totalPendientes }}</td>
          </tr>
          <tr>
            <th>Implementados</th>
            <td>{{ data()?.totalImplementados }}</td>
          </tr>
          <tr>
            <th>Rechazados</th>
            <td>{{ data()?.totalRechazados }}</td>
          </tr>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        padding: 16px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      }
      .filters {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        align-items: end;
        margin-bottom: 16px;
      }
      .filters label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 14px;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }
      .table th,
      .table td {
        padding: 8px;
        border-bottom: 1px solid #eee;
        text-align: left;
      }
      .error {
        color: #c00;
        margin-top: 8px;
      }
    `,
  ],
})
export class ReporteVencidosComponent {
  private api = inject(ReportesService);

  usuarioId?: number;
  empresa = '';
  fechaCorte = '';

  data = signal<ReporteVencidosDTO | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.load();
  }

  onUserChange(user: Usuario | null) {
     this.empresa = user?.nombreEmpresa ?? '';
   }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .vencidos({
        usuarioId: this.usuarioId,
        empresa: this.empresa?.trim() || undefined,
        fechaCorte: this.fechaCorte || undefined,
      })
      .subscribe({
        next: (d) => {
          this.data.set(d);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set('No se pudo cargar el reporte');
          this.loading.set(false);
        },
      });
  }
}

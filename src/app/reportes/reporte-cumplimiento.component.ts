import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReportesService,
  ReporteCumplimientoDTO,
} from '../services/reportes.service';
import { UserSelectComponent } from '../user-select/user-select.component';
import { Usuario } from '../core/models/usuario.model';

@Component({
  standalone: true,
  selector: 'app-reporte-cumplimiento',
  imports: [CommonModule, FormsModule, UserSelectComponent],
  template: `
    <div class="card">
      <div class="header">
        <h2>Cumplimiento</h2>
        <div class="actions">
          <button type="button" (click)="exportCSV()">Exportar CSV</button>
        </div>
      </div>

      <form class="filters sticky" (ngSubmit)="load()">
        <app-user-select
          [(value)]="usuarioId"
          (userChange)="onUserChange($event)"
          label="Usuario"
        ></app-user-select>

        <label>Empresa
          <input type="text" [(ngModel)]="empresa" name="empresa" placeholder="FUNDAE" />
        </label>

        <label>Desde
          <input type="date" [(ngModel)]="desde" name="desde" />
        </label>

        <label>Hasta
          <input type="date" [(ngModel)]="hasta" name="hasta" />
        </label>

        <button type="submit">Consultar</button>
      </form>

      <div *ngIf="loading()" class="skeleton">
        <div class="skeleton-row"></div>
        <div class="skeleton-row"></div>
      </div>

      <div *ngIf="error()" class="banner error" aria-live="polite">{{ error() }}</div>

      <ng-container *ngIf="!loading() && data()">
        <div class="chips" *ngIf="(empresa || usuarioId || (desde && hasta))">
          <span *ngIf="usuarioId" class="chip">Usuario: {{usuarioId}}</span>
          <span *ngIf="empresa" class="chip">Empresa: {{empresa}}</span>
          <span *ngIf="desde" class="chip">Desde: {{desde}}</span>
          <span *ngIf="hasta" class="chip">Hasta: {{hasta}}</span>
          <span class="chip light">Actualizado: {{ lastUpdated | date:'short' }}</span>
        </div>

        <!-- KPIs -->
        <div class="kpis">
          <div class="kpi neutral">
            <div class="kpi-label">Total</div>
            <div class="kpi-value">{{ total() }}</div>
          </div>
          <div class="kpi warning">
            <div class="kpi-label">Pendientes</div>
            <div class="kpi-value">{{ data()?.totalPendientes || 0 }}</div>
          </div>
          <div class="kpi success">
            <div class="kpi-label">Implementados</div>
            <div class="kpi-value">{{ data()?.totalImplementados || 0 }}</div>
          </div>
          <div class="kpi danger">
            <div class="kpi-label">Rechazados</div>
            <div class="kpi-value">{{ data()?.totalRechazados || 0 }}</div>
          </div>
        </div>

        <!-- Barras de progreso -->
        <div class="progress-list" role="group" aria-label="Distribución por estado">
          <div class="progress-item">
            <div class="progress-label">
              Implementados ({{percent(data()?.totalImplementados||0)}}%)
            </div>
            <div class="progress-bar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="percent(data()?.totalImplementados||0)">
              <div class="progress-fill success" [style.width.%]="percent(data()?.totalImplementados||0)"></div>
            </div>
          </div>

          <div class="progress-item">
            <div class="progress-label">
              Pendientes ({{percent(data()?.totalPendientes||0)}}%)
            </div>
            <div class="progress-bar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="percent(data()?.totalPendientes||0)">
              <div class="progress-fill warning" [style.width.%]="percent(data()?.totalPendientes||0)"></div>
            </div>
          </div>

          <div class="progress-item">
            <div class="progress-label">
              Rechazados ({{percent(data()?.totalRechazados||0)}}%)
            </div>
            <div class="progress-bar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="percent(data()?.totalRechazados||0)">
              <div class="progress-fill danger" [style.width.%]="percent(data()?.totalRechazados||0)"></div>
            </div>
          </div>
        </div>

        <p class="insight">
          Tip: intenta que Implementados supere el 80%. Si Pendientes &gt; 30% revisa cuellos de botella en evaluación/implementación.
        </p>
      </ng-container>

      <div *ngIf="!loading() && !data()" class="empty">
        No hay datos para los filtros seleccionados.
      </div>
    </div>
  `,
  styles: [`
    .card{padding:16px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .actions button{padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:#f7f7f7;cursor:pointer}
    .filters.sticky{position:sticky;top:0;background:#fff;z-index:1;padding-bottom:8px;margin-bottom:12px;border-bottom:1px solid #eee;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;align-items:end}
    .filters label{display:flex;flex-direction:column;gap:6px;font-size:14px}
    .banner.error{background:#fee;border:1px solid #f88;color:#a00;padding:8px;border-radius:8px;margin:8px 0}
    .skeleton .skeleton-row{height:16px;background:linear-gradient(90deg,#eee,#f6f6f6,#eee);margin:8px 0;border-radius:6px}
    .chips{display:flex;gap:8px;margin:8px 0;flex-wrap:wrap}
    .chip{padding:4px 8px;border-radius:999px;background:#f2f2f2;border:1px solid #e6e6e6;font-size:12px}
    .chip.light{background:#fafafa}
    .kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:12px 0}
    .kpi{padding:12px;border-radius:12px;border:1px solid #eee;background:#fafafa}
    .kpi.neutral{border-color:#eee}
    .kpi.success{border-color:#cde9cf;background:#f3fbf4}
    .kpi.warning{border-color:#ffe3a3;background:#fff9e9}
    .kpi.danger{border-color:#ffb3b3;background:#fff0f0}
    .kpi-label{font-size:12px;color:#666}
    .kpi-value{font-size:22px;font-weight:700;margin-top:4px}
    .progress-list{display:grid;gap:12px;margin:12px 0}
    .progress-label{font-size:12px;color:#666;margin-bottom:4px}
    .progress-bar{height:10px;background:#eee;border-radius:999px;overflow:hidden}
    .progress-fill{height:100%}
    .progress-fill.success{background:#16a34a}
    .progress-fill.warning{background:#f59e0b}
    .progress-fill.danger{background:#ef4444}
    .empty{color:#777;text-align:center;padding:16px}
    .insight{color:#4d4d4d;font-size:13px;margin-top:8px}
  `],
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
  lastUpdated: Date | null = null;

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
    })
    .subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); this.lastUpdated = new Date(); },
      error: () => { this.error.set('No se pudo cargar el reporte'); this.loading.set(false); },
    });
  }

  total() {
    const d = this.data();
    if (!d) return 0;
    return d.total ?? ((d.totalPendientes||0) + (d.totalImplementados||0) + (d.totalRechazados||0));
  }

  percent(n: number) {
    const t = this.total();
    return t ? Math.round((n * 10000) / t) / 100 : 0;
  }

  exportCSV() {
    const d = this.data();
    if (!d) return;
    const rows = [
      ['Métrica','Valor','Porcentaje'],
      ['Pendientes', d.totalPendientes ?? 0, this.percent(d.totalPendientes ?? 0) + '%'],
      ['Implementados', d.totalImplementados ?? 0, this.percent(d.totalImplementados ?? 0) + '%'],
      ['Rechazados', d.totalRechazados ?? 0, this.percent(d.totalRechazados ?? 0) + '%'],
      ['Total', this.total(), '100%'],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'reporte_cumplimiento.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}

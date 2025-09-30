import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AjusteRazonableService } from '../../services/ajuste-razonable.service';
import { NormativasService, NormativaOption } from '../../services/normativas.service';
import { AjusteRazonableOngCreate } from '../../core/models/ajuste-razonable-ong-create.model';
import { UserSelectComponent } from '../../user-select/user-select.component';

@Component({
  standalone: true,
  selector: 'app-ajuste-ong-create',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, UserSelectComponent],
  templateUrl: './ajuste-razonable-ong-create.component.html',
  styleUrls: ['./ajuste-razonable-ong-create.component.scss']
})
export class AjusteRazonableOngCreateComponent {
  private fb = inject(FormBuilder);
  private api = inject(AjusteRazonableService);
  private router = inject(Router);
  private normativasApi = inject(NormativasService);

  // === Estado UI ===
  isSaving = signal(false);
  showToast = signal<null | { type: 'ok' | 'error'; message: string }>(null);

  // === Catálogo normativas (signals para recalcular en vivo) ===
  normativasSig = signal<NormativaOption[]>([]);
  selectedFuente = signal<string>('');   // filtro de fuente
  searchRef = signal<string>('');        // búsqueda libre

  // === Usuario (selector) ===
  usuarioId?: number;

  // === Helpers ===
  private todayLocal(): string {
    // YYYY-MM-DD sin desfase UTC
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  readonly today = this.todayLocal();

  // === Form principal (solo campos visibles) ===
  form = this.fb.group({
    espacio: [''],
    observacion: ['', Validators.required],
    ajustesSugeridos: [''],

    // Ref Normativa (obligatorio, viene del combo)
    refNormativa: ['', Validators.required],
    refFotografica: [''],

    // (opcionales por si quieres persistir por separado)
    refNormativaFuente: [''],
    refNormativaCodigo: [''],

    // Píldoras
    dificultad: [''],
    urgencia: [''],
  });

  // Fuentes únicas (expuestas como getter para plantillas)
  private _fuentes: string[] = [];
  get fuentes() { return this._fuentes; }

  // Lista filtrada (reacciona a signals)
  filteredNormativas = computed(() => {
    const list = this.normativasSig();
    const fuente = this.selectedFuente().trim().toLowerCase();
    const q = this.searchRef().trim().toLowerCase();
    return list.filter(n => {
      const okFuente = !fuente || n.fuente.toLowerCase() === fuente;
      const okQ = !q || n.label.toLowerCase().includes(q);
      return okFuente && okQ;
    });
  });

  ngOnInit() {
    // Cargar catálogo de normativas desde assets
    this.normativasApi.getAll().subscribe(list => {
      this.normativasSig.set(list);
      this._fuentes = Array.from(new Set(list.map(i => i.fuente))).sort((a, b) => a.localeCompare(b));
    });
  }

  // Ganchos de UI
  onFuenteChange(fuente: string) {
    this.selectedFuente.set(fuente);
    this.form.patchValue({ refNormativa: '', refNormativaFuente: '', refNormativaCodigo: '' });
  }

  onRefChange(ev: Event) {
    const target = ev.target as HTMLSelectElement | null;
    const label = target?.value ?? '';
    const sel = this.normativasSig().find(n => n.label === label);
    this.form.patchValue({
      refNormativaFuente: sel?.fuente ?? '',
      refNormativaCodigo: sel?.ref ?? '',
    });
  }

  // Píldoras
  setDificultad(val: '' | 'BAJA' | 'MEDIA' | 'ALTA') {
    this.form.patchValue({ dificultad: val });
  }
  setUrgencia(val: '' | 'BAJA' | 'MEDIA' | 'ALTA') {
    this.form.patchValue({ urgencia: val });
  }

  // Recibir usuario desde el select (opcional)
  onUser(_user: any) {
    // Hook por si luego quieres setear algo al cambiar de usuario
  }

  // Toast helper
  private toast(type: 'ok' | 'error', message: string) {
    this.showToast.set({ type, message });
    setTimeout(() => this.showToast.set(null), 2400);
  }

  // Envío
  submit() {
    if (!this.usuarioId || this.form.invalid) {
      this.toast('error', 'Completa los campos obligatorios (usuario y referencia normativa).');
      return;
    }

    this.isSaving.set(true);

    // Forzar SIEMPRE fechaRecomendacion, fechaImplementacion y estado
    const payload: AjusteRazonableOngCreate = {
      usuarioId: this.usuarioId,
      ...(this.form.value as any),
      fechaRecomendacion: this.today,
      fechaImplementacion: this.today,
      estado: 'pendiente',
    };

    this.api.createAjusteOng(payload).subscribe({
      next: _ => {
        this.isSaving.set(false);
        this.toast('ok', 'Ajuste creado correctamente.');
        setTimeout(() => this.router.navigate(['/ajustes/mis-ajustes']), 600);
      },
      error: _ => {
        this.isSaving.set(false);
        this.toast('error', 'No se pudo guardar el ajuste.');
      }
    });
  }
}

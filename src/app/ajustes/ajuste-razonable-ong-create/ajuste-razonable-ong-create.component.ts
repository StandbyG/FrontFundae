import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

import { AjusteRazonableService } from '../../services/ajuste-razonable.service';
import { NormativasService, NormativaOption } from '../../services/normativas.service';
import { AjusteRazonableOngCreate } from '../../core/models/ajuste-razonable-ong-create.model';
import { UserSelectComponent } from '../../user-select/user-select.component';

@Component({
  standalone: true,
  selector: 'app-ajuste-ong-create',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, UserSelectComponent],
  templateUrl: './ajuste-razonable-ong-create.component.html',
  styleUrls: ['./ajuste-razonable-ong-create.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(400px)', opacity: 0 }))
      ])
    ])
  ]
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
  selectedFuente = signal<string>('');
  searchRef = signal<string>('');

  // === Usuario seleccionado ===
  usuarioId?: number;
  selectedUser?: any;

  // === Fecha actual ===
  readonly today = this.getTodayFormatted();

  // === Form principal ===
  form = this.fb.group({
    espacio: ['', [Validators.maxLength(200)]],
    observacion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    ajustesSugeridos: ['', [Validators.maxLength(1000)]],
    
    refNormativa: ['', Validators.required],
    refFotografica: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    
    refNormativaFuente: [''],
    refNormativaCodigo: [''],
    
    dificultad: [''],
    urgencia: [''],
  });

  // === Fuentes únicas ===
  private _fuentes: string[] = [];
  get fuentes() {
    return this._fuentes;
  }

  // === Lista filtrada de normativas ===
  filteredNormativas = computed(() => {
    const list = this.normativasSig();
    const fuente = this.selectedFuente().trim().toLowerCase();
    const q = this.searchRef().trim().toLowerCase();
    
    return list.filter(n => {
      const matchFuente = !fuente || n.fuente.toLowerCase() === fuente;
      const matchSearch = !q || n.label.toLowerCase().includes(q) || n.ref.toLowerCase().includes(q);
      return matchFuente && matchSearch;
    });
  });

  ngOnInit() {
    // Cargar catálogo de normativas
    this.normativasApi.getAll().subscribe({
      next: (list) => {
        this.normativasSig.set(list);
        this._fuentes = Array.from(new Set(list.map(i => i.fuente))).sort();
      },
      error: (err) => {
        console.error('Error cargando normativas:', err);
        this.toast('error', 'No se pudieron cargar las normativas.');
      }
    });

    // Validación en tiempo real
    this.setupFormValidation();
  }

  // === Helpers ===
  private getTodayFormatted(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private setupFormValidation() {
    // Marcar campos como touched para mostrar errores después de interactuar
    this.form.valueChanges.subscribe(() => {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control?.dirty) {
          control.markAsTouched();
        }
      });
    });
  }

  // === Filtros de normativas ===
  onFuenteChange(fuente: string) {
    this.selectedFuente.set(fuente);
    this.form.patchValue({ 
      refNormativa: '', 
      refNormativaFuente: '', 
      refNormativaCodigo: '' 
    });
  }

  onRefChange(ev: Event) {
    const target = ev.target as HTMLSelectElement | null;
    const label = target?.value ?? '';
    const selected = this.normativasSig().find(n => n.label === label);
    
    if (selected) {
      this.form.patchValue({
        refNormativaFuente: selected.fuente,
        refNormativaCodigo: selected.ref,
      });
    }
  }

  clearFilters() {
    this.selectedFuente.set('');
    this.searchRef.set('');
  }

  // === Píldoras de prioridad ===
  setDificultad(val: '' | 'BAJA' | 'MEDIA' | 'ALTA') {
    this.form.patchValue({ dificultad: val });
  }

  setUrgencia(val: '' | 'BAJA' | 'MEDIA' | 'ALTA') {
    this.form.patchValue({ urgencia: val });
  }

  // === Usuario selector ===
  onUser(user: any) {
    this.selectedUser = user;
    console.log('Usuario seleccionado:', user);
  }

  // === Validación de URL de imagen ===
  isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    this.toast('error', 'No se pudo cargar la imagen de referencia.');
  }

  // === Toast helper ===
  private toast(type: 'ok' | 'error', message: string) {
    this.showToast.set({ type, message });
    setTimeout(() => this.showToast.set(null), 4000);
  }

  // === Validación antes de enviar ===
  private validateSubmission(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.usuarioId) {
      errors.push('Debes seleccionar un usuario empleador');
    }

    if (this.form.invalid) {
      if (this.form.get('observacion')?.invalid) {
        errors.push('La observación es obligatoria (mínimo 10 caracteres)');
      }
      if (this.form.get('refNormativa')?.invalid) {
        errors.push('Debes seleccionar una referencia normativa');
      }
      if (this.form.get('refFotografica')?.invalid) {
        errors.push('La URL de la referencia fotográfica no es válida');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // === Envío del formulario ===
  submit() {
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });

    // Validar
    const validation = this.validateSubmission();
    if (!validation.valid) {
      this.toast('error', validation.errors[0]);
      
      // Scroll al primer error
      setTimeout(() => {
        const firstError = document.querySelector('.invalid, .form-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      return;
    }

    this.isSaving.set(true);

    // Construir payload
    const payload: AjusteRazonableOngCreate = {
      usuarioId: this.usuarioId!,
      espacio: this.form.value.espacio || '',
      observacion: this.form.value.observacion || '',
      ajustesSugeridos: this.form.value.ajustesSugeridos || '',
      refNormativa: this.form.value.refNormativa || '',
      refFotografica: this.form.value.refFotografica || '',
      dificultad: (this.form.value.dificultad as 'BAJA' | 'MEDIA' | 'ALTA') || undefined,
      urgencia: (this.form.value.urgencia as 'BAJA' | 'MEDIA' | 'ALTA') || undefined,
      fechaRecomendacion: this.today,
      fechaImplementacion: this.today,
      estado: 'pendiente',
    };

    // Enviar al backend
    this.api.createAjusteOng(payload).subscribe({
      next: (response) => {
        console.log('Ajuste creado:', response);
        this.isSaving.set(false);
        this.toast('ok', '¡Ajuste razonable creado exitosamente!');
        
        // Redireccionar después de un breve delay
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error creando ajuste:', err);
        this.isSaving.set(false);
        
        let errorMessage = 'No se pudo guardar el ajuste. Intenta nuevamente.';
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.status === 0) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        }
        
        this.toast('error', errorMessage);
      }
    });
  }

  // === Método para cancelar ===
  cancel() {
    if (this.form.dirty) {
      const confirmCancel = confirm('¿Estás seguro de cancelar? Se perderán los cambios no guardados.');
      if (confirmCancel) {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
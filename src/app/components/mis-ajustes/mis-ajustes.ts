import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AjusteRazonable } from '../../core/models/ajuste-razonable.model';
import { AjusteRazonableService } from '../../services/ajuste-razonable.service';
import { AuthService } from '../../core/services/auth.services';
import { finalize } from 'rxjs/operators';

type AjusteUI = AjusteRazonable & {
  _deleting?: boolean;   // spinner/bloqueo mientras borra
  _deleted?: boolean;    // ya se eliminó (estado fantasma)
  _errorMsg?: string;    // error puntual
};

@Component({
  selector: 'app-mis-ajustes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-ajustes.html',
  styleUrls: ['./mis-ajustes.scss'],
})
export class MisAjustesComponent implements OnInit {
  ajustes: AjusteUI[] = [];
  isLoading = true;
  private userId: number | null = null;

  constructor(
    private ajusteService: AjusteRazonableService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    if (!this.userId) {
      console.error('No se pudo obtener el ID del usuario.');
      this.isLoading = false;
      return;
    }
    this.reload();
  }

  /** Carga/recarga desde backend (fuente de verdad) */
  reload(): void {
    if (!this.userId) return;
    this.isLoading = true;
    this.ajusteService
      .getAjustesByUsuarioId(this.userId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (data) => {
          // limpiamos estados UI temporales
          this.ajustes = (data || []).map((a) => ({ ...a, _deleting: false, _deleted: false, _errorMsg: undefined }));
        },
        error: (err) => {
          console.error('Error cargando ajustes', err);
          this.ajustes = [];
        },
      });
  }

  /** Eliminar con UI optimista + manejo de “ya eliminado” */
  deleteAjuste(id: number | undefined): void {
    if (id === undefined) return;

    const idx = this.ajustes.findIndex((a) => a.idAjuste === id);
    if (idx === -1) {
      alert('Ajuste no encontrado (ya no está en la lista).');
      return;
    }

    const item = this.ajustes[idx];

    // Si ya figura eliminado en UI, no vuelvas a llamar al backend
    if (item._deleted) {
      alert('Ajuste eliminado / no encontrado.');
      return;
    }
    // Evita doble click mientras elimina
    if (item._deleting) return;

    const confirmado = confirm('¿Estás seguro de que deseas eliminar este ajuste?');
    if (!confirmado) return;

    // ✅ UI optimista: marcar como “eliminando” y “eliminado (fantasma)”
    item._deleting = true;
    item._deleted = true;
    item._errorMsg = undefined;

    // Llamada real al backend
    this.ajusteService
      .deleteAjuste(id)
      .pipe(
        finalize(() => {
          item._deleting = false;
        })
      )
      .subscribe({
        next: () => {
          // Éxito: quítalo de la lista (o déjalo “grisado” unos ms si quieres animación)
          this.ajustes = this.ajustes.filter((a) => a.idAjuste !== id);

          // Además: recarga desde backend para mantener fuente de verdad (opcional pero recomendado)
          this.reload();
        },
        error: (err) => {
          // Si el backend devuelve 404/410, mantenemos _deleted y avisamos
          if (err?.status === 404 || err?.status === 410) {
            item._deleted = true;
            item._errorMsg = 'Ajuste no encontrado (ya estaba eliminado).';
            // lo quitamos de la lista también para que desaparezca
            this.ajustes = this.ajustes.filter((a) => a.idAjuste !== id);
          } else {
            // Error real: revertimos estado UI
            item._deleted = false;
            item._errorMsg = 'No se pudo eliminar. Intenta nuevamente.';
            alert(item._errorMsg);
          }
        },
      });
  }

  // ===== helpers UI =====
  getStatusClass(estado: string): string {
    if (!estado) return 'badge bg-secondary';
    switch ((estado || '').toLowerCase()) {
      case 'aprobado':
        return 'badge bg-success';
      case 'pendiente':
        return 'badge bg-warning text-dark';
      case 'rechazado':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getDescriptionText(ajuste: AjusteUI): string {
    return (
      ajuste.observacion ||
      ajuste.descripcion ||
      ajuste.ajustesSugeridos ||
      'Sin descripción'
    );
  }

  getOriginClass(origen: string): string {
    return `badge-${(origen || '').toLowerCase()}`;
  }

  getUrgencyClass(urgencia: string): string {
    return `urgency-${(urgencia || '').toLowerCase()}`;
  }

  getDifficultyClass(dificultad: string): string {
    return `difficulty-${(dificultad || '').toLowerCase()}`;
  }

  getStatusIcon(estado: string): string {
    const icons: Record<string, string> = {
      PENDIENTE: 'fa-clock',
      APROBADO: 'fa-check-circle',
      RECHAZADO: 'fa-times-circle',
      'EN PROCESO': 'fa-spinner',
      COMPLETADO: 'fa-check-double',
    };
    return icons[(estado || '').toUpperCase()] || 'fa-circle';
  }

  /** trackBy para evitar que Angular “recicle” filas ya eliminadas */
  trackByAjuste = (_: number, a: AjusteUI) => a.idAjuste;
}

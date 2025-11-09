import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../core/models/usuario.model';
import { AuthService } from '../../core/services/auth.services';

type UsuarioUI = Usuario & {
  _deleting?: boolean;   // spinner/bloqueo mientras borra
  _deleted?: boolean;    // ya se eliminó (estado fantasma)
  _errorMsg?: string;    // error puntual
};

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss']
})
export class UserListComponent implements OnInit {

  users: UsuarioUI[] = [];
  filteredUsers: UsuarioUI[] = [];
  isLoading = true;

  searchTerm = '';
  sortMode: 'nameAsc' | 'nameDesc' | 'role' = 'nameAsc';

  private currentUserId: number | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId?.() ?? null;
    this.reload();
  }

  /** Fuente de verdad: recarga desde backend */
  reload(): void {
    this.isLoading = true;
    this.usuarioService.getAllUsuarios()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (data) => {
          this.users = (data || []).map(u => ({
            ...u,
            _deleting: false,
            _deleted: false,
            _errorMsg: undefined,
          }));
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error cargando usuarios', err);
          this.users = [];
          this.filteredUsers = [];
        }
      });
  }

  /** Buscar por nombre/correo/empresa + ordenar */
  applyFilters(): void {
    const q = (this.searchTerm || '').trim().toLowerCase();

    let list = !q ? [...this.users] :
      this.users.filter(u =>
        (u.nombre || '').toLowerCase().includes(q) ||
        (u.correo || '').toLowerCase().includes(q) ||
        (u.nombreEmpresa || '').toLowerCase().includes(q)
      );

    switch (this.sortMode) {
      case 'nameAsc':
        list.sort((a,b) => (a.nombre||'').localeCompare(b.nombre||''));
        break;
      case 'nameDesc':
        list.sort((a,b) => (b.nombre||'').localeCompare(a.nombre||''));
        break;
      case 'role':
        list.sort((a,b) => (a.tipoUsuario||'').localeCompare(b.tipoUsuario||''));
        break;
    }

    this.filteredUsers = list;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  /** Eliminar con UI optimista + manejo de “ya eliminado” + no permitir autoeliminarse */
  deleteUser(id: number | undefined): void {
    if (id === undefined) return;

    // Evita que el usuario actual se elimine a sí mismo
    if (this.currentUserId && id === this.currentUserId) {
      alert('No puedes eliminar tu propio usuario.');
      return;
    }

    const idx = this.users.findIndex(u => u.idUsuario === id);
    if (idx === -1) {
      alert('Usuario no encontrado (ya no está en la lista).');
      return;
    }

    const user = this.users[idx];

    // Si ya figura eliminado, muestra mensaje y corta
    if (user._deleted) {
      alert('Usuario eliminado / no encontrado.');
      return;
    }
    if (user._deleting) return;

    const ok = confirm(`¿Eliminar al usuario "${user.nombre}"? Esta acción no se puede deshacer.`);
    if (!ok) return;

    // ✅ UI optimista
    user._deleting = true;
    user._deleted  = true;
    user._errorMsg = undefined;

    this.usuarioService.deleteUsuario(id)
      .pipe(finalize(() => (user._deleting = false)))
      .subscribe({
        next: () => {
          // Éxito: quítalo de la lista y refresca desde backend para estar 100% sincronizados
          this.users = this.users.filter(u => u.idUsuario !== id);
          this.applyFilters();
          this.reload();
        },
        error: (err) => {
          if (err?.status === 404 || err?.status === 410) {
            // Ya estaba eliminado en el backend
            this.users = this.users.filter(u => u.idUsuario !== id);
            this.applyFilters();
          } else {
            // Error real: revertir estado y avisar
            user._deleted = false;
            user._errorMsg = 'No se pudo eliminar. Intenta nuevamente.';
            alert(user._errorMsg);
            this.applyFilters();
          }
        }
      });
  }

  /** trackBy para evitar reciclar nodos de usuarios eliminados */
  trackByUser = (_: number, u: UsuarioUI) => u.idUsuario;
}

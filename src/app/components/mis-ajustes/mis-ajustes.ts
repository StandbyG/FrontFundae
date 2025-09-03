import { Component, OnInit } from '@angular/core';
import { AjusteRazonable } from '../../core/models/ajuste-razonable.model';
import { AjusteRazonableService } from '../../services/ajuste-razonable.service';
import { AuthService } from '../../core/services/auth.services';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mis-ajustes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-ajustes.html',
  styleUrls: ['./mis-ajustes.scss']
})
export class MisAjustesComponent implements OnInit {
  ajustes: AjusteRazonable[] = [];
  isLoading = true;

  constructor(
    private ajusteService: AjusteRazonableService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId(); // Obtenemos el ID del usuario logueado

    if (userId) {
      this.isLoading = true;
      // Llamamos al método del servicio pasándole el ID del usuario actual
      this.ajusteService.getAjustesByUsuarioId(userId).subscribe(data => {
        this.ajustes = data;
        this.isLoading = false;
      });
    } else {
      console.error('No se pudo obtener el ID del usuario.');
      this.isLoading = false;
    }
  }

  // Puedes añadir la lógica para eliminar aquí también si lo deseas
  deleteAjuste(id: number | undefined): void {
    if (id === undefined) return;
    
    if (confirm('¿Estás seguro de que deseas eliminar este ajuste?')) {
      this.ajusteService.deleteAjuste(id).subscribe(() => {
        this.ajustes = this.ajustes.filter(a => a.idAjuste !== id);
        alert('Ajuste eliminado con éxito.');
      });
    }
  }

  // Función de ayuda para los estilos de los estados
  getStatusClass(estado: string): string {
    if (!estado) return 'badge bg-secondary';
    switch (estado.toLowerCase()) {
      case 'aprobado': return 'badge bg-success';
      case 'pendiente': return 'badge bg-warning text-dark';
      case 'rechazado': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }
}
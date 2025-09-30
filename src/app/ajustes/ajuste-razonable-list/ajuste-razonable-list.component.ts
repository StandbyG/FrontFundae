import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AjusteRazonableService } from '../../services/ajuste-razonable.service';
import { CommonModule } from '@angular/common';
import { Tooltip } from 'bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ajuste-razonable-list',
  standalone: true,
  imports: [CommonModule,RouterLink,FormsModule],
  templateUrl: './ajuste-razonable-list.component.html',
  styleUrls: ['./ajuste-razonable-list.component.scss']
})
export class AjusteRazonableListComponent implements OnInit, AfterViewInit {
  ajustes: any[] = [];
   isLoading: boolean = true; 

  constructor(private ajusteService: AjusteRazonableService, private router: Router) {}

  ngOnInit(): void {
    this.isLoading = false;
    this.getAjustes();
  }
  ngAfterViewInit(): void {
    // Inicializa todos los tooltips de Bootstrap en la página después de que la vista se haya renderizado
    Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]')).forEach(
      tooltipNode => new Tooltip(tooltipNode)
    );
  }

  getAjustes(): void {
    this.ajusteService.getAllAjustes().subscribe(data => {
      this.ajustes = data;
    });
  }

  deleteAjuste(id: number): void {
    this.ajusteService.deleteAjuste(id).subscribe(() => {
      this.getAjustes(); // Refresh the list after deletion
    });
  }

  editAjuste(id: number): void {
    this.router.navigate(['/ajustes/edit', id]);
  }
  navigateToDashboard() {
    this.router.navigate(['/dashboard']);  // Cambia '/dashboard' por la ruta correspondiente a tu Dashboard
  }
   getStatusClass(estado: string): string {
  if (!estado) {
    return 'badge badge-secondary';
  }

  const estadoLower = estado.toLowerCase();
  switch (estadoLower) {
    case 'aprobado':
      return 'badge badge-aprobado';
    case 'pendiente':
      return 'badge badge-pendiente';
    case 'rechazado':
      return 'badge badge-rechazado';
    case 'en proceso':
    case 'en-proceso':
      return 'badge badge-en-proceso';
    case 'completado':
      return 'badge badge-completado';
    default:
      return 'badge badge-secondary';
  }
}

  getShortDescription(ajuste: any): string {
  const desc = ajuste.observacion || ajuste.descripcion || ajuste.ajustesSugeridos || 'Sin descripción';
  return desc.length > 80 ? desc.substring(0, 80) + '...' : desc;
}

  getOriginClass(origen: string): string {
    if (!origen) return 'badge-empresa';
    return `badge-${origen.toLowerCase()}`;
  }
  getUrgencyClass(urgencia: string): string {
  if (!urgencia) return '';
  return `urgency-${urgencia.toLowerCase()}`;
}

getDifficultyClass(dificultad: string): string {
  if (!dificultad) return '';
  return `difficulty-${dificultad.toLowerCase()}`;
}

getStatusIcon(estado: string): string {
  const icons: { [key: string]: string } = {
    'PENDIENTE': 'fa-clock',
    'APROBADO': 'fa-check-circle',
    'RECHAZADO': 'fa-times-circle',
    'EN PROCESO': 'fa-spinner',
    'COMPLETADO': 'fa-check-double'
  };
  return icons[estado?.toUpperCase()] || 'fa-circle';
}
getPendingCount(): number {
  return this.ajustes.filter(a => a.estado?.toLowerCase() === 'pendiente').length;
}

getApprovedCount(): number {
  return this.ajustes.filter(a => a.estado?.toLowerCase() === 'aprobado').length;
}

// Método mejorado para confirmar eliminación
confirmDelete(id: number): void {
  if (confirm('¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer.')) {
    this.deleteAjuste(id);
  }
}
viewAjuste(id: number): void {
  this.router.navigate(['/ajustes/detail', id]); // o mostrar un modal
}

  
  
}

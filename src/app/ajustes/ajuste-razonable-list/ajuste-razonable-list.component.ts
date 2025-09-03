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
      return 'badge bg-secondary'; // Clase por defecto si el estado es nulo
    }

    switch (estado.toLowerCase()) {
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
}

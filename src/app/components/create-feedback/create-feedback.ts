import { Component, OnInit, Input } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../core/services/auth.services';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AjusteRazonableService } from '../../services/ajuste-razonable.service';
import { AjusteRazonable } from '../../core/models/ajuste-razonable.model';

@Component({
  selector: 'app-create-feedback',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  standalone: true,
  templateUrl: './create-feedback.html',
  styleUrls: ['./create-feedback.scss'],
})
export class CreateFeedbackComponent implements OnInit {
  @Input() usuarioId!: number;

  ajusteId: number | '' = '';             // obligamos selección explícita
  ajustesRazonables: AjusteRazonable[] = [];
  loadingAjustes = false;

  calificacion = 5;
  comentario = '';
  visibleEmpleador = true;

  loading = false;
  errorMessage = '';
  successMessage = '';

  // Utilidad para el radiogroup de estrellas
  stars = [1, 2, 3, 4, 5];

  constructor(
    private feedbackService: FeedbackService,
    private ajusteService: AjusteRazonableService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchAjustes();
  }

  private fetchAjustes() {
    this.loadingAjustes = true;
    this.ajusteService.getAjustes().subscribe({
      next: (data) => {
        this.ajustesRazonables = data || [];
        this.loadingAjustes = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los ajustes razonables.';
        this.loadingAjustes = false;
      }
    });
  }

  setRating(value: number) {
    this.calificacion = value;
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  onSubmit(): void {
    // Validaciones mínimas defensivas
    if (!this.ajusteId || !this.comentario || this.comentario.trim().length < 10) {
      this.errorMessage = 'Revisa los campos resaltados.';
      this.successMessage = '';
      return;
    }

    const feedbackData = {
      ajusteId: Number(this.ajusteId),
      calificacion: Number(this.calificacion),
      comentario: this.comentario.trim(),
      visibleEmpleador: this.visibleEmpleador,
      usuarioId: this.usuarioId ?? this.authService.getUserId() // por si necesitas asociarlo
    };

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.feedbackService.crearFeedback(feedbackData).subscribe({
      next: () => {
        this.successMessage = 'Retroalimentación creada exitosamente.';
        this.loading = false;
        // Pequeño delay para que el usuario alcance a leer el toast
        setTimeout(() => this.router.navigate(['/feedbacks']), 1200);
      },
      error: () => {
        this.errorMessage = 'Hubo un error al crear la retroalimentación.';
        this.loading = false;
      }
    });
  }
}

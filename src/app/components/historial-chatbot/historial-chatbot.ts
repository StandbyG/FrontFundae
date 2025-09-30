import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

import { ChatbotLog } from '../../core/models/chatbot-log.model';
import { ChatbotLogService } from '../../services/chatbotlog.service';
import { AuthService } from '../../core/services/auth.services';

@Component({
  selector: 'app-historial-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-chatbot.html',
  styleUrls: ['./historial-chatbot.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HistorialChatbotComponent implements OnInit {
  logs: ChatbotLog[] = [];
  filteredLogs: ChatbotLog[] = [];
  filtroPregunta: string = '';
  isLoading = true;
  isAdmin = false;

  pageSize = 10;
  currentPage = 1;

  constructor(
    private authService: AuthService,
    private chatbotLogService: ChatbotLogService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole()?.toLowerCase() === 'administrador';
    this.loadLogs();
  }

  private loadLogs(): void {
    this.isLoading = true;
    const userId = this.authService.getUserId();

    const logsObservable = this.isAdmin
      ? this.chatbotLogService.getAllLogs()
      : userId
      ? this.chatbotLogService.getLogsByUsuarioId(userId)
      : null;

    if (logsObservable) {
      logsObservable.subscribe({
        next: (data) => {
          this.logs = data.sort((a, b) => 
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
          this.filteredLogs = [...this.logs];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar logs:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  aplicarFiltros(): void {
    const term = this.filtroPregunta.toLowerCase().trim();
    
    if (!term) {
      this.filteredLogs = [...this.logs];
    } else {
      this.filteredLogs = this.logs.filter(log => {
        const pregunta = log.pregunta?.toLowerCase() || '';
        const respuesta = log.respuesta?.toLowerCase() || '';
        const usuario = log.usuario?.nombre?.toLowerCase() || '';
        
        return pregunta.includes(term) || 
               respuesta.includes(term) || 
               (this.isAdmin && usuario.includes(term));
      });
    }
    
    this.currentPage = 1;
  }

  get paginatedLogs(): ChatbotLog[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.pageSize);
  }

  cambiarPagina(delta: number): void {
    const nuevaPagina = this.currentPage + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPages()) {
      this.currentPage = nuevaPagina;
      this.scrollToTop();
    }
  }

  copyConversation(log: ChatbotLog): void {
    const text = `Pregunta: ${log.pregunta}\n\nRespuesta: ${log.respuesta}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification('Conversación copiada al portapapeles');
      }).catch(err => {
        console.error('Error al copiar:', err);
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  private fallbackCopy(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showNotification('Conversación copiada');
    } catch (err) {
      console.error('Error al copiar:', err);
      this.showNotification('No se pudo copiar la conversación');
    }
    
    document.body.removeChild(textArea);
  }

  shareConversation(log: ChatbotLog): void {
    const text = `Pregunta: ${log.pregunta}\n\nRespuesta: ${log.respuesta}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Conversación con RoboAmigo',
        text: text
      }).catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Error al compartir:', err);
        }
      });
    } else {
      this.copyConversation(log);
    }
  }


  private showNotification(message: string): void {
    // Implementar con un servicio de notificaciones o snackbar
    // Por ahora usamos alert como fallback
    console.log(message);
    // TODO: Implementar con Angular Material Snackbar o similar
  }

  private scrollToTop(): void {
    const container = document.querySelector('.logs-list');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
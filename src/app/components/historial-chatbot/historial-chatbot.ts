import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ChatbotLog } from '../../core/models/chatbot-log.model';
import { ChatbotLogService } from '../../services/chatbotlog.service';
import { AuthService } from '../../core/services/auth.services';

@Component({
  selector: 'app-historial-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-chatbot.html',
  styleUrls: ['./historial-chatbot.scss']
})
export class HistorialChatbotComponent implements OnInit {
  logs: ChatbotLog[] = [];
  filteredLogs: ChatbotLog[] = [];
  filtroPregunta: string = '';
  isLoading = true;
  isAdmin = false;

  pageSize = 10;
  currentPage = 1;

  constructor( private authService: AuthService,private chatbotLogService: ChatbotLogService) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole()?.toLowerCase() === 'administrador';
    const userId = this.authService.getUserId();

    if (this.isAdmin) {
      // Si es admin, trae todos los logs
      this.chatbotLogService.getAllLogs().subscribe(data => {
        this.logs = data;
        this.isLoading = false;
      });
    } else if (userId) {
      // Si es usuario normal, trae solo sus logs
      this.chatbotLogService.getLogsByUsuarioId(userId).subscribe(data => {
        this.logs = data;
        this.isLoading = false;
      });
    }
  }

  aplicarFiltros() {
    const term = this.filtroPregunta.toLowerCase();
    this.filteredLogs = this.logs.filter(log =>
      log.pregunta?.toLowerCase().includes(term)
    );
    this.currentPage = 1;
  }

  get paginatedLogs(): ChatbotLog[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLogs.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.pageSize);
  }

  cambiarPagina(delta: number) {
    const nuevaPagina = this.currentPage + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPages()) {
      this.currentPage = nuevaPagina;
    }
  }
}

import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Feedback, Notificacion } from '../../services/feedback.service';

interface NotificationItem {
  id: number;
  type: 'notification' | 'feedback';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  ajusteId?: number;
  rating?: number;
  data?: any;
}

type TabType = 'all' | 'notifications' | 'feedback';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback-list.component.html',
  styleUrls: ['./feedback-list.component.scss']
})
export class NotificationCenterComponent implements OnInit, OnChanges {
  @Input() notifications: Notificacion[] = [];
  @Input() feedbacks: Feedback[] = [];
  @Input() isLoading: boolean = false;
  
  @Output() notificationRead = new EventEmitter<number>();
  @Output() notificationDeleted = new EventEmitter<number>();
  @Output() refreshRequested = new EventEmitter<void>();
  @Output() itemDetails = new EventEmitter<NotificationItem>();

  currentTab: TabType = 'all';
  errorMessage: string = '';
  combinedItems: NotificationItem[] = [];

  ngOnInit(): void {
    this.updateCombinedItems();
  }

  ngOnChanges(): void {
    this.updateCombinedItems();
  }

  private updateCombinedItems(): void {
    const notificationItems: NotificationItem[] = (this.notifications || []).map(n => ({
      id: n.id,
      type: 'notification' as const,
      title: n.titulo,
      message: n.mensaje,
      time: this.formatTime(n.createdAt),
      isRead: n.leido,
      ajusteId: n.referenciaId,
      data: n
    }));

    const feedbackItems: NotificationItem[] = (this.feedbacks || []).map(f => ({
      id: f.id,
      type: 'feedback' as const,
      title: 'Nueva retroalimentación recibida',
      message: f.comentario,
      time: this.formatTime(f.createdAt),
      isRead: f.visibleEmpleador,
      ajusteId: f.ajusteId,
      rating: f.calificacion,
      data: f
    }));

    this.combinedItems = [...notificationItems, ...feedbackItems].sort((a, b) => {
      const dateA = a.data?.createdAt ? new Date(a.data.createdAt).getTime() : 0;
      const dateB = b.data?.createdAt ? new Date(b.data.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  private formatTime(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  switchTab(tab: TabType): void {
    this.currentTab = tab;
  }

  getFilteredItems(): NotificationItem[] {
    switch (this.currentTab) {
      case 'notifications':
        return this.combinedItems.filter(item => item.type === 'notification');
      case 'feedback':
        return this.combinedItems.filter(item => item.type === 'feedback');
      default:
        return this.combinedItems;
    }
  }

  getTotalCount(): number {
    return this.getUnreadCount();
  }

  getNotificationCount(): number {
    return this.combinedItems.filter(item => item.type === 'notification' && !item.isRead).length;
  }

  getFeedbackCount(): number {
    return this.combinedItems.filter(item => item.type === 'feedback' && !item.isRead).length;
  }

  getUnreadCount(): number {
    return this.combinedItems.filter(item => !item.isRead).length;
  }

  markAsRead(id: number): void {
    const item = this.combinedItems.find(i => i.id === id);
    if (item) {
      item.isRead = true;
      this.notificationRead.emit(id);
    }
  }

  markAllAsRead(): void {
    this.combinedItems.forEach(item => {
      if (!item.isRead) {
        item.isRead = true;
        this.notificationRead.emit(item.id);
      }
    });
  }

  deleteItem(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      this.combinedItems = this.combinedItems.filter(item => item.id !== id);
      this.notificationDeleted.emit(id);
    }
  }

  viewDetails(item: NotificationItem): void {
    this.itemDetails.emit(item);
  }

  refresh(): void {
    this.refreshRequested.emit();
  }

  trackById(index: number, item: NotificationItem): number {
    return item.id;
  }

  getIconClass(type: string): string {
    return type === 'feedback' ? 'bi-star-fill' : 'bi-bell-fill';
  }

  getEmptyIcon(): string {
    switch (this.currentTab) {
      case 'notifications':
        return 'bi-bell-slash';
      case 'feedback':
        return 'bi-star';
      default:
        return 'bi-inbox';
    }
  }

  getEmptyTitle(): string {
    switch (this.currentTab) {
      case 'notifications':
        return 'No hay notificaciones';
      case 'feedback':
        return 'No hay feedback';
      default:
        return 'No hay notificaciones';
    }
  }

  getEmptyMessage(): string {
    switch (this.currentTab) {
      case 'notifications':
        return 'Todas las notificaciones están al día.';
      case 'feedback':
        return 'No has recibido feedback reciente.';
      default:
        return 'Todas las notificaciones están al día.';
    }
  }
}
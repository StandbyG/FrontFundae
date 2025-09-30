import {
  AfterViewInit,
  Component,
  HostListener,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.services';
import { CommonModule } from '@angular/common';
import { ChatbotComponent } from '../chatbot/chatbot';
import { HistorialChatbotComponent } from '../components/historial-chatbot/historial-chatbot';
import { AjusteRazonable } from '../core/models/ajuste-razonable.model';
import { AjusteRazonableService } from '../services/ajuste-razonable.service';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { FormsModule } from '@angular/forms';
import { Dropdown } from 'bootstrap';
import { ThemeService } from '../services/theme.service';
import { Subject, takeUntil, forkJoin, finalize } from 'rxjs';
import {
  FeedbackService,
  Feedback,
  Notificacion,
} from '../services/feedback.service';
import { NotificationCenterComponent } from '../components/feedback-list/feedback-list.component';

interface ChartLegendItem {
  label: string;
  color: string;
  value: number;
}

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'pendiente' | 'aprobado' | 'rechazado';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    ChatbotComponent,
    RouterModule,
    HistorialChatbotComponent,
    BaseChartDirective,
    FormsModule,
    NotificationCenterComponent,
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  showChatbot: boolean = false;
  showHistorial: boolean = false;
  isAdmin: boolean = false;
  isLoading: boolean = true;
  userMenuOpen = false;
  ajustes: AjusteRazonable[] = [];
  filteredAjustes: AjusteRazonable[] = [];
  openDropdown: string | null = null;
  searchTerm: string = '';
  notifications: Notificacion[] = [];
  feedbacks: Feedback[] = [];
  loadingNotifications: boolean = false;
  navbarCollapsed: boolean = true;
  ajustesCount: number = 0;
  notificationCount: number = 0;
  historialCount: number = 0;
  totalAjustes: number = 0;
  pendingAjustes: number = 0;
  viewMode: ViewMode = 'grid';
  selectedFilter: FilterStatus = 'all';
  chartLegendData: ChartLegendItem[] = [];
  isSearchFocused: boolean = false;

  private destroy$ = new Subject<void>();

  public doughnutChartData: ChartConfiguration<'doughnut'>['data'] | null =
    null;
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#4f46e5',
        borderWidth: 1,
        titleFont: { size: 14, weight: 600 },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce(
              (a, b) => (a as number) + (b as number),
              0
            ) as number;
            const percentage = (
              ((context.parsed as number) / total) *
              100
            ).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
      datalabels: {
        formatter: (value, ctx) => {
          if (ctx.chart.data.datasets[0].data) {
            const total = ctx.chart.data.datasets[0].data.reduce(
              (a, b) => (a as number) + (b as number),
              0
            ) as number;
            const percentage = (((value as number) / total) * 100).toFixed(0);
            return Number(percentage) > 5 ? percentage + '%' : '';
          }
          return '';
        },
        color: '#ffffff',
        font: {
          weight: 'bold' as any,
          size: 14,
        },
        textStrokeColor: 'rgba(0,0,0,0.8)',
        textStrokeWidth: 2,
      },
    },
  };
  public doughnutChartType: 'doughnut' = 'doughnut';
  public doughnutChartPlugins = [ChartDataLabels];

  constructor(
    private router: Router,
    public authService: AuthService,
    private ajusteService: AjusteRazonableService,
    public themeService: ThemeService,
    private feedbackService: FeedbackService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.initializeUserData();
    const userRole = this.authService.getRole();
    const userId = this.authService.getUserId();

    console.log('User role:', userRole);
    console.log('User ID:', userId);

    this.isAdmin = userRole?.toLowerCase() === 'administrador';

    console.log('Is Admin?', this.isAdmin);

    this.loadDashboardData();
    this.setupSearchDebouncing();
  }

  ngAfterViewInit(): void {
    const dropdownElementList = document.querySelectorAll(
      '[data-bs-toggle="dropdown"]'
    );
    dropdownElementList.forEach((dropdownToggleEl) => {
      new Dropdown(dropdownToggleEl);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeUserData(): void {
    this.notificationCount = 3;
    this.historialCount = 8;
  }

  private setupSearchDebouncing(): void {}

  loadDashboardData(): void {
    this.isLoading = true;

    if (this.isAdmin) {
      this.ajusteService
        .getAllAjustes()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.ajustes = data;
            this.filteredAjustes = data;
            this.calculateAdminStats();
            this.loadNotificationsAndFeedback();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading admin data:', error);
            this.isLoading = false;
          },
        });
    } else {
      const userId = this.authService.getUserId();
      if (userId) {
        this.ajusteService
          .getAjustesByUsuarioId(userId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (data) => {
              this.ajustes = data;
              this.prepareChartData();
              this.loadNotificationsAndFeedback();
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error loading user data:', error);
              this.isLoading = false;
            },
          });
      } else {
        this.isLoading = false;
      }
    }
  }

  private calculateAdminStats(): void {
    this.totalAjustes = this.ajustes.length;
    this.pendingAjustes = this.ajustes.filter(
      (a) => a.estado.toLowerCase() === 'pendiente'
    ).length;
    this.ajustesCount = this.totalAjustes;
  }

  filterAjustes(): void {
    let filtered = this.ajustes;

    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((ajuste) => {
        const tipo = ajuste.tipoAjuste?.toLowerCase() || '';
        const descripcion = ajuste.descripcion?.toLowerCase() || '';
        const estado = ajuste.estado?.toLowerCase() || '';
        const usuario = ajuste.usuario?.nombre?.toLowerCase() || '';

        return (
          tipo.includes(term) ||
          descripcion.includes(term) ||
          estado.includes(term) ||
          usuario.includes(term)
        );
      });
    }

    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(
        (ajuste) => ajuste.estado.toLowerCase() === this.selectedFilter
      );
    }

    this.filteredAjustes = filtered;
  }

  setFilter(filter: FilterStatus): void {
    this.selectedFilter = filter;
    this.filterAjustes();
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterAjustes();
  }

  onSearchFocus(): void {
    this.isSearchFocused = true;
  }

  onSearchBlur(): void {
    this.isSearchFocused = false;
  }

  private prepareChartData(): void {
    const statusCounts = new Map<string, number>();
    const statusColors = {
      Pendiente: '#f59e0b',
      Aprobado: '#10b981',
      Rechazado: '#ef4444',
      Otro: '#6b7280',
    };

    this.ajustes.forEach((ajuste) => {
      const status =
        ajuste.estado.charAt(0).toUpperCase() + ajuste.estado.slice(1);
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    });

    const labels = Array.from(statusCounts.keys());
    const data = Array.from(statusCounts.values());
    const colors = labels.map(
      (label) =>
        statusColors[label as keyof typeof statusColors] || statusColors.Otro
    );

    this.doughnutChartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverBorderWidth: 4,
          hoverBorderColor: '#ffffff',
        },
      ],
    };

    this.chartLegendData = labels.map((label, index) => ({
      label,
      color: colors[index],
      value: data[index],
    }));
  }

  trackByAjusteId(index: number, ajuste: AjusteRazonable): any {
    return ajuste.idAjuste || index;
  }

  viewAjusteDetails(ajuste: AjusteRazonable): void {
    this.router.navigate(['/ajustes', ajuste.idAjuste]);
  }

  editAjuste(ajuste: AjusteRazonable): void {
    this.router.navigate(['/ajustes', ajuste.idAjuste, 'edit']);
  }

  getStatusIcon(estado: string): string {
    const icons: { [key: string]: string } = {
      PENDIENTE: 'bi-clock-fill',
      APROBADO: 'bi-check-circle-fill',
      RECHAZADO: 'bi-x-circle-fill',
      'EN PROCESO': 'bi-arrow-repeat',
      COMPLETADO: 'bi-check-circle-fill',
    };
    return icons[estado?.toUpperCase()] || 'bi-circle-fill';
  }

  getStatusClass(estado: string): string {
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

  navigateToCreateAjuste(): void {
    this.router.navigate(['/ajustes/create']);
  }

  navigateToListAjustes(): void {
    this.router.navigate(['/ajustes']);
  }

  navigateToMyAjustes(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.router.navigate([`/ajustes/usuario/${userId}`]);
    }
  }

  navigateToSearchUsers(): void {
    if (this.isAdmin) {
      this.router.navigate(['/search']);
    }
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/perfil']);
  }

  navigateToCreateVerificacion(): void {
    if (this.isAdmin) {
      this.router.navigate(['/verificacion/create']);
    }
  }

  navigateToUserList(): void {
    this.router.navigate(['/admin/usuarios']);
  }

  toggleChatbot(): void {
    this.showChatbot = !this.showChatbot;
    if (this.showChatbot) {
      this.showHistorial = false;
    }
  }

  toggleHistorial(): void {
    this.showHistorial = !this.showHistorial;
    if (this.showHistorial) {
      this.showChatbot = false;
    }
  }

  signOut(): void {
    this.authService.logout();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleUserMenu(event: MouseEvent): void {
    event.preventDefault();
    this.userMenuOpen = !this.userMenuOpen;
    this.openDropdown = null;
  }

  toggleDropdown(menu: string, event: MouseEvent): void {
    event.preventDefault();
    this.openDropdown = this.openDropdown === menu ? null : menu;
    this.userMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.nav-item.dropdown')) {
      this.userMenuOpen = false;
      this.openDropdown = null;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.userMenuOpen = false;
    this.openDropdown = null;
  }

  get hasAjustes(): boolean {
    return this.ajustes && this.ajustes.length > 0;
  }

  get hasFilteredResults(): boolean {
    return this.filteredAjustes && this.filteredAjustes.length > 0;
  }

  get isSearching(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  getApprovedCount(): number {
    return this.ajustes.filter((a) => a.estado?.toLowerCase() === 'aprobado')
      .length;
  }

  getPendingCount(): number {
    return this.ajustes.filter((a) => a.estado?.toLowerCase() === 'pendiente')
      .length;
  }

  private loadNotificationsAndFeedback(): void {
    this.loadingNotifications = true;

    forkJoin({
      notifications: this.feedbackService.obtenerNotificaciones(false, 0, 20),
      feedbacks: this.feedbackService.obtenerFeedbacks(0, 20, true),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loadingNotifications = false))
      )
      .subscribe({
        next: (response) => {
          console.log('Raw response:', response);

          this.notifications = response.notifications?.content || [];
          this.feedbacks = response.feedbacks?.content || [];

          console.log('Notifications loaded:', this.notifications);
          console.log('Feedbacks loaded:', this.feedbacks);

          this.updateNotificationCount();
        },
        error: (error) => {
          console.error('Error loading notifications and feedback:', error);
        },
      });
  }

  onNotificationRead(id: number): void {
    this.feedbackService
      .marcarNotificacionLeida(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const notification = this.notifications.find((n) => n.id === id);
          if (notification) notification.leido = true;

          const feedback = this.feedbacks.find((f) => f.id === id);
          if (feedback) feedback.visibleEmpleador = true;

          this.updateNotificationCount();
        },
        error: (error) =>
          console.error('Error marking notification as read:', error),
      });
  }

  onNotificationDeleted(id: number): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.feedbacks = this.feedbacks.filter((f) => f.id !== id);
    this.updateNotificationCount();
  }

  refreshNotifications(): void {
    this.loadNotificationsAndFeedback();
  }

  viewNotificationDetails(item: any): void {
    if (item.ajusteId) {
      this.router.navigate(['/ajustes', item.ajusteId]);
    }
  }

  private updateNotificationCount(): void {
    const unreadNotifications = this.notifications.filter(
      (n) => !n.leido
    ).length;
    const unreadFeedbacks = this.feedbacks.filter(
      (f) => !f.visibleEmpleador
    ).length;
    this.historialCount = unreadNotifications + unreadFeedbacks;
  }

  getUnreadNotificationsCount(): number {
    const unreadNotifications = this.notifications.filter(
      (n) => !n.leido
    ).length;
    const unreadFeedbacks = this.feedbacks.filter(
      (f) => !f.visibleEmpleador
    ).length;
    return unreadNotifications + unreadFeedbacks;
  }
}

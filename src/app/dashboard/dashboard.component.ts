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
import { Subject, takeUntil, forkJoin, finalize, debounceTime, distinctUntilChanged } from 'rxjs';
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

interface StatusColors {
  [key: string]: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  // styleUrls: ['./dashboard.component.scss'],
  styles: [`
    /* ========================================
   ENHANCED DESIGN SYSTEM
   ======================================== */
:root {
  /* Colors - Enhanced Palette */
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --primary-light: #eef2ff;
  --primary-dark: #3730a3;
  --primary-glow: rgba(99, 102, 241, 0.15);
  
  --success: #10b981;
  --success-light: #d1fae5;
  --success-dark: #059669;
  --success-glow: rgba(16, 185, 129, 0.15);
  
  --warning: #f59e0b;
  --warning-light: #fef3c7;
  --warning-dark: #d97706;
  
  --danger: #ef4444;
  --danger-light: #fee2e2;
  --danger-dark: #dc2626;
  
  --info: #3b82f6;
  --info-light: #dbeafe;
  --info-dark: #2563eb;

  /* Backgrounds - Refined */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-quaternary: #e2e8f0;

  /* Text - Better Hierarchy */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --text-quaternary: #cbd5e1;

  /* Borders */
  --border-color: #e2e8f0;
  --border-color-hover: #cbd5e1;
  --border-radius-xs: 6px;
  --border-radius-sm: 8px;
  --border-radius-md: 12px;
  --border-radius-lg: 16px;
  --border-radius-xl: 20px;
  --border-radius-full: 9999px;

  /* Shadows - Professional */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  --shadow-glow: 0 0 0 3px var(--primary-glow);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* Spacing */
  --navbar-height: 72px;
  --content-max-width: 1440px;
  --section-spacing: 3rem;
}

/* Dark Theme */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --bg-quaternary: #475569;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-tertiary: #94a3b8;
    --text-quaternary: #64748b;
    --border-color: #334155;
    --border-color-hover: #475569;
  }
}

body.dark-theme {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-quaternary: #475569;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  --text-quaternary: #64748b;
  --border-color: #334155;
  --border-color-hover: #475569;
}

/* ============================================
   REDUCED MOTION & ACCESSIBILITY
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

* {
  box-sizing: border-box;
}

body {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  color: var(--text-primary);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
  position: relative;
  
  /* Subtle pattern overlay */
  &::before {
    content: "";
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.03) 1px, transparent 0);
    background-size: 24px 24px;
    pointer-events: none;
    z-index: 0;
  }
}

/* ============================================
   NAVBAR - PROFESSIONAL
   ============================================ */
.navbar-modern {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 2px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  height: var(--navbar-height);
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1030;
  transition: all var(--transition-base);

  .container-fluid {
    padding: 0 2rem;
    height: 100%;
    max-width: var(--content-max-width);
    margin: 0 auto;
  }
}

body.dark-theme .navbar-modern {
  background: rgba(15, 23, 42, 0.85) !important;
  border-bottom-color: var(--border-color);
}

.brand-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  transition: transform var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
  }
}

.brand-logo {
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius-lg);
  object-fit: contain;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
  
  &:hover {
    transform: scale(1.05);
    box-shadow: var(--shadow-lg);
  }
}

.brand-text {
  font-weight: 800;
  font-size: 1.1875rem;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--text-primary), var(--primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Navigation Links - Enhanced */
.navbar-nav {
  gap: 0.375rem;
  align-items: center;

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    border-radius: var(--border-radius-lg);
    color: var(--text-secondary);
    font-size: 0.9375rem;
    font-weight: 600;
    transition: all var(--transition-fast);
    white-space: nowrap;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, var(--primary-light), transparent);
      opacity: 0;
      transition: opacity var(--transition-base);
    }

    i {
      font-size: 1.125rem;
      transition: all var(--transition-fast);
      position: relative;
      z-index: 1;
    }

    span {
      position: relative;
      z-index: 1;
    }

    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
      transform: translateY(-2px);

      &::before {
        opacity: 0.5;
      }

      i {
        transform: scale(1.15) rotate(-5deg);
        color: var(--primary);
      }
    }

    &.active {
      background: linear-gradient(135deg, var(--primary-light), rgba(99, 102, 241, 0.1));
      color: var(--primary);
      box-shadow: var(--shadow-sm);

      i {
        color: var(--primary);
      }
    }
  }
}

body.dark-theme .navbar-nav .nav-link {
  &:hover {
    background: var(--bg-tertiary);
  }

  &.active {
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;

    i {
      color: #a5b4fc;
    }
  }
}

/* Dropdowns - Modern */
.dropdown-menu {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-2xl);
  padding: 0.75rem;
  margin-top: 0.75rem;
  min-width: 260px;
  animation: slideDown var(--transition-base);

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.125rem;
    border-radius: var(--border-radius-lg);
    color: var(--text-secondary);
    font-size: 0.9375rem;
    font-weight: 500;
    transition: all var(--transition-fast);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%) scaleX(0);
      width: 4px;
      height: 60%;
      background: var(--primary);
      border-radius: 0 4px 4px 0;
      transition: transform var(--transition-base);
    }

    i {
      font-size: 1.25rem;
      width: 24px;
      transition: all var(--transition-fast);
      color: var(--text-tertiary);
    }

    span {
      flex: 1;
    }

    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
      transform: translateX(8px);
      padding-left: 1.5rem;

      &::before {
        transform: translateY(-50%) scaleX(1);
      }

      i {
        transform: scale(1.15);
        color: var(--primary);
      }
    }

    &.text-danger {
      color: var(--danger);

      i {
        color: var(--danger);
      }

      &::before {
        background: var(--danger);
      }

      &:hover {
        background: var(--danger-light);
        color: var(--danger-dark);

        i {
          color: var(--danger-dark);
        }
      }
    }
  }

  hr.dropdown-divider {
    margin: 0.625rem 0;
    border-color: var(--border-color);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Search Bar - Professional */
.nav-search {
  flex: 1;
  max-width: 560px;
  margin: 0 2rem;
}

.search-container {
  position: relative;
  width: 100%;
  transition: all var(--transition-base);

  &.focused {
    .search-input {
      border-color: var(--primary);
      box-shadow: var(--shadow-glow), var(--shadow-md);
      background: var(--bg-primary);
      transform: translateY(-1px);
    }

    .search-icon {
      color: var(--primary);
      transform: translateY(-50%) scale(1.1);
    }
  }
}

.search-icon {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 1.125rem;
  pointer-events: none;
  transition: all var(--transition-fast);
}

.search-input {
  width: 100%;
  padding: 1rem 3.5rem 1rem 3.25rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-full);
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);

  &::placeholder {
    color: var(--text-tertiary);
  }

  &:focus {
    outline: none;
  }

  &:hover:not(:focus) {
    border-color: var(--border-color-hover);
    box-shadow: var(--shadow-md);
  }
}

.search-clear {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--danger-light);
    color: var(--danger);
    transform: translateY(-50%) scale(1.15) rotate(90deg);
  }
}

/* Icon Buttons - Enhanced */
.btn-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2px solid transparent;
  border-radius: var(--border-radius-lg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--primary-light), transparent);
    opacity: 0;
    transition: opacity var(--transition-base);
  }

  &:hover {
    background: var(--bg-secondary);
    color: var(--primary);
    border-color: var(--primary);
    transform: translateY(-3px) scale(1.05);
    box-shadow: var(--shadow-md);

    &::before {
      opacity: 0.5;
    }
  }

  i {
    font-size: 1.375rem;
    position: relative;
    z-index: 1;
    transition: transform var(--transition-fast);
  }

  &:hover i {
    transform: rotate(-10deg) scale(1.1);
  }
}

/* Feedback Button - Premium */
.btn-feedback {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
    opacity: 0;
    transition: opacity var(--transition-base);
  }

  i {
    font-size: 1.25rem;
    position: relative;
    z-index: 1;
  }

  span {
    position: relative;
    z-index: 1;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl), 0 0 20px rgba(16, 185, 129, 0.4);
    color: white;

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-2px);
  }
}

/* Notification Badge - Enhanced */
.notification-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--danger), var(--danger-dark));
  color: white;
  font-size: 0.6875rem;
  font-weight: 800;
  border-radius: var(--border-radius-full);
  padding: 0 6px;
  border: 3px solid var(--bg-primary);
  box-shadow: var(--shadow-lg);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: var(--shadow-lg), 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    transform: scale(1.05);
    box-shadow: var(--shadow-xl), 0 0 0 6px rgba(239, 68, 68, 0);
  }
}

/* User Menu - Professional */
.user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem 0.5rem 0.5rem;
  border-radius: var(--border-radius-full);
  border: 2px solid transparent;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-secondary);
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.user-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border-radius: 50%;
  font-size: 1.125rem;
  font-weight: 700;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
  
  .user-menu:hover & {
    transform: scale(1.1) rotate(-5deg);
    box-shadow: var(--shadow-lg);
  }
}

/* ============================================
   MAIN CONTENT
   ============================================ */
.main-content {
  min-height: calc(100vh - var(--navbar-height));
  padding-top: calc(var(--navbar-height) + 2.5rem);
  padding-bottom: 6rem;
  position: relative;
  z-index: 1;
}

/* Loading State - Modern */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.spinner-container {
  text-align: center;

  .spinner-border {
    width: 4rem;
    height: 4rem;
    border-width: 5px;
    border-color: var(--primary);
    border-right-color: transparent;
  }

  .loading-text {
    margin-top: 2rem;
    color: var(--text-secondary);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
}

/* ============================================
   DASHBOARD LAYOUT
   ============================================ */
.admin-view,
.user-view {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 2rem;
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dashboard Header - Enhanced */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--section-spacing);
  gap: 2.5rem;
  padding: 2.5rem 3rem;
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(99, 102, 241, 0.05) 100%);
  border-radius: var(--border-radius-xl);
  border: 2px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary), var(--primary-dark), var(--primary));
    background-size: 200% 100%;
    animation: shimmer 3s linear infinite;
  }
}

@keyframes shimmer {
  to {
    background-position: 200% 0;
  }
}

body.dark-theme .dashboard-header {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05));
}

.header-content {
  flex: 1;
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.04em;
  line-height: 1.1;
  background: linear-gradient(135deg, var(--text-primary), var(--primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dashboard-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
  line-height: 1.6;
}

/* Header Stats - Professional Cards */
.header-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 2.25rem;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  min-width: 180px;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent, rgba(99, 102, 241, 0.05));
    opacity: 0;
    transition: opacity var(--transition-base);
  }

  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: var(--shadow-2xl);
    border-color: var(--primary);

    &::before {
      opacity: 1;
    }

    .stat-icon {
      transform: scale(1.15) rotate(-8deg);
    }
  }

  &.stat-primary .stat-icon {
    background: linear-gradient(135deg, var(--primary-light), rgba(99, 102, 241, 0.2));
    color: var(--primary);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  }

  &.stat-warning .stat-icon {
    background: linear-gradient(135deg, var(--warning-light), rgba(245, 158, 11, 0.2));
    color: var(--warning);
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
  }

  &.stat-success .stat-icon {
    background: linear-gradient(135deg, var(--success-light), rgba(16, 185, 129, 0.2));
    color: var(--success);
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  }
}

.stat-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-xl);
  font-size: 2rem;
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: -0.03em;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 0.5rem;
  font-weight: 700;
}

/* Controls Bar - Modern */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding: 1.5rem 2rem;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  gap: 2rem;
  box-shadow: var(--shadow-md);
}

.filter-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-full);
  color: var(--text-secondary);
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--primary-light), transparent);
    opacity: 0;
    transition: opacity var(--transition-base);
  }

  span {
    position: relative;
    z-index: 1;
  }

  &:hover {
    background: var(--bg-secondary);
    border-color: var(--primary);
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);

    &::before {
      opacity: 0.5;
    }
  }

  &.active {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    border-color: var(--primary);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);

    .filter-count {
      background: rgba(255, 255, 255, 0.3);
      color: white;
      border-color: rgba(255, 255, 255, 0.4);
    }
  }
}

.filter-count {
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-full);
  font-size: 0.8125rem;
  font-weight: 800;
  min-width: 28px;
  text-align: center;
  transition: all var(--transition-fast);
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  background: var(--bg-secondary);
  padding: 0.5rem;
  border-radius: var(--border-radius-lg);
  border: 2px solid var(--border-color);
}

.view-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--border-radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);

  i {
    font-size: 1.25rem;
  }

  &:hover {
    color: var(--text-primary);
    background: rgba(99, 102, 241, 0.1);
    transform: scale(1.05);
  }

  &.active {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    box-shadow: var(--shadow-md);
  }
}

/* ============================================
   SECTIONS - PROFESSIONAL
   ============================================ */
.section-title {
  display: flex;
  align-items: center;
  font-size: 1.625rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 2rem;
  letter-spacing: -0.03em;

  i {
    color: var(--primary);
    margin-right: 0.75rem;
  }
}

/* Reports Section - Enhanced Cards */
.reports-section {
  margin-bottom: var(--section-spacing);
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.report-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2.25rem 2.5rem;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  text-decoration: none;
  color: var(--text-primary);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent, rgba(99, 102, 241, 0.05));
    opacity: 0;
    transition: opacity var(--transition-base);
  }

  &::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, var(--primary), var(--primary-dark));
    transform: scaleY(0);
    transition: transform var(--transition-base);
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-2xl);
    border-color: var(--primary);

    &::before {
      opacity: 1;
    }

    &::after {
      transform: scaleY(1);
    }

    .report-arrow {
      transform: translateX(10px);
      color: var(--primary);
    }

    .report-icon {
      transform: scale(1.15) rotate(-8deg);
    }
  }
}

.report-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-xl);
  font-size: 2rem;
  color: white;
  flex-shrink: 0;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-lg);

  &.bg-success {
    background: linear-gradient(135deg, var(--success), var(--success-dark));
  }

  &.bg-danger {
    background: linear-gradient(135deg, var(--danger), var(--danger-dark));
  }

  &.bg-info {
    background: linear-gradient(135deg, var(--info), var(--info-dark));
  }
}

.report-content {
  flex: 1;

  h4 {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  p {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.6;
  }
}

.report-arrow {
  color: var(--text-tertiary);
  font-size: 1.5rem;
  transition: all var(--transition-base);
}

/* Notification Center - Professional */
.notification-center-section {
  margin-bottom: var(--section-spacing);
}

/* Ajustes Section */
.ajustes-section {
  margin-bottom: var(--section-spacing);
}

/* Grid View - Enhanced Cards */
.ajustes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 2rem;
}

.ajuste-card-modern {
  position: relative;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  padding: 2rem;
  cursor: pointer;
  transition: all var(--transition-base);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary), var(--primary-dark));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform var(--transition-base);
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-2xl);
    border-color: var(--primary);

    &::before {
      transform: scaleX(1);
    }

    .card-actions {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.card-header-modern {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1.5rem;
}

.card-title-section {
  flex: 1;
  min-width: 0;
}

.card-title-modern {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.02em;
}

.card-subtitle-modern {
  font-size: 0.9375rem;
  color: var(--text-tertiary);
  margin: 0;
  font-weight: 500;
}

.badge-modern {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1.125rem;
  border-radius: var(--border-radius-full);
  font-size: 0.8125rem;
  font-weight: 800;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);

  i {
    font-size: 0.875rem;
  }

  &.badge {
    &.bg-success {
      background: linear-gradient(135deg, var(--success-light), rgba(16, 185, 129, 0.2));
      color: var(--success-dark);
      border: 2px solid var(--success);
    }

    &.bg-warning {
      background: linear-gradient(135deg, var(--warning-light), rgba(245, 158, 11, 0.2));
      color: var(--warning-dark);
      border: 2px solid var(--warning);
    }

    &.bg-danger {
      background: linear-gradient(135deg, var(--danger-light), rgba(239, 68, 68, 0.2));
      color: var(--danger-dark);
      border: 2px solid var(--danger);
    }
  }
}

.card-body-modern {
  margin-bottom: 1.5rem;
}

.card-description {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-color);
  gap: 1.5rem;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-chip,
.date-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 600;
  padding: 0.5rem 0.875rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);

  i {
    color: var(--text-tertiary);
    font-size: 1.125rem;
  }
}

.card-actions {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  opacity: 0;
  transform: translateY(-6px);
  transition: all var(--transition-base);
}

.action-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-lg);

  i {
    font-size: 1.25rem;
  }

  &:hover {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border-color: var(--primary);
    color: white;
    transform: scale(1.15) rotate(-5deg);
  }
}

/* List View - Professional */
.ajustes-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.75rem 2rem;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, var(--primary), var(--primary-dark));
    transform: scaleY(0);
    transition: transform var(--transition-base);
  }

  &:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-xl);
    transform: translateX(6px);

    &::before {
      transform: scaleY(1);
    }
  }
}

.list-main {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2.5rem;
  cursor: pointer;
}

.list-content {
  flex: 1;
  min-width: 0;
}

.list-title {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.list-subtitle {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-shrink: 0;
}

.list-date {
  font-size: 0.9375rem;
  color: var(--text-tertiary);
  font-weight: 600;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.list-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn-sm {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border-color: var(--primary);
    color: white;
    transform: scale(1.15);
  }
}

/* ============================================
   USER VIEW - ENHANCED
   ============================================ */
.btn-primary-modern {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border: none;
  border-radius: var(--border-radius-xl);
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), transparent);
    opacity: 0;
    transition: opacity var(--transition-base);
  }

  i {
    font-size: 1.375rem;
  }

  &:hover {
    background: linear-gradient(135deg, var(--primary-hover), var(--primary));
    transform: translateY(-4px);
    box-shadow: var(--shadow-2xl);
    color: white;

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-2px);
  }
}

/* Chart Section - Modern */
.chart-section {
  margin-bottom: var(--section-spacing);
}

.chart-card {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  padding: 3rem;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary), var(--primary-dark), var(--primary));
    background-size: 200% 100%;
    animation: shimmer 3s linear infinite;
  }

  &:hover {
    box-shadow: var(--shadow-xl);
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.chart-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.03em;
}

.chart-total {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-light), rgba(99, 102, 241, 0.15));
  color: var(--primary);
  border-radius: var(--border-radius-full);
  font-size: 1rem;
  font-weight: 800;
  border: 2px solid var(--primary);
  box-shadow: var(--shadow-sm);
}

.chart-container {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 5rem;
  align-items: center;
}

.chart-wrapper {
  position: relative;
  max-width: 440px;
  height: 440px;
  margin: 0 auto;
}

.chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.center-value {
  display: block;
  font-size: 4rem;
  font-weight: 900;
  color: var(--primary);
  line-height: 1;
  letter-spacing: -0.04em;
}

.center-label {
  display: block;
  font-size: 1rem;
  color: var(--text-secondary);
  margin-top: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem 1.375rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  border: 2px solid var(--border-color);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--primary);
    transform: translateX(6px);
    box-shadow: var(--shadow-md);
  }
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 8px;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.legend-label {
  flex: 1;
  font-size: 1.0625rem;
  color: var(--text-primary);
  font-weight: 600;
}

.legend-value {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--text-primary);
}

/* Empty State - Professional */
.empty-state-modern {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2.5rem;
  text-align: center;
  background: var(--bg-primary);
  border: 3px dashed var(--border-color);
  border-radius: var(--border-radius-xl);
  transition: all var(--transition-base);

  &:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-lg);
  }
}

.empty-icon {
  width: 112px;
  height: 112px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
  border-radius: var(--border-radius-xl);
  color: var(--text-tertiary);
  font-size: 3.5rem;
  margin-bottom: 2.5rem;
  box-shadow: var(--shadow-lg);
}

.empty-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  letter-spacing: -0.03em;
}

.empty-text {
  font-size: 1.125rem;
  color: var(--text-secondary);
  max-width: 520px;
  margin: 0;
  line-height: 1.7;
}

/* ============================================
   CHATBOT & SIDEBAR - ENHANCED
   ============================================ */
.chatbot-fab {
  position: fixed;
  bottom: 2.5rem;
  right: 2.5rem;
  width: 68px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 2rem;
  cursor: pointer;
  box-shadow: var(--shadow-2xl);
  transition: all var(--transition-base);
  z-index: 1000;

  &::before {
    content: "";
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--success), var(--success-dark));
    opacity: 0.4;
    animation: ripple 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  &:hover {
    transform: scale(1.2) rotate(10deg);
    box-shadow: 0 25px 50px rgba(16, 185, 129, 0.6);
  }

  &:active {
    transform: scale(1.1);
  }
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.chatbot-panel {
  position: fixed;
  bottom: 9rem;
  right: 2.5rem;
  width: min(460px, calc(100vw - 5rem));
  max-height: min(72vh, 680px);
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
  opacity: 0;
  transform: translateY(30px) scale(0.9);
  pointer-events: none;
  transition: all var(--transition-base);
  z-index: 999;

  &.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  opacity: 0;
  pointer-events: none;
  transition: all var(--transition-base);
  z-index: 1040;

  &.visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.historial-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(540px, 100vw);
  background: var(--bg-primary);
  border-left: 2px solid var(--border-color);
  box-shadow: var(--shadow-2xl);
  transform: translateX(100%);
  transition: transform var(--transition-base);
  z-index: 1050;
  display: flex;
  flex-direction: column;

  &.visible {
    transform: translateX(0);
  }
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2.5rem;
  border-bottom: 2px solid var(--border-color);
  background: linear-gradient(180deg, var(--bg-secondary), var(--bg-primary));
}

.sidebar-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  letter-spacing: -0.03em;

  i {
    color: var(--primary);
  }
}

.btn-close-modern {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2px solid transparent;
  border-radius: var(--border-radius-lg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--danger-light);
    border-color: var(--danger);
    color: var(--danger);
    transform: rotate(90deg) scale(1.1);
  }
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 2.5rem;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: var(--bg-secondary);
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 5px;

    &:hover {
      background: var(--text-tertiary);
    }
  }
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */
@media (max-width: 1200px) {
  .chart-container {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .chart-legend {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .legend-item {
    flex: 1;
    min-width: 220px;
  }
}

@media (max-width: 991.98px) {
  .navbar-modern .container-fluid {
    padding: 0 1.5rem;
  }

  .nav-search {
    margin: 0;
    max-width: 100%;
  }

  .brand-text {
    display: none;
  }

  .header-stats {
    flex-wrap: wrap;
    width: 100%;
  }

  .stat-card {
    flex: 1;
    min-width: calc(50% - 0.75rem);
  }

  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }

  .controls-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    justify-content: center;
  }

  .reports-grid {
    grid-template-columns: 1fr;
  }

  .ajustes-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767.98px) {
  :root {
    --navbar-height: 64px;
    --section-spacing: 2rem;
  }

  .main-content {
    padding-top: calc(var(--navbar-height) + 1.5rem);
  }

  .admin-view,
  .user-view {
    padding: 0 1.25rem;
  }

  .dashboard-title {
    font-size: 2rem;
  }

  .dashboard-subtitle {
    font-size: 1rem;
  }

  .stat-card {
    width: 100%;
    min-width: 100%;
  }

  .chart-card {
    padding: 2rem;
  }

  .chart-wrapper {
    height: 340px;
  }

  .center-value {
    font-size: 3rem;
  }

  .chatbot-fab {
    bottom: 2rem;
    right: 2rem;
    width: 60px;
    height: 60px;
  }

  .chatbot-panel {
    bottom: 7rem;
    right: 2rem;
  }
}

@media (max-width: 575.98px) {
  .navbar-modern .container-fluid {
    padding: 0 1rem;
  }

  .dashboard-header {
    padding: 1.5rem 1.75rem;
  }

  .controls-bar {
    padding: 1.25rem;
  }

  .section-title {
    font-size: 1.375rem;
  }

  .ajuste-card-modern,
  .report-card {
    padding: 1.75rem;
  }

  .stat-icon {
    width: 52px;
    height: 52px;
    font-size: 1.625rem;
  }

  .stat-value {
    font-size: 2rem;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

/* ============================================
   ACCESSIBILITY ENHANCEMENTS
   ============================================ */
@media (prefers-contrast: high) {
  .card,
  .report-card,
  .ajuste-card-modern,
  .stat-card {
    border-width: 3px;
  }

  .btn,
  .btn-primary-modern,
  .btn-feedback {
    border-width: 3px;
  }

  select,
  input,
  textarea {
    border-width: 3px;
  }
}

/* Focus styles for keyboard navigation */
*:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 3px;
}

/* Print styles */
@media print {
  body::before {
    display: none;
  }

  .navbar-modern,
  .chatbot-fab,
  .chatbot-panel,
  .historial-sidebar,
  .overlay {
    display: none !important;
  }

  .main-content {
    padding-top: 0;
  }

  .card,
  .report-card,
  .ajuste-card-modern {
    box-shadow: none;
    border: 2px solid var(--border-color);
    break-inside: avoid;
  }
}

/* ============================================
   UTILITY CLASSES
   ============================================ */
.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* ============================================
   LOADING STATES
   ============================================ */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 0%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--border-radius-md);
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ============================================
   TRANSITIONS & ANIMATIONS
   ============================================ */
.fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.slide-in-right {
  animation: slideInRight 0.4s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* ============================================
   CUSTOM COMPONENTS
   ============================================ */

/* Tooltip style improvements */
.tooltip {
  .tooltip-inner {
    background: var(--text-primary);
    color: var(--bg-primary);
    padding: 0.75rem 1rem;
    border-radius: var(--border-radius-md);
    font-size: 0.875rem;
    font-weight: 600;
    box-shadow: var(--shadow-lg);
  }

  .tooltip-arrow::before {
    border-color: var(--text-primary);
  }
}

/* Modal improvements */
.modal-content {
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-2xl);
}

.modal-header {
  border-bottom: 2px solid var(--border-color);
  padding: 1.75rem 2rem;
  background: linear-gradient(180deg, var(--bg-secondary), var(--bg-primary));
}

.modal-title {
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
}

.modal-body {
  padding: 2rem;
}

.modal-footer {
  border-top: 2px solid var(--border-color);
  padding: 1.5rem 2rem;
  background: var(--bg-secondary);
}

/* Alert improvements */
.alert {
  border-radius: var(--border-radius-lg);
  border-width: 2px;
  padding: 1.25rem 1.5rem;
  font-weight: 600;
  box-shadow: var(--shadow-md);
}

/* Badge improvements */
.badge {
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-full);
  font-weight: 700;
  letter-spacing: 0.05em;
  font-size: 0.8125rem;
}

/* Progress bar improvements */
.progress {
  height: 12px;
  border-radius: var(--border-radius-full);
  background: var(--bg-tertiary);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.progress-bar {
  background: linear-gradient(90deg, var(--primary), var(--primary-dark));
  border-radius: var(--border-radius-full);
  transition: width 0.6s ease;
}

/* Card improvements for Bootstrap cards */
.card {
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);

  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
}

.card-header {
  background: linear-gradient(180deg, var(--bg-secondary), var(--bg-primary));
  border-bottom: 2px solid var(--border-color);
  padding: 1.5rem 2rem;
  font-weight: 700;
  font-size: 1.125rem;
}

.card-body {
  padding: 2rem;
}

.card-footer {
  background: var(--bg-secondary);
  border-top: 2px solid var(--border-color);
  padding: 1.25rem 2rem;
}

/* Table improvements */
.table {
  border-collapse: separate;
  border-spacing: 0;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);

  thead th {
    background: var(--bg-secondary);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.875rem;
    color: var(--text-secondary);
    border-bottom: 2px solid var(--border-color);
    padding: 1.25rem 1.5rem;
  }

  tbody tr {
    transition: all var(--transition-fast);

    &:hover {
      background: var(--bg-secondary);
      transform: scale(1.01);
    }

    td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }
  }
}

/* Form improvements */
.form-control,
.form-select {
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 0.875rem 1.125rem;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-xs);

  &:focus {
    border-color: var(--primary);
    box-shadow: var(--shadow-glow), var(--shadow-md);
    outline: none;
  }

  &:hover:not(:focus) {
    border-color: var(--border-color-hover);
  }
}

.form-label {
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--text-primary);
  margin-bottom: 0.625rem;
  letter-spacing: -0.01em;
}

/* Button improvements */
.btn {
  padding: 0.875rem 1.75rem;
  border-radius: var(--border-radius-lg);
  font-weight: 700;
  font-size: 0.9375rem;
  transition: all var(--transition-base);
  border-width: 2px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
    opacity: 0;
    transition: opacity var(--transition-base);
  }

  &:hover::before {
    opacity: 1;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border-color: var(--primary-dark);
  color: white;

  &:hover {
    background: linear-gradient(135deg, var(--primary-hover), var(--primary));
    border-color: var(--primary);
  }
}

.btn-success {
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  border-color: var(--success-dark);

  &:hover {
    background: linear-gradient(135deg, #0ea975, var(--success));
  }
}

.btn-danger {
  background: linear-gradient(135deg, var(--danger), var(--danger-dark));
  border-color: var(--danger-dark);

  &:hover {
    background: linear-gradient(135deg, #e33d3d, var(--danger));
  }
}

.btn-warning {
  background: linear-gradient(135deg, var(--warning), var(--warning-dark));
  border-color: var(--warning-dark);
  color: white;

  &:hover {
    background: linear-gradient(135deg, #e89408, var(--warning));
  }
}

.btn-secondary {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-color-hover);
  }
}

.btn-outline-primary {
  background: transparent;
  border-color: var(--primary);
  color: var(--primary);

  &:hover {
    background: var(--primary);
    color: white;
  }
}

/* Pagination improvements */
.pagination {
  gap: 0.5rem;

  .page-link {
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius-md);
    color: var(--text-secondary);
    padding: 0.625rem 1rem;
    font-weight: 600;
    transition: all var(--transition-fast);

    &:hover {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
      transform: translateY(-2px);
    }
  }

  .page-item.active .page-link {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border-color: var(--primary);
    box-shadow: var(--shadow-md);
  }
}

/* Breadcrumb improvements */
.breadcrumb {
  background: var(--bg-secondary);
  padding: 1rem 1.5rem;
  border-radius: var(--border-radius-lg);
  border: 2px solid var(--border-color);
  margin-bottom: 2rem;

  .breadcrumb-item {
    font-weight: 600;
    font-size: 0.9375rem;

    &.active {
      color: var(--primary);
    }

    a {
      color: var(--text-secondary);
      transition: color var(--transition-fast);

      &:hover {
        color: var(--primary);
      }
    }
  }
}

/* Toast improvements */
.toast {
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(8px);

  .toast-header {
    background: linear-gradient(180deg, var(--bg-secondary), var(--bg-primary));
    border-bottom: 2px solid var(--border-color);
    font-weight: 700;
  }

  .toast-body {
    padding: 1.25rem;
  }
}

/* Spinner improvements */
.spinner-border,
.spinner-grow {
  border-width: 4px;
}

/* ============================================
   FINAL TOUCHES
   ============================================ */

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}

/* Selection styling */
::selection {
  background: var(--primary-light);
  color: var(--primary-dark);
}

::-moz-selection {
  background: var(--primary-light);
  color: var(--primary-dark);
}

/* Webkit scrollbar for the entire page */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 6px;
  border: 2px solid var(--bg-secondary);

  &:hover {
    background: var(--text-tertiary);
  }
}

/* Focus ring improvements */
:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 3px;
  border-radius: var(--border-radius-sm);
}

button:focus-visible,
a:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 3px;
}

/* Image loading improvements */
img {
  max-width: 100%;
  height: auto;
}

img[loading="lazy"] {
  opacity: 0;
  transition: opacity 0.3s;
}

img[loading="lazy"].loaded {
  opacity: 1;
}
  `],
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
  // UI State
  showChatbot: boolean = false;
  showHistorial: boolean = false;
  isAdmin: boolean = false;
  isLoading: boolean = true;
  userMenuOpen: boolean = false;
  navbarCollapsed: boolean = true;
  isSearchFocused: boolean = false;
  loadingNotifications: boolean = false;

  // Data
  ajustes: AjusteRazonable[] = [];
  filteredAjustes: AjusteRazonable[] = [];
  notifications: Notificacion[] = [];
  feedbacks: Feedback[] = [];

  // Filters and Views
  viewMode: ViewMode = 'grid';
  selectedFilter: FilterStatus = 'all';
  searchTerm: string = '';
  openDropdown: string | null = null;

  // Statistics
  ajustesCount: number = 0;
  notificationCount: number = 0;
  historialCount: number = 0;
  totalAjustes: number = 0;
  pendingAjustes: number = 0;

  // Chart
  chartLegendData: ChartLegendItem[] = [];
  public doughnutChartData: ChartConfiguration<'doughnut'>['data'] | null = null;
  public doughnutChartType: 'doughnut' = 'doughnut';
  public doughnutChartPlugins = [ChartDataLabels];
  
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#6366f1',
        borderWidth: 2,
        titleFont: { size: 15, weight: 700 },
        bodyFont: { size: 14, weight: 500 },
        padding: 16,
        cornerRadius: 12,
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12,
        boxPadding: 6,
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
            return ` ${context.label}: ${context.parsed} (${percentage}%)`;
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
            return Number(percentage) > 8 ? percentage + '%' : '';
          }
          return '';
        },
        color: '#ffffff',
        font: {
          weight: 'bold' as any,
          size: 16,
        },
        textStrokeColor: 'rgba(0,0,0,0.8)',
        textStrokeWidth: 3,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

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
    this.setupUserRole();
    this.loadDashboardData();
    this.setupSearchDebouncing();
  }

  ngAfterViewInit(): void {
    this.initializeDropdowns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // INITIALIZATION METHODS
  // ============================================

  private initializeUserData(): void {
    this.notificationCount = 0;
    this.historialCount = 0;
  }

  private setupUserRole(): void {
    const userRole = this.authService.getRole();
    const userId = this.authService.getUserId();

    console.log('User role:', userRole);
    console.log('User ID:', userId);

    this.isAdmin = userRole?.toLowerCase() === 'administrador';
    console.log('Is Admin?', this.isAdmin);
  }

  private initializeDropdowns(): void {
    const dropdownElementList = document.querySelectorAll(
      '[data-bs-toggle="dropdown"]'
    );
    dropdownElementList.forEach((dropdownToggleEl) => {
      new Dropdown(dropdownToggleEl);
    });
  }

  private setupSearchDebouncing(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.performSearch(searchTerm);
      });
  }

  // ============================================
  // DATA LOADING METHODS
  // ============================================

  loadDashboardData(): void {
    this.isLoading = true;

    if (this.isAdmin) {
      this.loadAdminData();
    } else {
      this.loadUserData();
    }
  }

  private loadAdminData(): void {
    this.ajusteService
      .getAllAjustes()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (data) => {
          this.ajustes = data;
          this.filteredAjustes = data;
          this.calculateAdminStats();
          this.loadNotificationsAndFeedback();
        },
        error: (error) => {
          console.error('Error loading admin data:', error);
          this.showErrorMessage('Error al cargar los datos del administrador');
        },
      });
  }

  private loadUserData(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.isLoading = false;
      return;
    }

    this.ajusteService
      .getAjustesByUsuarioId(userId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (data) => {
          this.ajustes = data;
          this.prepareChartData();
          this.loadNotificationsAndFeedback();
        },
        error: (error) => {
          console.error('Error loading user data:', error);
          this.showErrorMessage('Error al cargar tus ajustes');
        },
      });
  }

  private calculateAdminStats(): void {
    this.totalAjustes = this.ajustes.length;
    this.pendingAjustes = this.ajustes.filter(
      (a) => a.estado.toLowerCase() === 'pendiente'
    ).length;
    this.ajustesCount = this.totalAjustes;
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
          this.notifications = response.notifications?.content || [];
          this.feedbacks = response.feedbacks?.content || [];
          this.updateNotificationCount();
        },
        error: (error) => {
          console.error('Error loading notifications and feedback:', error);
        },
      });
  }

  // ============================================
  // SEARCH AND FILTER METHODS
  // ============================================

  filterAjustes(): void {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string): void {
    let filtered = this.ajustes;

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((ajuste) => {
        const tipo = ajuste.tipoAjuste?.toLowerCase() || '';
        const descripcion = ajuste.descripcion?.toLowerCase() || '';
        const estado = ajuste.estado?.toLowerCase() || '';
        const usuario = ajuste.usuario?.nombre?.toLowerCase() || '';
        const espacio = ajuste.espacio?.toLowerCase() || '';

        return (
          tipo.includes(term) ||
          descripcion.includes(term) ||
          estado.includes(term) ||
          usuario.includes(term) ||
          espacio.includes(term)
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

  // ============================================
  // CHART METHODS
  // ============================================

  private prepareChartData(): void {
    const statusCounts = new Map<string, number>();
    const statusColors: StatusColors = {
      Pendiente: '#f59e0b',
      Aprobado: '#10b981',
      Rechazado: '#ef4444',
      'En Proceso': '#3b82f6',
      Completado: '#8b5cf6',
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
      (label) => statusColors[label] || statusColors['Otro']
    );

    this.doughnutChartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 4,
          hoverBorderWidth: 6,
          hoverBorderColor: '#ffffff',
          hoverOffset: 12,
        },
      ],
    };

    this.chartLegendData = labels.map((label, index) => ({
      label,
      color: colors[index],
      value: data[index],
    }));
  }

  // ============================================
  // NAVIGATION METHODS
  // ============================================

  viewAjusteDetails(ajuste: AjusteRazonable): void {
    this.router.navigate(['/ajustes', ajuste.idAjuste]);
  }

  editAjuste(ajuste: AjusteRazonable): void {
    this.router.navigate(['/ajustes', ajuste.idAjuste, 'edit']);
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

  // ============================================
  // UI INTERACTION METHODS
  // ============================================

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

  signOut(): void {
    this.authService.logout();
  }

  // ============================================
  // NOTIFICATION METHODS
  // ============================================

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

  // ============================================
  // UTILITY METHODS
  // ============================================

  trackByAjusteId(index: number, ajuste: AjusteRazonable): any {
    return ajuste.idAjuste || index;
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
      case 'en proceso':
        return 'badge bg-info';
      case 'completado':
        return 'badge bg-success';
      default:
        return 'badge bg-secondary';
    }
  }

  getApprovedCount(): number {
    return this.ajustes.filter((a) => a.estado?.toLowerCase() === 'aprobado')
      .length;
  }

  getPendingCount(): number {
    return this.ajustes.filter((a) => a.estado?.toLowerCase() === 'pendiente')
      .length;
  }

  getRejectedCount(): number {
    return this.ajustes.filter((a) => a.estado?.toLowerCase() === 'rechazado')
      .length;
  }

  // ============================================
  // GETTERS
  // ============================================

  get hasAjustes(): boolean {
    return this.ajustes && this.ajustes.length > 0;
  }

  get hasFilteredResults(): boolean {
    return this.filteredAjustes && this.filteredAjustes.length > 0;
  }

  get isSearching(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  // ============================================
  // HOST LISTENERS
  // ============================================

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

  @HostListener('window:scroll', ['$event'])
  onScroll(event: any): void {
    // Could add scroll-based animations here
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private showErrorMessage(message: string): void {
    // Implement your error message display logic here
    console.error(message);
  }

  private showSuccessMessage(message: string): void {
    // Implement your success message display logic here
    console.log(message);
  }
}
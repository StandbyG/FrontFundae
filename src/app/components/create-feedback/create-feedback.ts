import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize, debounceTime } from 'rxjs';

import { AjusteRazonableService } from '../../services/ajuste-razonable.service';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../core/services/auth.services';
import { AjusteRazonable } from '../../core/models/ajuste-razonable.model';

interface FeedbackFormData {
  ajusteId: number;
  calificacion: number;
  comentario: string;
  visibleEmpleador: boolean;
  usuarioId?: number;
}

@Component({
  selector: 'app-create-feedback',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-feedback.html',
  styles:[`
/* ========================================
   DESIGN SYSTEM & VARIABLES
   ======================================== */
:root {
  /* Enhanced color palette */
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #818cf8;
  --primary-glow: rgba(99, 102, 241, 0.15);
  
  --success: #10b981;
  --success-dark: #059669;
  --success-light: #d1fae5;
  --success-glow: rgba(16, 185, 129, 0.15);
  
  --danger: #ef4444;
  --danger-dark: #dc2626;
  --danger-light: #fee2e2;
  --danger-glow: rgba(239, 68, 68, 0.15);
  
  --warning: #f59e0b;
  --warning-light: #fef3c7;
  
  /* Neutral scale */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-hover: #e2e8f0;
  
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  
  --border-color: #e2e8f0;
  --border-color-hover: #cbd5e1;
  
  /* Shadows with depth */
  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 10px 10px -5px rgba(15, 23, 42, 0.04);
  --shadow-glow: 0 0 0 3px var(--primary-glow);
  --shadow-glow-success: 0 0 0 3px var(--success-glow);
  --shadow-glow-danger: 0 0 0 3px var(--danger-glow);
  
  /* Refined radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;
  
  /* Timing functions */
  --fast: 150ms;
  --base: 250ms;
  --slow: 350ms;
  --easing: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --easing-smooth: cubic-bezier(0.16, 1, 0.3, 1);
}

/* ========================================
   RESET & BASE
   ======================================== */
* {
  box-sizing: border-box;
}

/* Reduced motion */
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

/* Visually hidden but accessible */
.sr-only {
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

/* ========================================
   LAYOUT
   ======================================== */
.feedback-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem 1rem 4rem;
  position: relative;
  
  /* Subtle pattern overlay */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.03) 1px, transparent 0);
    background-size: 24px 24px;
    pointer-events: none;
  }
}

.page-header {
  max-width: 920px;
  margin: 0 auto 3rem;
  padding: 0 1rem;
  position: relative;
  z-index: 1;
}

.link-back {
  appearance: none;
  background: #ffffff;
  border: 2px solid #e2e8f0;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.625rem 1rem 0.625rem 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #818cf8, #6366f1);
    opacity: 0;
    transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .icon {
    font-size: 1.125rem;
    line-height: 1;
    transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    z-index: 1;
  }

  span:not(.icon) {
    position: relative;
    z-index: 1;
  }

  &:hover {
    border-color: #6366f1;
    color: #6366f1;
    transform: translateX(-4px);
    box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04);

    &::before {
      opacity: 0.05;
    }

    .icon {
      transform: translateX(-4px);
    }
  }

  &:active {
    transform: translateX(-2px);
  }

  &:focus-visible {
    outline: 3px solid rgba(99, 102, 241, 0.15);
    outline-offset: 2px;
    border-color: #6366f1;
  }
}

.page-title {
  margin: 0 0 1rem;
  font-weight: 800;
  font-size: 2.5rem;
  color: #0f172a;
  letter-spacing: -0.04em;
  line-height: 1.1;
  background: linear-gradient(135deg, #0f172a 0%, #4f46e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.page-subtitle {
  color: #475569;
  margin: 0;
  font-size: 1.0625rem;
  line-height: 1.6;
  font-weight: 500;
  max-width: 640px;
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container {
  max-width: 920px;
  margin: 0 auto;
  padding: 0 1rem;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
}

/* ========================================
   ALERTS
   ======================================== */
.alert {
  border-radius: 1rem;
  padding: 1.125rem 1.5rem;
  margin: 0 0 1.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  border: 2px solid;
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05);
  animation: slideDownBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    flex-shrink: 0;
    font-size: 1.25rem;
    font-weight: 700;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent);
    opacity: 0.5;
  }
}

.alert-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border-color: #ef4444;
  
  &::before {
    content: "⚠";
  }
}

.alert-success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
  border-color: #10b981;
  
  &::before {
    content: "✓";
  }
}

@keyframes slideDownBounce {
  0% {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  50% {
    transform: translateY(5px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ========================================
   CARD
   ======================================== */
.card {
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 10px 10px -5px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  transition: all 350ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #6366f1, #818cf8, #6366f1);
    background-size: 200% 100%;
    animation: shimmer 3s linear infinite;
  }

  &:hover {
    box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 10px 10px -5px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(99, 102, 241, 0.15);
    transform: translateY(-2px);
  }
}

@keyframes shimmer {
  to {
    background-position: 200% 0;
  }
}

.card-body {
  padding: 3rem;
}

.card-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.75rem 3rem;
  border-top: 2px solid #e2e8f0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

/* ========================================
   FORM GRID & GROUPS
   ======================================== */
.form-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 2rem;
}

.form-group {
  grid-column: span 6;
  display: flex;
  flex-direction: column;
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
  
  &:nth-child(1) { animation-delay: 0.05s; }
  &:nth-child(2) { animation-delay: 0.1s; }
  &:nth-child(3) { animation-delay: 0.15s; }
  &:nth-child(4) { animation-delay: 0.2s; }
}

.form-group--full {
  grid-column: 1 / -1;
}

/* ========================================
   FORM CONTROLS
   ======================================== */
label {
  font-weight: 700;
  font-size: 0.9375rem;
  color: #0f172a;
  margin-bottom: 0.75rem;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.req {
  color: #ef4444;
  font-size: 1.125rem;
  line-height: 1;
}

.help {
  color: #94a3b8;
  font-size: 0.8125rem;
  margin-top: 0.625rem;
  line-height: 1.5;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  
  &::before {
    content: "ℹ";
    font-size: 0.875rem;
    opacity: 0.6;
  }
}

select,
textarea {
  width: 100%;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1rem 1.125rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #0f172a;
  outline: none;
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);

  &::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }

  &:hover:not(:disabled) {
    border-color: #cbd5e1;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  }

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15), 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04);
    transform: translateY(-1px);
  }

  &:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
    opacity: 0.6;
  }

  &[aria-invalid="true"] {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    
    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15), 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04);
    }
  }
}

select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.25rem;
  padding-right: 3rem;

  &:focus {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  }
}

textarea {
  resize: vertical;
  min-height: 160px;
  line-height: 1.6;
  font-family: inherit;
}

.counter {
  text-align: right;
  font-size: 0.8125rem;
  color: #94a3b8;
  margin-top: 0.625rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.field-error {
  margin-top: 0.625rem;
  color: #ef4444;
  font-size: 0.8125rem;
  font-weight: 700;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  line-height: 1.4;
  animation: shake 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &::before {
    content: "⚠";
    font-size: 0.875rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* ========================================
   STAR RATING
   ======================================== */
.stars {
  display: inline-flex;
  gap: 0.625rem;
  padding: 0.75rem 0;
}

.star {
  font-size: 2.25rem;
  line-height: 1;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #e2e8f0;
  transition: all 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  padding: 0.375rem;
  border-radius: 0.5rem;
  user-select: none;
  position: relative;

  &::before {
    content: "★";
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(1.3) rotate(72deg);
    transition: all 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &:hover {
    transform: scale(1.2) rotate(-10deg);
    color: #fbbf24;
  }

  &.active {
    color: #fbbf24;
    filter: drop-shadow(0 2px 8px rgba(251, 191, 36, 0.4));
    
    &::before {
      opacity: 0.3;
      transform: scale(1.5) rotate(0deg);
    }
  }

  &:focus-visible {
    outline: 3px solid #6366f1;
    outline-offset: 4px;
  }

  &:active {
    transform: scale(0.95);
  }
}

/* Enhanced rating label */
.form-group:has(.stars) .help {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  
  &::before {
    content: "📊";
    opacity: 1;
  }
}

/* ========================================
   TOGGLE SWITCH
   ======================================== */
.switch {
  position: relative;
  width: 60px;
  height: 34px;
  display: inline-block;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background: #f1f5f9;
  border-radius: 9999px;
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 2px solid #e2e8f0;
  box-shadow: inset 0 2px 4px rgba(15, 23, 42, 0.06);
}

.slider::before {
  content: "";
  position: absolute;
  height: 26px;
  width: 26px;
  left: 2px;
  top: 2px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border-radius: 50%;
  transition: all 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);
}

.switch input:checked + .slider {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15), inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.switch input:checked + .slider::before {
  transform: translateX(26px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.switch input:focus + .slider {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.switch:hover .slider {
  border-color: #6366f1;
  transform: scale(1.02);
}

.switch:active .slider::before {
  width: 30px;
}

/* Enhanced visibility help text */
.form-group:has(.switch) .help {
  font-weight: 600;
  color: #475569;
  
  span {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    
    &::before {
      font-size: 1rem;
    }
  }
}

/* ========================================
   BUTTONS
   ======================================== */
.btn {
  border: 2px solid transparent;
  border-radius: 0.75rem;
  padding: 1rem 2rem;
  font-weight: 700;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  position: relative;
  overflow: hidden;
  will-change: transform;
  text-transform: none;
  letter-spacing: -0.01em;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
    opacity: 0;
    transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover:not(:disabled)::before {
    opacity: 1;
  }

  &:active:not(:disabled) {
    transform: translateY(1px) scale(0.98);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    transform: none !important;
  }

  &:focus-visible {
    outline: 3px solid rgba(99, 102, 241, 0.15);
    outline-offset: 2px;
  }
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05);
  border-color: #4f46e5;

  &:hover:not(:disabled) {
    box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 10px 10px -5px rgba(15, 23, 42, 0.04), 0 0 20px rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
  }

  &:disabled {
    background: #94a3b8;
    border-color: transparent;
  }
}

.btn-secondary {
  background: #ffffff;
  color: #0f172a;
  border-color: #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);

  &:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #6366f1;
    box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04);
    transform: translateY(-2px);
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ========================================
   RESPONSIVE
   ======================================== */
@media (max-width: 768px) {
  .form-group {
    grid-column: 1 / -1;
  }

  .card-body {
    padding: 2rem 1.5rem;
  }

  .card-footer {
    padding: 1.5rem;
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .feedback-page {
    padding: 1.5rem 1rem 3rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .page-subtitle {
    font-size: 0.9375rem;
  }

  .card-body {
    padding: 1.5rem 1.25rem;
  }

  .card-footer {
    padding: 1.25rem;
  }

  .form-grid {
    gap: 1.5rem;
  }

  .stars {
    gap: 0.5rem;
  }

  .star {
    font-size: 2rem;
    padding: 0.25rem;
  }
}

/* ========================================
   ACCESSIBILITY ENHANCEMENTS
   ======================================== */
@media (prefers-contrast: high) {
  .card {
    border-width: 3px;
  }

  .btn {
    border-width: 3px;
  }

  select,
  textarea {
    border-width: 3px;
  }
}

/* Focus styles for keyboard navigation */
*:focus-visible {
  outline: 3px solid #6366f1;
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .feedback-page {
    background: white;
  }

  .link-back,
  .card-footer {
    display: none;
  }

  .card {
    box-shadow: none;
    border: 2px solid #e2e8f0;
  }
}
`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateFeedbackComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly feedbackService = inject(FeedbackService);
  private readonly ajusteService = inject(AjusteRazonableService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('alertRegion') alertRegion!: ElementRef<HTMLDivElement>;

  // State management
  ajustesRazonables: AjusteRazonable[] = [];
  loading = false;
  loadingAjustes = false;
  errorMessage = '';
  successMessage = '';

  readonly stars = [1, 2, 3, 4, 5] as const;
  private destroy$ = new Subject<void>();
  private autoHideAlertTimeout?: number;

  // Form with enhanced validators
  form = this.fb.group({
    ajusteId: ['', [Validators.required]],
    calificacion: [
      5,
      [Validators.required, Validators.min(1), Validators.max(5)],
    ],
    comentario: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500),
        this.noOnlyWhitespaceValidator,
      ],
    ],
    visibleEmpleador: [true],
  });

  ngOnInit(): void {
    this.fetchAjustes();
    this.setupFormChangeDetection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.autoHideAlertTimeout) {
      clearTimeout(this.autoHideAlertTimeout);
    }
  }

  // =============================
  // Getters for template
  // =============================
  get comentarioLength(): number {
    return this.form.get('comentario')?.value?.length || 0;
  }

  get ratingLabel(): string {
    const rating = this.form.get('calificacion')?.value as number;
    const labels: Record<number, string> = {
      1: 'Necesita mejorar',
      2: 'Regular',
      3: 'Bueno',
      4: 'Muy bueno',
      5: '¡Excelente!',
    };
    return labels[rating] ?? 'Sin calificar';
  }

  // =============================
  // Custom Validators
  // =============================
  private noOnlyWhitespaceValidator(control: any) {
    const value = control.value || '';
    if (value.trim().length === 0 && value.length > 0) {
      return { whitespace: true };
    }
    return null;
  }

  // =============================
  // Data loading
  // =============================
  private fetchAjustes(): void {
    this.loadingAjustes = true;
    this.clearAlerts();
    this.cdr.markForCheck();

    this.ajusteService
      .getAjustes()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingAjustes = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.ajustesRazonables = data ?? [];
          if (this.ajustesRazonables.length === 0) {
            this.showAlert(
              'error',
              'No hay ajustes razonables disponibles para evaluar en este momento.'
            );
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading ajustes:', err);
          this.showAlert(
            'error',
            'No se pudieron cargar los ajustes razonables. Por favor, recarga la página o intenta nuevamente.'
          );
          this.cdr.markForCheck();
        },
      });
  }

  // =============================
  // Form change detection
  // =============================
  private setupFormChangeDetection(): void {
    // Auto-clear alerts when user starts typing
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        if (this.errorMessage) {
          this.clearAlerts();
          this.cdr.markForCheck();
        }
      });
  }

  // =============================
  // UI helpers
  // =============================
  setRating(value: number): void {
    this.form.get('calificacion')?.setValue(value);
    this.form.get('calificacion')?.markAsTouched();
    this.cdr.markForCheck();
    
    // Visual feedback: announce to screen readers
    this.announceToScreenReader(
      `Calificación seleccionada: ${value} de 5 estrellas - ${this.ratingLabel}`
    );
  }

  // =============================
  // Alert management
  // =============================
  private showAlert(type: 'error' | 'success', message: string, autoHide = false): void {
    if (type === 'error') {
      this.errorMessage = message;
      this.successMessage = '';
    } else {
      this.successMessage = message;
      this.errorMessage = '';
    }
    
    this.cdr.markForCheck();
    
    // Focus alert region for accessibility
    queueMicrotask(() => {
      this.focusAlertRegion();
    });

    // Auto-hide success messages after 5 seconds
    if (autoHide || type === 'success') {
      this.autoHideAlertTimeout = window.setTimeout(() => {
        this.clearAlerts();
        this.cdr.markForCheck();
      }, 5000);
    }
  }

  private clearAlerts(): void {
    if (this.autoHideAlertTimeout) {
      clearTimeout(this.autoHideAlertTimeout);
    }
    this.errorMessage = '';
    this.successMessage = '';
  }

  // =============================
  // Submit
  // =============================
  submit(): void {
    this.clearAlerts();

    // Validate form
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      this.showAlert(
        'error',
        'Por favor, corrige los errores marcados en el formulario antes de continuar.'
      );
      this.cdr.markForCheck();
      return;
    }

    const raw = this.form.getRawValue();
    const feedbackData: FeedbackFormData = {
      ajusteId: Number(raw.ajusteId),
      calificacion: Number(raw.calificacion),
      comentario: String(raw.comentario).trim(),
      visibleEmpleador: !!raw.visibleEmpleador,
      usuarioId: this.authService.getUserId?.() ?? undefined,
    };

    this.loading = true;
    this.cdr.markForCheck();

    this.feedbackService
      .crearFeedback(feedbackData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.showAlert(
            'success',
            '✨ ¡Retroalimentación creada exitosamente! Redirigiendo al dashboard...',
            true
          );
          
          // Reset form
          this.form.reset({
            ajusteId: '',
            calificacion: 5,
            comentario: '',
            visibleEmpleador: true,
          });

          // Redirect after a short delay
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: (error) => {
          console.error('Error creating feedback:', error);
          const errorMsg =
            error?.error?.message ||
            'Hubo un error al crear la retroalimentación. Por favor, verifica tu conexión e intenta nuevamente.';
          this.showAlert('error', errorMsg);
        },
      });
  }

  // =============================
  // Navigation
  // =============================
  goBack(): void {
    if (this.hasUnsavedChanges()) {
      const confirmed = confirm(
        '¿Estás seguro de que deseas salir?\n\nSe perderán todos los cambios no guardados.'
      );
      if (!confirmed) return;
    }
    this.router.navigate(['/dashboard']);
  }

  // =============================
  // Focus / UX utils
  // =============================
  private focusFirstInvalid(): void {
    // Focus the first invalid field
    setTimeout(() => {
      const invalidControl = document.querySelector(
        '.feedback-page form [aria-invalid="true"], .feedback-page form .ng-invalid'
      ) as HTMLElement | null;
      
      if (invalidControl) {
        invalidControl.focus();
        // Smooth scroll to element
        invalidControl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);
  }

  private focusAlertRegion(): void {
    if (this.alertRegion?.nativeElement) {
      this.alertRegion.nativeElement.focus();
    }
  }

  private announceToScreenReader(message: string): void {
    // Create a temporary live region announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  private hasUnsavedChanges(): boolean {
    const values = this.form.getRawValue();
    return (
      values.ajusteId !== '' ||
      (values.comentario?.trim()?.length ?? 0) > 0 ||
      values.calificacion !== 5 ||
      values.visibleEmpleador !== true
    );
  }

  // =============================
  // Form field helpers for template
  // =============================
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field?.errors || !field.touched) return '';

    if (field.errors['required']) {
      return this.getRequiredMessage(fieldName);
    }
    if (field.errors['minlength']) {
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres.`;
    }
    if (field.errors['maxlength']) {
      return `Máximo ${field.errors['maxlength'].requiredLength} caracteres.`;
    }
    if (field.errors['whitespace']) {
      return 'El comentario no puede contener solo espacios en blanco.';
    }
    return 'Campo inválido.';
  }

  private getRequiredMessage(fieldName: string): string {
    const messages: Record<string, string> = {
      ajusteId: 'Debes seleccionar un ajuste razonable.',
      calificacion: 'Debes seleccionar una calificación.',
      comentario: 'El comentario es obligatorio.',
    };
    return messages[fieldName] || 'Este campo es obligatorio.';
  }
}
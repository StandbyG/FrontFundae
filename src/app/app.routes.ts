import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AjusteRazonableListComponent } from './ajustes/ajuste-razonable-list/ajuste-razonable-list.component';
import { AjusteRazonableCreateComponent } from './ajustes/ajuste-razonable-create/ajuste-razonable-create.component';
import { AjusteRazonableEditComponent } from './ajustes/ajuste-razonable-edit/ajuste-razonable-edit.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminGuard } from './admin-guard';
import { SearchComponent } from './search/search';
import { CrearVerificacionComponent } from './crear-verificacion/crear-verificacion';
import { ProfileComponent } from './components/profile/profile';
import { UserListComponent } from './components/user-list/user-list';
import { MisAjustesComponent } from './components/mis-ajustes/mis-ajustes';
import { CreateFeedbackComponent } from './components/create-feedback/create-feedback';
import { ResetPasswordRequestComponent } from './reset-password-request/reset-password-request';
import { ResetPasswordComponent } from './reset-password/reset-password';
import { ReporteCumplimientoComponent } from './reportes/reporte-cumplimiento.component';
import { ReporteVencidosComponent } from './reportes/reporte-vencidos.component';
import { ReporteTiemposComponent } from './reportes/reporte-tiempos.component';
import { AjusteRazonableOngCreateComponent } from './ajustes/ajuste-razonable-ong-create/ajuste-razonable-ong-create.component';
import { NotificationCenterComponent } from './components/feedback-list/feedback-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'ajustes', component: AjusteRazonableListComponent },
  { path: 'ajustes/create', component: AjusteRazonableCreateComponent },
  { path: 'ajustes/edit/:id', component: AjusteRazonableEditComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'search', component: SearchComponent },
  {
    path: 'admin/usuarios',
    component: UserListComponent,
    canActivate: [AdminGuard],
  },
  { path: 'verificacion/create', component: CrearVerificacionComponent },
  { path: 'feedbacks', component: NotificationCenterComponent },
  {
    path: 'perfil',
    component: ProfileComponent,
  },
  { path: 'create-feedback', component: CreateFeedbackComponent },
  {
    path: 'ajustes/mis-ajustes',
    component: MisAjustesComponent,
  },
  { path: 'reset-password-request', component: ResetPasswordRequestComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'reportes/cumplimiento', component: ReporteCumplimientoComponent },
  { path: 'reportes/vencidos', component: ReporteVencidosComponent },
  { path: 'reportes/tiempos', component: ReporteTiemposComponent },
  { path: 'ajustes/ong/crear', component: AjusteRazonableOngCreateComponent },
  { path: '**', redirectTo: 'login' },
];

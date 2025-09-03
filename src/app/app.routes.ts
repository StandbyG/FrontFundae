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
    canActivate: [AdminGuard] // 👈 PROTEGEMOS LA RUTA
  },
  { path: 'verificacion/create', component: CrearVerificacionComponent },
  { 
    path: 'perfil', 
    component: ProfileComponent
  },
    { 
    path: 'ajustes/mis-ajustes', 
    component: MisAjustesComponent
  },
  { path: '**', redirectTo: 'login' }

];


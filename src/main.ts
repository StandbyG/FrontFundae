import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';  // Importar el componente standalone
import { routes } from './app/app.routes';  // Si estás usando rutas, importa el archivo de rutas
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';  // Utiliza el proveedor de HttpClient

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient()  // Configura HttpClient en el arranque
  ]
});

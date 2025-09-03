import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';

        // Captura el error de CORS
        if (error.status === 0) {
          errorMessage = 'No se puede conectar con el servidor. Verifica la conexión o el servidor CORS.';
        } else if (error.status === 403) {
          errorMessage = 'Acceso denegado. Permisos insuficientes.';
        } else if (error.status === 404) {
          errorMessage = 'Recurso no encontrado.';
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor.';
        } else {
          errorMessage = `Error inesperado: ${error.message}`;
        }

        // Aquí puedes manejar el error, por ejemplo, mostrar un mensaje global
        console.error(errorMessage);
        alert(errorMessage);  // Esto muestra un mensaje de alerta con el error

        return throwError(errorMessage);
      })
    );
  }
}

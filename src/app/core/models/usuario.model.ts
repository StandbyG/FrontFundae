export interface Usuario {
  idUsuario?: number;
  nombre: string;
  correo: string;
  password?: string;
  tipoUsuario: 'administrador' | 'empleador';
  nombreEmpresa?: string;
  ruc?: string;
  sector?: string;
  direccion?: string;
  estadoCumplimiento?: string; // ejemplo: "cumple", "no cumple", "parcial"
  fechaCreacion?: Date;
}

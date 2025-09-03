export interface AjusteRazonableCreate {
  tipoAjuste: string;
  descripcion: string;
  estado: string;
  fechaRecomendacion: string;
  fechaImplementacion: string;
  usuarioId: number; // Solo enviamos el ID, tal como espera tu DTO del backend
}
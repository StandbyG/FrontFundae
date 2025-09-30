export interface AjusteRazonableOngCreate {
  usuarioId: number;
  espacio?: string;
  observacion: string;
  ajustesSugeridos?: string;
  refNormativa?: string;
  refFotografica?: string;
  dificultad?: 'BAJA' | 'MEDIA' | 'ALTA';
  urgencia?: 'BAJA' | 'MEDIA' | 'ALTA';
  estado?: string;
  fechaRecomendacion?: string;
  fechaImplementacion?: string; 
}

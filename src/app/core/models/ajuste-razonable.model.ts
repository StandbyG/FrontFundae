import { Usuario } from './usuario.model';

export interface AjusteRazonable {
  idAjuste: number;
  tipoAjuste: string;
  descripcion: string;
  fechaRecomendacion: string;
  fechaImplementacion: string;
  estado: string;
  alertado: boolean;
  usuario: Usuario;
  origen: 'EMPRESA' | 'ONG';
  espacio?: string;
  observacion?: string;
  ajustesSugeridos?: string;
  refNormativa?: string;
  refFotografica?: string;
  dificultad?: 'BAJA' | 'MEDIA' | 'ALTA';
  urgencia?: 'BAJA' | 'MEDIA' | 'ALTA';
}
import { Usuario } from './usuario.model'; // Importas la interfaz de Usuario

export interface AjusteRazonable {
  idAjuste: number; // Ya no es opcional, porque siempre lo recibes
  tipoAjuste: string;
  descripcion: string;
  fechaRecomendacion: string; // Se reciben como string
  fechaImplementacion: string;
  estado: string;
  alertado: boolean;
  usuario: Usuario; // Recibes el objeto de usuario anidado
}
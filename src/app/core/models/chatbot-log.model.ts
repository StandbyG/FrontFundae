import { Usuario } from './usuario.model';

export interface ChatbotLog {
  idLog?: number;
  pregunta: string;
  respuesta: string;
  fecha: Date;
  usuario: Usuario; 
}

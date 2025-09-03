export interface Verificacion {
  idVerificacion?: number;  // ID de la verificación, generado por el backend (opcional al crear)
  fechaVerificacion: string;  // Fecha de la verificación
  observaciones: string;
  resultado: string;  // Puede ser 'cumple', 'no cumple' o 'parcial'
  usuarioId: number;  // ID del usuario al que se le realiza la verificación

}

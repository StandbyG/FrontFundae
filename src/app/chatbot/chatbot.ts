import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatgptService } from '../services/openai.service';
import { ChatbotLogService } from '../services/chatbotlog.service';
// <-- servicio que guarda logs

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.scss'],
})
export class ChatbotComponent {
  @Output() close = new EventEmitter<void>();
  userMessage: string = '';
  messages: { user: string; bot: string }[] = [];

  constructor(
    private chatgptService: ChatgptService,
    private chatbotLogService: ChatbotLogService
  ) {}

  sendMessage() {
    const pregunta = this.userMessage.trim();
    if (!pregunta) return;

    // Mostrar el mensaje del usuario en la interfaz
    this.messages.push({ user: pregunta, bot: '...' });

    // Llamar a OpenAI
    this.chatgptService.sendMessage(pregunta).subscribe(
      (response) => {
        const respuesta =
          response?.choices?.[0]?.message?.content?.trim?.() ||
          'Sin respuesta del bot.';

        // Mostrar respuesta en el chat
        this.messages[this.messages.length - 1].bot = respuesta;

        // Llamar a tu backend para guardar la conversación
        this.chatbotLogService
          .guardarConversacion(pregunta, respuesta)
          .subscribe(
            () => {
              // Limpiar el input tras guardar exitosamente
              this.userMessage = '';
            },
            (error: any) => {
              console.error('Error al guardar en el backend:', error);
            }
          );
      },
      (error) => {
        console.error('Error al obtener respuesta de OpenAI:', error);
        this.messages[this.messages.length - 1].bot =
          'Error al contactar al bot.';
      }
    );
  }
  closeChatbot() {
    this.close.emit();
  }
}

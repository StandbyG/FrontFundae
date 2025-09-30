import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChatgptService } from '../services/openai.service';
import { ChatbotLogService } from '../services/chatbotlog.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class ChatbotComponent implements AfterViewChecked {
  @Output() close = new EventEmitter<void>();
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  userMessage: string = '';
  messages: { user: string; bot: string; timestamp?: Date }[] = [];
  isTyping: boolean = false;
  private shouldScrollToBottom = false;

  constructor(
    private chatgptService: ChatgptService,
    private chatbotLogService: ChatbotLogService
  ) {}

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  sendMessage() {
    const pregunta = this.userMessage.trim();
    if (!pregunta || this.isTyping) return;

    // Agregar mensaje del usuario
    this.messages.push({
      user: pregunta,
      bot: '...',
      timestamp: new Date(),
    });

    this.userMessage = '';
    this.isTyping = true;
    this.shouldScrollToBottom = true;

    // Simular delay de respuesta (más realista)
    setTimeout(() => {
      this.chatgptService.sendMessage(pregunta).subscribe(
        (response) => {
          const respuesta =
            response.content?.trim?.() ||
            'Lo siento, no pude procesar tu solicitud. Por favor, intenta de nuevo.';
          this.messages[this.messages.length - 1].bot = respuesta;
          this.isTyping = false;
          this.shouldScrollToBottom = true;

          // Guardar en el backend
          this.chatbotLogService
            .guardarConversacion(pregunta, respuesta)
            .subscribe(
              () => {
                console.log('Conversación guardada exitosamente');
              },
              (error: any) => {
                console.error('Error al guardar en el backend:', error);
              }
            );
        },
        (error) => {
          console.error('Error al obtener respuesta de OpenAI:', error);
          this.messages[this.messages.length - 1].bot =
            'Lo siento, hubo un error al conectar con el servicio. Por favor, intenta más tarde.';
          this.isTyping = false;
          this.shouldScrollToBottom = true;
        }
      );
    }, 500);
  }

  sendQuickMessage(message: string) {
    this.userMessage = message;
    this.sendMessage();
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  closeChatbot() {
    this.close.emit();
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error al hacer scroll:', err);
    }
  }
}

import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChatgptService } from '../services/openai.service';
import { ChatbotLogService } from '../services/chatbotlog.service';

interface Message {
  user: string;
  bot: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate(
          '400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class ChatbotComponent implements AfterViewChecked, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  userMessage: string = '';
  messages: Message[] = [];
  isTyping: boolean = false;
  private shouldScrollToBottom = false;
  private scrollTimeout: any;

  constructor(
    private chatgptService: ChatgptService,
    private chatbotLogService: ChatbotLogService
  ) {}

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  sendMessage(): void {
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

    // Simular delay de respuesta más realista
    this.scrollTimeout = setTimeout(() => {
      this.chatgptService.sendMessage(pregunta).subscribe({
        next: (response) => {
          const respuesta =
            response.content?.trim?.() ||
            'Lo siento, no pude procesar tu solicitud. Por favor, intenta de nuevo.';
          
          const lastMessage = this.messages[this.messages.length - 1];
          if (lastMessage) {
            lastMessage.bot = respuesta;
            lastMessage.timestamp = new Date();
          }
          
          this.isTyping = false;
          this.shouldScrollToBottom = true;

          // Guardar en el backend
          this.saveConversation(pregunta, respuesta);
        },
        error: (error) => {
          console.error('Error al obtener respuesta de OpenAI:', error);
          
          const errorMessage = this.getErrorMessage(error);
          const lastMessage = this.messages[this.messages.length - 1];
          if (lastMessage) {
            lastMessage.bot = errorMessage;
            lastMessage.timestamp = new Date();
          }
          
          this.isTyping = false;
          this.shouldScrollToBottom = true;
        }
      });
    }, 500);
  }

  sendQuickMessage(message: string): void {
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

  closeChatbot(): void {
    this.close.emit();
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error al hacer scroll:', err);
    }
  }

  private saveConversation(pregunta: string, respuesta: string): void {
    this.chatbotLogService.guardarConversacion(pregunta, respuesta).subscribe({
      next: () => {
        console.log('Conversación guardada exitosamente');
      },
      error: (error) => {
        console.error('Error al guardar conversación:', error);
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error?.status === 0) {
      return 'No se pudo conectar con el servicio. Verifica tu conexión a internet.';
    } else if (error?.status === 429) {
      return 'Demasiadas solicitudes. Por favor, espera un momento e intenta nuevamente.';
    } else if (error?.status >= 500) {
      return 'El servicio no está disponible temporalmente. Intenta más tarde.';
    } else {
      return 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta más tarde.';
    }
  }

  get hasMessages(): boolean {
    return this.messages.length > 0;
  }
}
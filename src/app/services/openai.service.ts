import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatResponseDTO {
  content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatgptService {
  private apiUrl = `${environment.apiUrl}/api/openai/chat`;

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<ChatResponseDTO> {
    const body = {
      message,
      model: 'gpt-4.1',
      maxTokens: 150,
      temperature: 0.7,
    };

    return this.http.post<ChatResponseDTO>(this.apiUrl, body);
  }
}

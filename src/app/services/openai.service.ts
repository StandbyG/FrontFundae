import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatgptService {

  private apiUrl = `${environment.apiUrlApi}/v1/chat/completions`; // API endpoint de OpenAI
  private apiKey = environment.openAIApiKey;

  constructor(private http: HttpClient) {}

  
  sendMessage(message: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    });

    const body = {
      model: 'gpt-4.1', 
      messages: [{ role: 'user', content: message }], 
      max_tokens: 150,
      temperature: 0.7,
    };

    return this.http.post(this.apiUrl, body, { headers });
  }
    
}
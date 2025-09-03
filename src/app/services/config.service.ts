// src/app/services/config.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  getOpenAIApiKey(): string {
    // En desarrollo, usa el valor hardcodeado
    if (!environment.production) {
      return 'tsk-proj-ZYMg-H-1kgV5Vx3rxn6OI-al2C9t66byrjVF-QtYJb7F82MI-ktYSpCugIY-UU2lggPCZ9XBp8T3BlbkFJ5xp756oHsurUicy6rkmp8-YqQoInds0fKfxJGZMk6wx1yXzoV5zjUjVyHY-HqbqbsGInGYHQEA';
    }

    // En producción, toma la variable de entorno
    return (window as any)._env_?.OPENAI_API_KEY || '';
  }

  getApiUrl(): string {
    return environment.apiUrl;
  }
}

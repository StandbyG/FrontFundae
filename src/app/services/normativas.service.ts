import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface NormativaOption {
  label: string;   // "Norma A120 — 10A"
  fuente: string;  // "Norma A120"
  ref: string;     // "10A"
}

@Injectable({ providedIn: 'root' })
export class NormativasService {
  private http = inject(HttpClient);

  getAll(): Observable<NormativaOption[]> {
    return this.http.get<NormativaOption[]>('/assets/normativas.json')
      .pipe(map(list => list ?? []));
  }
}

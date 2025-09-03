import * as XLSX from 'xlsx';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './../../core/services/auth.services';
import { AjusteRazonableService } from '../../services/ajuste-razonable.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { AjusteRazonableCreate } from '../../core/models/ajuste-razonable-create.model';

@Component({
  selector: 'app-ajuste-razonable-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './ajuste-razonable-create.component.html',
  styleUrls: ['./ajuste-razonable-create.component.scss']
})
export class AjusteRazonableCreateComponent implements OnInit {
  
  ajusteForm: FormGroup;
  activeTab: 'manual' | 'excel' = 'manual';
  fileName: string | null = null;
  parsedData: any[] = [];
  isUploading = false;

  constructor(
    private fb: FormBuilder,
    private ajusteService: AjusteRazonableService,
    private router: Router,
    private authService: AuthService
  ) {
    // El formulario principal ahora contiene un FormArray
    this.ajusteForm = this.fb.group({
      ajustes: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // Añade el primer formulario de ajuste al cargar la página
    this.addAjuste();
  }

  // Getter para acceder fácilmente al FormArray desde el HTML
  get ajustesFormArray() {
    return this.ajusteForm.get('ajustes') as FormArray;
  }

  // Crea un nuevo FormGroup para un solo ajuste
  newAjusteGroup(): FormGroup {
    return this.fb.group({
      tipoAjuste: ['', Validators.required],
      descripcion: ['', Validators.required],
      fechaRecomendacion: ['', Validators.required],
      fechaImplementacion: [''], // Opcional, como habíamos discutido
      estado: ['pendiente', Validators.required]
    });
  }

  onFileChange(event: any): void {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      throw new Error('No se puede usar múltiples archivos');
    }
    this.fileName = target.files[0].name;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      // Convierte la hoja de Excel a un array de objetos JSON
      this.parsedData = XLSX.utils.sheet_to_json(ws);
    };
    reader.readAsBinaryString(target.files[0]);
  }


  // Añade un nuevo formulario de ajuste a la lista
  addAjuste(): void {
    this.ajustesFormArray.push(this.newAjusteGroup());
  }

  // Elimina un formulario de ajuste de la lista por su índice
  removeAjuste(index: number): void {
    this.ajustesFormArray.removeAt(index);
  }

  onSubmit(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      alert('Error de autenticación.');
      return;
    }

    let payload: any[] = [];
    
    // Decide qué datos enviar según la pestaña activa
    if (this.activeTab === 'manual') {
      if (this.ajusteForm.invalid) {
        alert('Por favor complete todos los campos requeridos.');
        return;
      }
      payload = this.ajusteForm.value.ajustes.map((ajuste: any) => ({
        ...ajuste,
        usuarioId: userId
      }));
    } else if (this.activeTab === 'excel') {
      if (this.parsedData.length === 0) {
        alert('No hay datos de archivo para cargar.');
        return;
      }
      this.isUploading = true;
      payload = this.parsedData.map(item => ({
        tipoAjuste: item['Tipo de Ajuste'],
        descripcion: item['Descripcion'],
        fechaRecomendacion: item['Fecha Recomendacion'],
        fechaImplementacion: new Date().toISOString().split('T')[0],
        estado: 'pendiente',
        usuarioId: userId
      }));
    }

    // Llama al mismo servicio de carga masiva
    this.ajusteService.createAjustesBulk(payload).subscribe({
      next: () => {
        alert('Ajustes creados con éxito.');
        this.isUploading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error al crear ajustes:', err);
        alert('Hubo un error al guardar los datos.');
        this.isUploading = false;
      }
    });
  }
}
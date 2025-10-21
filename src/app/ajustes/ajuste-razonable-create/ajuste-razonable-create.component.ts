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
  validationErrors: string[] = [];

  constructor(
    private fb: FormBuilder,
    private ajusteService: AjusteRazonableService,
    private router: Router,
    private authService: AuthService
  ) {
    this.ajusteForm = this.fb.group({
      ajustes: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.addAjuste();
  }

  get ajustesFormArray() {
    return this.ajusteForm.get('ajustes') as FormArray;
  }

  newAjusteGroup(): FormGroup {
    return this.fb.group({
      tipoAjuste: ['', Validators.required],
      descripcion: ['', Validators.required],
      fechaRecomendacion: ['', Validators.required],
      fechaImplementacion: [''],
      estado: ['pendiente', Validators.required]
    });
  }

  // Descargar plantilla Excel
  downloadTemplate(): void {
    const template = [
      { 'Tipo de Ajuste': 'Silla ergonómica', 'Descripcion': 'Silla con soporte lumbar ajustable' },
      { 'Tipo de Ajuste': 'Monitor elevado', 'Descripcion': 'Soporte para elevar el monitor a la altura de los ojos' },
      { 'Tipo de Ajuste': 'Teclado ergonómico', 'Descripcion': 'Teclado con diseño ergonómico para prevenir lesiones' }
    ];

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(template);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    
    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 25 },
      { wch: 50 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Ajustes');
    XLSX.writeFile(wb, 'plantilla_ajustes_razonables.xlsx');
  }

  onFileChange(event: any): void {
    this.validationErrors = [];
    this.parsedData = [];
    
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      this.validationErrors.push('Solo puedes cargar un archivo a la vez');
      return;
    }
    
    this.fileName = target.files[0].name;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Validar estructura del Excel
        if (data.length === 0) {
          this.validationErrors.push('El archivo está vacío');
          return;
        }

        // Validar cada fila
        const validatedData: any[] = [];
        data.forEach((row: any, index: number) => {
          const rowNumber = index + 2; // +2 porque Excel empieza en 1 y tiene header
          const errors: string[] = [];

          // Validar que solo tenga las columnas correctas
          const allowedColumns = ['Tipo de Ajuste', 'Descripcion'];
          const rowColumns = Object.keys(row);
          const extraColumns = rowColumns.filter(col => !allowedColumns.includes(col));
          
          if (extraColumns.length > 0) {
            errors.push(`Fila ${rowNumber}: Columnas no permitidas detectadas: ${extraColumns.join(', ')}`);
          }

          // Validar campos requeridos
          if (!row['Tipo de Ajuste'] || row['Tipo de Ajuste'].toString().trim() === '') {
            errors.push(`Fila ${rowNumber}: El campo "Tipo de Ajuste" es obligatorio`);
          }

          if (!row['Descripcion'] || row['Descripcion'].toString().trim() === '') {
            errors.push(`Fila ${rowNumber}: El campo "Descripcion" es obligatorio`);
          }

          // Validar longitud
          if (row['Tipo de Ajuste'] && row['Tipo de Ajuste'].toString().length > 200) {
            errors.push(`Fila ${rowNumber}: "Tipo de Ajuste" no debe exceder 200 caracteres`);
          }

          if (row['Descripcion'] && row['Descripcion'].toString().length > 500) {
            errors.push(`Fila ${rowNumber}: "Descripcion" no debe exceder 500 caracteres`);
          }

          if (errors.length > 0) {
            this.validationErrors.push(...errors);
          } else {
            validatedData.push({
              'Tipo de Ajuste': row['Tipo de Ajuste'].toString().trim(),
              'Descripcion': row['Descripcion'].toString().trim()
            });
          }
        });

        if (this.validationErrors.length === 0) {
          this.parsedData = validatedData;
        } else {
          this.fileName = null;
        }

      } catch (error) {
        this.validationErrors.push('Error al leer el archivo. Asegúrate de que sea un archivo Excel válido.');
        this.fileName = null;
      }
    };
    reader.readAsBinaryString(target.files[0]);
  }

  addAjuste(): void {
    this.ajustesFormArray.push(this.newAjusteGroup());
  }

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
    const today = new Date().toISOString().split('T')[0];
    
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
        alert('No hay datos válidos para cargar.');
        return;
      }
      this.isUploading = true;
      payload = this.parsedData.map(item => ({
        tipoAjuste: item['Tipo de Ajuste'],
        descripcion: item['Descripcion'],
        fechaRecomendacion: today,
        fechaImplementacion: today,
        estado: 'pendiente',
        usuarioId: userId
      }));
    }

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
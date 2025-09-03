import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../core/models/usuario.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  imports: [CommonModule, FormsModule,ReactiveFormsModule,RouterModule],
  styleUrls: ['./user-list.scss']
})
export class UserListComponent implements OnInit {
  users: Usuario[] = [];
  filteredUsers: Usuario[] = []; 
  isLoading = true;
  searchTerm: string = ''; 

  constructor(private usuarioService: UsuarioService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.usuarioService.getAllUsuarios().subscribe(data => {
      this.users = data;
      this.filteredUsers = data;
      this.isLoading = false;
    });
  }
  filterUsers(): void {
    if (!this.searchTerm) {
      this.filteredUsers = this.users; // Si no hay búsqueda, muestra todos los usuarios
      return;
    }

    const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user => 
      user.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
      user.correo.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }


  deleteUser(id: number | undefined): void {
  // 1. Si el ID no existe, no hacemos nada.
  if (id === undefined) {
    console.error('No se puede eliminar un usuario sin ID.');
    return;
  }

  // 2. Si el ID existe, TypeScript sabe que es un número y el resto del código funciona.
  if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
    this.usuarioService.deleteUsuario(id).subscribe(() => {
      this.users = this.users.filter(user => user.idUsuario !== id);
      alert('Usuario eliminado con éxito');
    });
  }
}
}
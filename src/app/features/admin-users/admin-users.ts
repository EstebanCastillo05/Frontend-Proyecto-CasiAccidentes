import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { AdminService } from '../../core/admin/admin.service';
import { Role, User } from '../../core/admin/admin.models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly formBuilder = inject(FormBuilder);

  readonly users = signal<User[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly selectedUser = signal<User | null>(null);
  readonly feedback = signal('');
  readonly errorMessage = signal('');
  readonly displayedColumns = ['usuario', 'rol', 'estado', 'acciones'];

  readonly activeUsersCount = computed(() => this.users().filter((user) => user.activo !== false).length);

  readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    id_rol: [0, [Validators.required, Validators.min(1)]],
    activo: [true],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.adminService.getRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles.filter((role) => role.activo !== false));
        this.loadUsers();
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudieron cargar los roles');
      },
    });
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudieron cargar los usuarios');
      },
    });
  }

  submit(): void {
    if (!this.selectedUser() && !this.form.controls.password.value) {
      this.form.controls.password.setErrors({ required: true });
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.feedback.set('');
    this.errorMessage.set('');

    const formValue = this.form.getRawValue();
    const selectedUser = this.selectedUser();

    if (selectedUser) {
      const updateData = {
        nombre: formValue.nombre,
        correo: formValue.correo,
        id_rol: formValue.id_rol,
        activo: formValue.activo,
        ...(formValue.password ? { password: formValue.password } : {}),
      };

      this.adminService.updateUser(selectedUser.id_usuario, updateData).subscribe({
        next: () => this.afterSave('Usuario actualizado correctamente'),
        error: (error) => this.afterError(error.error?.message || 'No se pudo actualizar el usuario'),
      });

      return;
    }

    this.adminService
      .createUser({
        nombre: formValue.nombre,
        correo: formValue.correo,
        password: formValue.password,
        id_rol: formValue.id_rol,
      })
      .subscribe({
        next: () => this.afterSave('Usuario creado correctamente'),
        error: (error) => this.afterError(error.error?.message || 'No se pudo crear el usuario'),
      });
  }

  editUser(user: User): void {
    const userRole = this.getUserRole(user);
    this.selectedUser.set(user);
    this.feedback.set('');
    this.errorMessage.set('');
    this.form.reset({
      nombre: user.nombre || '',
      correo: user.correo || '',
      password: '',
      id_rol: userRole?.id_rol || 0,
      activo: user.activo !== false,
    });
  }

  cancelEdit(): void {
    this.selectedUser.set(null);
    this.form.reset({
      nombre: '',
      correo: '',
      password: '',
      id_rol: 0,
      activo: true,
    });
  }

  deactivateUser(user: User): void {
    this.adminService.deleteUser(user.id_usuario).subscribe({
      next: () => this.afterSave('Usuario desactivado correctamente'),
      error: (error) => this.afterError(error.error?.message || 'No se pudo desactivar el usuario'),
    });
  }

  getUserRole(user: User): Role | null {
    return user.usuario_roles.find((userRole) => userRole.roles)?.roles || null;
  }

  private afterSave(message: string): void {
    this.isSaving.set(false);
    this.feedback.set(message);
    this.cancelEdit();
    this.loadUsers();
  }

  private afterError(message: string): void {
    this.isSaving.set(false);
    this.errorMessage.set(message);
  }
}

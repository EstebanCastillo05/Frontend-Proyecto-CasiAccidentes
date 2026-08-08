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
import { forkJoin } from 'rxjs';
import { AdminService } from '../../core/admin/admin.service';
import { Brigada, Region, Role, User } from '../../core/admin/admin.models';
import {
  ROL_PRL_CONTRATISTA,
  ROL_RESPONSABLE_PROCESO,
  ROL_GESTOR_SYMA,
  ROL_GESTION_CONTROL_SYMA,
} from '../../core/auth/roles.constants';

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
  readonly brigadas = signal<Brigada[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly regiones = signal<Region[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isSavingBrigada = signal(false);
  readonly selectedUser = signal<User | null>(null);
  readonly selectedBrigada = signal<Brigada | null>(null);
  readonly feedback = signal('');
  readonly brigadaFeedback = signal('');
  readonly errorMessage = signal('');
  readonly brigadaErrorMessage = signal('');
  readonly displayedColumns = ['usuario', 'rol', 'estado', 'acciones'];
  readonly brigadaColumns = ['brigada', 'region', 'prl', 'responsable', 'estado', 'acciones'];

  readonly activeUsersCount = computed(() => this.users().filter((user) => user.activo !== false).length);
  readonly activeBrigadasCount = computed(() => this.brigadas().filter((brigada) => brigada.activo !== false).length);

  readonly usuariosPrl = computed(() =>
    this.users().filter((u) => u.activo !== false && this.getUserRole(u)?.id_rol === ROL_PRL_CONTRATISTA)
  );
  readonly usuariosResponsable = computed(() =>
    this.users().filter((u) => u.activo !== false && this.getUserRole(u)?.id_rol === ROL_RESPONSABLE_PROCESO)
  );

  // --- Regiones asignadas a usuarios SYMA / Gestión y Control SYMA ---
  readonly isSavingRegiones = signal(false);
  readonly regionesFeedback = signal('');
  readonly regionesErrorMessage = signal('');
  readonly regionesSeleccionadas = signal<number[]>([]);

  readonly esUsuarioConRegion = computed(() => {
    const idRol = this.form.controls.id_rol.value;
    return idRol === ROL_GESTOR_SYMA || idRol === ROL_GESTION_CONTROL_SYMA;
  });

  readonly form = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    id_rol: [0, [Validators.required, Validators.min(1)]],
    activo: [true],
  });

  readonly brigadaForm = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required]],
    id_region: [0, [Validators.required, Validators.min(1)]],
    id_usuario_prl: [0],
    id_usuario_responsable: [0],
    activo: [true],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.brigadaErrorMessage.set('');

    forkJoin({
      roles: this.adminService.getRoles(),
      catalogos: this.adminService.getBrigadaCatalogos(),
      users: this.adminService.getUsers(),
      brigadas: this.adminService.getBrigadas(),
    }).subscribe({
      next: ({ roles, catalogos, users, brigadas }) => {
        this.roles.set(roles.filter((role) => role.activo !== false));
        this.regiones.set(catalogos.regiones);
        this.users.set(users);
        this.brigadas.set(brigadas);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudieron cargar los datos de administracion');
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
    this.regionesFeedback.set('');
    this.regionesErrorMessage.set('');
    this.regionesSeleccionadas.set([]);
    this.form.reset({
      nombre: user.nombre || '',
      correo: user.correo || '',
      password: '',
      id_rol: userRole?.id_rol || 0,
      activo: user.activo !== false,
    });

    if (userRole?.id_rol === ROL_GESTOR_SYMA || userRole?.id_rol === ROL_GESTION_CONTROL_SYMA) {
      this.adminService.getRegionesUsuario(user.id_usuario).subscribe({
        next: (asignaciones) => {
          const ids = asignaciones.map((a) => a.id_region).filter((id): id is number => id !== null);
          this.regionesSeleccionadas.set(ids);
        },
        error: () => this.regionesErrorMessage.set('No se pudieron cargar las regiones asignadas'),
      });
    }
  }

  guardarRegiones(): void {
    const user = this.selectedUser();
    const idRol = this.form.controls.id_rol.value;
    if (!user || !idRol) return;

    this.isSavingRegiones.set(true);
    this.regionesFeedback.set('');
    this.regionesErrorMessage.set('');

    this.adminService.setRegionesUsuario(user.id_usuario, idRol, this.regionesSeleccionadas()).subscribe({
      next: () => {
        this.isSavingRegiones.set(false);
        this.regionesFeedback.set('Regiones asignadas correctamente');
      },
      error: (error) => {
        this.isSavingRegiones.set(false);
        this.regionesErrorMessage.set(error.error?.message || 'No se pudieron asignar las regiones');
      },
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

  submitBrigada(): void {
    if (this.brigadaForm.invalid) {
      this.brigadaForm.markAllAsTouched();
      return;
    }

    this.isSavingBrigada.set(true);
    this.brigadaFeedback.set('');
    this.brigadaErrorMessage.set('');

    const formValue = this.brigadaForm.getRawValue();
    const selectedBrigada = this.selectedBrigada();

    const brigadaData = {
        nombre: formValue.nombre,
        id_region: formValue.id_region,
        id_usuario_prl: formValue.id_usuario_prl || null,
        id_usuario_responsable: formValue.id_usuario_responsable || null,
        activo: formValue.activo,
    };

    if (selectedBrigada) {
      this.adminService.updateBrigada(selectedBrigada.id_brigada, brigadaData).subscribe({
        next: () => this.afterBrigadaSave('Brigada actualizada correctamente'),
        error: (error) => this.afterBrigadaError(error.error?.message || 'No se pudo actualizar la brigada'),
      });

      return;
    }

    this.adminService.createBrigada(brigadaData).subscribe({
      next: () => this.afterBrigadaSave('Brigada creada correctamente'),
      error: (error) => this.afterBrigadaError(error.error?.message || 'No se pudo crear la brigada'),
    });
  }

  loadBrigadas(): void {
    this.adminService.getBrigadas().subscribe({
      next: (brigadas) => this.brigadas.set(brigadas),
      error: () => this.brigadaErrorMessage.set('No se pudieron cargar las brigadas'),
    });
  }

  resetBrigadaForm(): void {
    this.selectedBrigada.set(null);
    this.brigadaForm.reset({
      nombre: '',
      id_region: 0,
      id_usuario_prl: 0,
      id_usuario_responsable: 0,
      activo: true,
    });
  }

  editBrigada(brigada: Brigada): void {
    this.selectedBrigada.set(brigada);
    this.brigadaFeedback.set('');
    this.brigadaErrorMessage.set('');
    const asignacion = brigada.brigada_asignacion?.[0];
    this.brigadaForm.reset({
      nombre: brigada.nombre || '',
      id_region: brigada.id_region || 0,
      id_usuario_prl: asignacion?.id_usuario_prl || 0,
      id_usuario_responsable: asignacion?.id_usuario_responsable || 0,
      activo: brigada.activo !== false,
    });
  }

  deactivateBrigada(brigada: Brigada): void {
    this.isSavingBrigada.set(true);
    this.brigadaFeedback.set('');
    this.brigadaErrorMessage.set('');

    this.adminService.deleteBrigada(brigada.id_brigada).subscribe({
      next: () => this.afterBrigadaSave('Brigada desactivada correctamente'),
      error: (error) => this.afterBrigadaError(error.error?.message || 'No se pudo desactivar la brigada'),
    });
  }

  toggleBrigadaStatus(brigada: Brigada): void {
    if (brigada.activo === false) {
      this.isSavingBrigada.set(true);
      this.brigadaFeedback.set('');
      this.brigadaErrorMessage.set('');

      this.adminService.updateBrigada(brigada.id_brigada, { activo: true }).subscribe({
        next: () => this.afterBrigadaSave('Brigada activada correctamente'),
        error: (error) => this.afterBrigadaError(error.error?.message || 'No se pudo activar la brigada'),
      });

      return;
    }

    this.deactivateBrigada(brigada);
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

  private afterBrigadaSave(message: string): void {
    this.isSavingBrigada.set(false);
    this.brigadaFeedback.set(message);
    this.resetBrigadaForm();
    this.loadBrigadas();
  }

  private afterBrigadaError(message: string): void {
    this.isSavingBrigada.set(false);
    this.brigadaErrorMessage.set(message);
  }
}

export interface EstadoOption {
  id_estado: number;
  nombre: string;
}

// Listado temporalmente hasta tener endpoints de estados en el backend.
export const ESTADOS_CASO: EstadoOption[] = [
  { id_estado: 1, nombre: 'Reportado' },
  { id_estado: 2, nombre: 'Pendiente de revision PRL' },
  { id_estado: 3, nombre: 'Pendiente de revision del responsable del Proceso' },
  { id_estado: 4, nombre: 'Pendiente de validacion SYMA' },
  { id_estado: 5, nombre: 'Rechazado por SYMA' },
  { id_estado: 6, nombre: 'Aceptado / Procede como casi accidente' },
  { id_estado: 7, nombre: 'Pendiente de formato inicial' },
  { id_estado: 8, nombre: 'Pendiente de formato de divulgacion' },
  { id_estado: 9, nombre: 'Pendiente de acciones correctivas' },
  { id_estado: 10, nombre: 'Pendiente de evidencias' },
  { id_estado: 11, nombre: 'Evidencias en revision' },
  { id_estado: 12, nombre: 'Cerrado sin acciones' },
  { id_estado: 13, nombre: 'Cerrado con acciones' },
  { id_estado: 14, nombre: 'Anulado' },
];
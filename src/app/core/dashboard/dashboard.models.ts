export interface ApiResponse<T> {
  message: string;
  data: T;
}

export type DashboardOutcomeFilter = 'en_proceso' | 'resueltos' | 'rechazados_anulados';

export interface DashboardFilters {
  fechaInicio?: string;
  fechaFin?: string;
  resultado?: DashboardOutcomeFilter | '';
  id_estado?: number | '';
  id_brigada?: number | '';
  id_proceso?: number | '';
  id_region?: number | '';
}

export interface DashboardFilterOption {
  id: number;
  nombre: string;
}

export interface DashboardFilterOptions {
  estados: Array<{ id_estado: number; nombre: string | null }>;
  brigadas: Array<{ id_brigada: number; nombre: string | null }>;
  procesos: Array<{ id_proceso: number; nombre: string | null }>;
  regiones: Array<{ id_region: number; nombre: string | null }>;
}

export interface DashboardSummary {
  totalCasos: number;
  casosAceptados: number;
  casosRechazados: number;
  casosPendientes: number;
  enProceso: number;
  resueltos: number;
  rechazadosAnulados: number;
  totalAcciones: number;
  accionesAbiertas: number;
  avancePromedioAcciones: number;
}

export interface AcceptedRejectedDatum {
  estado: string;
  valor: number;
}

export interface StatusDatum {
  id_estado: number | null;
  nombre: string;
  total: number;
}

export interface BrigadeDatum {
  id_brigada: number | null;
  nombre: string;
  total: number;
}

export interface ProcessDatum {
  id_proceso: number | null;
  nombre: string;
  total: number;
}

export interface StageFlowDatum {
  id_estado: number | null;
  nombre: string;
  orden: number;
  total: number;
  porcentajeTotal: number;
  porcentajeAnterior: number;
}

export interface CorrectiveActionProgressDatum {
  estado: string;
  total: number;
  avancePromedio: number;
}

export interface TimeByStageDatum {
  id_estado: number | null;
  nombre: string;
  movimientos: number;
  horasPromedio: number;
  diasPromedio: number;
}

export interface MonthlyStageItem {
  nombre: string;
  total: number;
}

export interface MonthlyByStageDatum {
  periodo: string;
  mes: string;
  total: number;
  etapas: MonthlyStageItem[];
}

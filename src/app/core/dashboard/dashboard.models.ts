export interface ApiResponse<T> {
  message: string;
  data: T;
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

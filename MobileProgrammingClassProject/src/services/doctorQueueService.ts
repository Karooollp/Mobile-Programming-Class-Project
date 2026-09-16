// src/utils/DoctorQueue.ts

export type PatientAppointment = {
  id: string;
  patientName: string;
  appointmentDate: string;
  reason?: string;
  attended: boolean;
};

export class DoctorQueue {
  private queue: PatientAppointment[] = [];
  private maxDailyCapacity: number;

  constructor(appointments: PatientAppointment[], maxDailyCapacity: number = 10) {
    // Filtrar solo citas no atendidas y ordenarlas por fecha/hora (FIFO)
    this.queue = appointments
      .filter((a) => !a.attended)
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    
    this.maxDailyCapacity = maxDailyCapacity;
  }

  // Comprobar si la cola del día está llena
  public isFull(): boolean {
    return this.queue.length >= this.maxDailyCapacity;
  }

  // Ver el siguiente paciente en turno sin sacarlo (Peek)
  public getNextPatient(): PatientAppointment | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  // Obtener la posición de un paciente específico (1-based index)
  public getPatientPosition(appointmentId: string): number {
    const index = this.queue.findIndex((item) => item.id === appointmentId);
    return index !== -1 ? index + 1 : -1;
  }

  // Obtener total de pacientes en espera
  public getWaitingCount(): number {
    return this.queue.length;
  }
}
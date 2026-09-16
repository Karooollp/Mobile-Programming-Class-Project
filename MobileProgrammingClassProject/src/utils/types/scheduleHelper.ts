export type FrequencyType = "TIMES_PER_DAY" | "INTERVAL" | "CUSTOM";

export type ScheduleConfig = {
  type: FrequencyType;
  intervalHours?: number; // ej. 6, 8, 12
  timesPerDay?: number;   // ej. 1, 2, 3, 4
  startTime: string;      // Formato "HH:mm" (24h)
};

/**
 * Genera el arreglo de horarios (HH:mm) basándose en la frecuencia configurada.
 */
export function generateScheduleTimes(config: ScheduleConfig): string[] {
  const { type, intervalHours, timesPerDay, startTime } = config;

  if (type === "CUSTOM" || !startTime) return [];

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const formattedMinute = startMinute.toString().padStart(2, "0");
  const times: string[] = [];

  // CASO 1: Por intervalo de horas (ej. Cada 8 horas)
  if (type === "INTERVAL" && intervalHours && intervalHours > 0) {
    const totalDoses = Math.floor(24 / intervalHours);
    for (let i = 0; i < totalDoses; i++) {
      const nextHour = (startHour + i * intervalHours) % 24;
      times.push(`${nextHour.toString().padStart(2, "0")}:${formattedMinute}`);
    }
  }
  // CASO 2: N veces al día divididas equitativamente
    else if (type === "TIMES_PER_DAY" && timesPerDay && timesPerDay > 0) {
      const deltaMinutes = (24 * 60) / timesPerDay;
      const startTotal = startHour * 60 + startMinute;
      for (let i = 0; i < timesPerDay; i++) {
        const total = Math.round(startTotal + i * deltaMinutes) % (24 * 60);
        const h = Math.floor(total / 60);
        const m = total % 60;
        times.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
      }
    }

  return Array.from(new Set(times)).sort();
}
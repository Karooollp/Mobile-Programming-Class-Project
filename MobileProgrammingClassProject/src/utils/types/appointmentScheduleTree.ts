// ============================================================================
// 🌳 ESTRUCTURA DE DATOS: ÁRBOL BINARIO DE BÚSQUEDA (BST) PARA HORARIOS DE CITAS
// ============================================================================
// Cada nodo es UNA cita, y su "llave" para ordenar es la hora de la cita
// (timestamp en milisegundos). Como las horas se pueden comparar (una es
// antes o después que otra), un BST es una forma natural de organizarlas:
// para saber si una hora está libre, el árbol arranca en la raíz (un nodo =
// una cita) y decide ir a la izquierda (horas más tempranas) o a la derecha
// (horas más tardías) igual que cuando buscas una palabra en el diccionario
// abriendo por la mitad y descartando la otra mitad en cada paso.

export type AppointmentNode = {
  timestamp: number; // hora de la cita, en milisegundos (Date.getTime())
  appointmentId: string;
  attended: boolean;
  left: AppointmentNode | null;
  right: AppointmentNode | null;
};

export class AppointmentScheduleTree {
  private root: AppointmentNode | null = null;
  private size = 0;

  // Inserta una cita en el árbol, bajando por la rama que le corresponde
  // según su hora.
  insert(timestamp: number, appointmentId: string, attended: boolean): void {
  const before = this.size;
  this.root = this.insertNode(this.root, timestamp, appointmentId, attended, () => {
    this.size += 1;
  });
}

private insertNode(
  node: AppointmentNode | null,
  timestamp: number,
  appointmentId: string,
  attended: boolean,
  onInsert: () => void
): AppointmentNode {
  if (!node) {
    onInsert();
    return { timestamp, appointmentId, attended, left: null, right: null };
  }
  if (timestamp < node.timestamp) {
    node.left = this.insertNode(node.left, timestamp, appointmentId, attended, onInsert);
  } else if (timestamp > node.timestamp) {
    node.right = this.insertNode(node.right, timestamp, appointmentId, attended, onInsert);
  }
  return node;
}

  // Empieza en un nodo (la raíz = una cita cualquiera) y va bajando por la
  // rama correcta hasta encontrar la hora buscada o quedarse sin ramas.
  // En promedio es mucho más rápido que revisar cita por cita en un arreglo.
  hasConflict(timestamp: number): boolean {
    return this.searchNode(this.root, timestamp) !== null;
  }

  private searchNode(node: AppointmentNode | null, timestamp: number): AppointmentNode | null {
    if (!node) return null;
    if (timestamp === node.timestamp) return node;
    return timestamp < node.timestamp
      ? this.searchNode(node.left, timestamp)
      : this.searchNode(node.right, timestamp);
  }

  // Cuántas citas hay en total ese día (para el cupo diario del doctor).
  count(): number {
    return this.size;
  }

  // Recorrido "in-order" (izquierda -> nodo -> derecha): por cómo se
  // construye un BST, esto entrega las citas YA ordenadas de la más
  // temprana a la más tardía, sin necesitar un sort() aparte.
  toSortedList(): AppointmentNode[] {
    const result: AppointmentNode[] = [];
    const traverse = (node: AppointmentNode | null) => {
      if (!node) return;
      traverse(node.left);
      result.push(node);
      traverse(node.right);
    };
    traverse(this.root);
    return result;
  }
}
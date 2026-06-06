// AGE
export const validateAge = (value: string) => {
  if (!value?.trim()) return "Edad requerida";
  if (!/^\d+$/.test(value)) return "Solo números";
  
  const num = Number(value);
  if (num < 1 || num > 120) return "Edad fuera de rango";
  
  return null;
};

// PHONE
export const validatePhone = (value: string) => {
  if (!value?.trim()) return "Teléfono requerido";
  if (!/^\d{8,15}$/.test(value)) return "Teléfono inválido";
  return null;
};

// TEXT (nombre, apellido, dirección)
export const validateText = (value: string, field: string) => {
  if (!value?.trim()) return `${field} requerido`;
  if (value.trim().length < 2) return `${field} muy corto`;
  return null;
};

// EMAIL
export const validateEmail = (value: string) => {
  if (!value?.trim()) return "Correo requerido";
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(value)) return "Correo inválido";
  
  return null;
};

// PASSWORD
export const validatePassword = (value: string) => {
  if (!value) return "Contraseña requerida";
  if (value.length < 5) return "Mínimo 5 caracteres";
  return null;
};

// GENDER (SELECT)
export const GENDERS = ["Masculino", "Femenino", "Otro"];

export const validateGender = (value: string) => {
  if (!value) return "Selecciona un género";
  return null;
};

// BLOOD TYPE (SELECT REAL)
export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const validateBloodType = (value: string) => {
  if (!value) return "Selecciona tipo de sangre";
  if (!BLOOD_TYPES.includes(value)) return "Tipo inválido";
  return null;
};

// DATE
export const formatDateForDB = (date: Date | null) => {
  if (!date) return null;
  return date.toISOString().split("T")[0];
};


// Representa variqbles como edad, genero,enfermedad y observaciones
export type UserProfile = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  
  age?: number;
  phone?: string;
  address?: string;
  gender?: string;
  blood_type?: string;
  emergency_contact?: string;
  birth_date?: string | null;
  photo_url?: string | null;
};
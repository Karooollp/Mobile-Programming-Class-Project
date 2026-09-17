// Representa variables como edad, genero, enfermedad y observaciones
export type UserProfile = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles_id?: string;
  status: "active" | "inactive" | "deleted" | "banned";
  age?: number | null;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  emergency_contact?: string | null;
  birth_date?: string | null;
  photo_url?: string | null;
  birth_certificate_url?: string | null;
  profile_completed: boolean;
  role_name?: string | null; // viene del JOIN con "roles", no de la tabla "users"
};
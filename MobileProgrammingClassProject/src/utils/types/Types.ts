// Representa variqbles como edad, genero,enfermedad y observaciones
export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  gender: string | null;
  birthDate: string | null;
  photoUrl: string | null;
  phone: string | null;
  email: string;
  address: string | null;
  bloodType: string | null;
  emergencyContact: string | null;
  status: 'active' | 'inactive' | 'deleted' | 'banned';
  createdAt: string;
  profileCompleted: boolean;
};
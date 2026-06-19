import { Supabase } from "../lib/Supabase";

export async function fetchUserProfile(userId: string) {
  const { data, error } = await Supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (error) throw error;
  
  return {
    user_id: data.user_id,
    first_Name: data.first_name,
    last_Name: data.last_name,
    email: data.email,
    status: data.status,
    
    age: data.age,
    gender: data.gender,
    birthDate: data.birth_date,
    photoUrl: data.photo_url,
    phone: data.phone,
    address: data.address,
    bloodType: data.blood_type,
    emergencyContact: data.emergency_contact,
    
    profileCompleted: true,
  };
}
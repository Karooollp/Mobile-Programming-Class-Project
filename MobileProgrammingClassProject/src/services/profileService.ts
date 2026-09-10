import { Supabase } from "../lib/Supabase";

export async function fetchUserProfile(userId: string) {
  // 1. Obtener usuario
  const { data, error } = await Supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (error) throw error;
  
  console.log("USER ID:", data.user_id);
  console.log("ROLES ID:", data.roles_id);
  console.log("ROLE ID ANTIGUO:", data.role_id);
  
  // 2. Obtener el rol relacionado
  const { data: roleData, error: roleError } = await Supabase
    .from("roles")
    .select("roles_id, role_name")
    .eq("roles_id", data.roles_id)
    .maybeSingle();
  
  console.log("ROLE DATA:", roleData);
  console.log("ROLE ERROR:", roleError);
  
  return {
    user_id: data.user_id,
    
    first_Name: data.first_name,
    last_Name: data.last_name,
    name: `${data.first_name} ${data.last_name}`,
    
    email: data.email,
    status: data.status,
    
    age: data.age,
    gender: data.gender,
    birthDate: data.birth_date,
    photoUrl: data.photo_url,
    birthCertificateUrl: data.birth_certificate_url,
    phone: data.phone,
    address: data.address,
    bloodType: data.blood_type,
    emergencyContact: data.emergency_contact,
    
    profileCompleted: data.profile_completed,
    
    // ID del rol
    roles_id: data.roles_id,
    
    // Nombre del rol
    role: roleData?.role_name ?? null,
  };
}
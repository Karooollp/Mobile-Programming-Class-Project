import { Supabase } from "../lib/Supabase";
import { UserProfile } from "../utils/types/Types";

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await Supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;

  const { data: roleData, error: roleError } = await Supabase
    .from("roles")
    .select("role_name")
    .eq("roles_id", data.roles_id)
    .maybeSingle();

  if (roleError) {
    console.warn("No se pudo obtener el rol:", roleError.message);
  }

  // data ya viene en snake_case, coincide 1:1 con UserProfile
  return {
    ...data,
    role_name: roleData?.role_name ?? null,
  } as UserProfile;
}
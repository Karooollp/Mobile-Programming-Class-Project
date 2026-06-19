const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${key}. Copia .env.example a .env y configura tus credenciales de Supabase.`
    );
  }
  return value;
};

export const env = {
  supabaseUrl: getEnvVar("EXPO_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getEnvVar("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
} as const;

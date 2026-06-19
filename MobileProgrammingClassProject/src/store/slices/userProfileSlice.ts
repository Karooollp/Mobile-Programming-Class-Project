import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type UserProfile = {
  user_id: string | null;
  first_Name: string;
  last_Name: string;
  email: string;
  status: "active" | "inactive" | "deleted" | "banned";
  
  // estos se completan en EDIT
  age?: number | null;
  gender?: string | null;
  birthDate?: string | null;
  photoUrl?: string | null;
  birthCertificateUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  bloodType?: string | null;
  emergencyContact?: string | null;
  profileCompleted: boolean;
};

type UserProfileState = {
  data: UserProfile | null;
};

const initialState: UserProfileState = {
  data: null,
};

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.data = action.payload;
    },
    
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (!state.data) return;
      state.data = {
        ...state.data,
        ...action.payload,
      };
    },
    
    clearProfile: (state) => {
      state.data = null;
    },
  },
});

export const { setProfile, updateProfile, clearProfile } =
  userProfileSlice.actions;

export default userProfileSlice.reducer;
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserProfile } from "../../utils/types/Types";

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
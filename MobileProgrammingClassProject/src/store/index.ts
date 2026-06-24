import { configureStore } from "@reduxjs/toolkit";
import userProfileReducer from "./slices/userProfileSlice";
import authReducer from "./slices/AuthSlices";

export const store = configureStore({
  reducer: {
    userProfile: userProfileReducer,
    auth: authReducer,
    
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
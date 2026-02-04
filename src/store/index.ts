import { configureStore } from "@reduxjs/toolkit";
import jobsReducer from "./jobsSlice";
import themeReducer from "./themeSlice";
import authReducer from "./authSlice";
import languageReducer from "./languageSlice";

const PERSIST_KEY = "hustlex_jobs";

function loadPreloadedState() {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    const darkRaw = localStorage.getItem("hustlex_theme_dark");
    const languageRaw = localStorage.getItem("hustlex_language");
    
    const jobs = raw ? JSON.parse(raw) : [];
    const darkMode = darkRaw ? JSON.parse(darkRaw) : false;
    const language = (languageRaw && ["en", "am", "ti", "om"].includes(languageRaw)) ? languageRaw : "en";
    
    return {
      jobs: { jobs },
      theme: { darkMode },
      language: { language },
    } as const;
  } catch {
    // Return default state if there's any error
    return {
      jobs: { jobs: [] },
      theme: { darkMode: false },
      language: { language: "en" },
    } as const;
  }
}

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    theme: themeReducer,
    auth: authReducer,
    language: languageReducer,
  },
  preloadedState: loadPreloadedState(),
});

store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state.jobs.jobs));
    localStorage.setItem(
      "hustlex_theme_dark",
      JSON.stringify(state.theme.darkMode)
    );
  } catch {
    // ignore write errors
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

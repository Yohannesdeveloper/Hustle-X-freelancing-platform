import { createSlice } from "@reduxjs/toolkit";

export type Language = "en" | "am" | "ti" | "om";

export interface LanguageState {
  language: Language;
}

const getInitialLanguage = (): Language => {
  try {
    const saved = localStorage.getItem("hustlex_language");
    if (saved && ["en", "am", "ti", "om"].includes(saved)) {
      return saved as Language;
    }
  } catch {
    // ignore errors
  }
  return "en"; // Default to English
};

const initialState: LanguageState = {
  language: getInitialLanguage(),
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage(state, { payload }: { payload: Language }) {
      state.language = payload;
      localStorage.setItem("hustlex_language", payload);
      // Sync with i18next if available
      if (typeof window !== "undefined" && (window as any).i18n) {
        (window as any).i18n.changeLanguage(payload);
      }
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;

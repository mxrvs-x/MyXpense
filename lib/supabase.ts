import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://ckntamtouzpuevbmpgav.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbnRhbXRvdXpwdWV2Ym1wZ2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4ODcyMzMsImV4cCI6MjA4OTQ2MzIzM30.ODG5zxJQgpWAndJVenqVJXBMZ8MH8wd5y-ZCtqMISvs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true, // 🔥 IMPORTANT
    detectSessionInUrl: false,
  },
});

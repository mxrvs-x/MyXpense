import { supabase } from "./supabase";

// ✅ helper: avoid timezone issues
const formatLocalDate = (date: Date) => {
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
};

export const ensureCurrentCycle = async () => {
  console.log("Running ensureCurrentCycle");

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;

  if (!user) return null;

  const today = new Date();
  const day = today.getDate();

  let start: Date;
  let end: Date;

  // 📅 cycle logic (7–21, 22–6)
  if (day >= 7 && day <= 21) {
    start = new Date(today.getFullYear(), today.getMonth(), 7);
    end = new Date(today.getFullYear(), today.getMonth(), 21);
  } else {
    if (day >= 22) {
      start = new Date(today.getFullYear(), today.getMonth(), 22);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 6);
    } else {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 22);
      end = new Date(today.getFullYear(), today.getMonth(), 6);
    }
  }

  const startDate = formatLocalDate(start);
  const endDate = formatLocalDate(end);

  // 🔍 Check if cycle already exists
  const { data: existing, error: fetchError } = await supabase
    .from("cycles")
    .select("*")
    .eq("user_id", user.id)
    .eq("start_date", startDate)
    .eq("end_date", endDate)
    .maybeSingle();

  if (fetchError) {
    console.log("Fetch error:", fetchError.message);
  }

  if (existing) {
    return existing;
  }

  // ➕ Create new cycle (NO budget)
  const { data: newCycle, error } = await supabase
    .from("cycles")
    .insert([
      {
        user_id: user.id,
        start_date: startDate,
        end_date: endDate,
      },
    ])
    .select()
    .maybeSingle();

  // ⚠️ Handle duplicate race condition
  if (error) {
    if (error.code === "23505") {
      console.log("Duplicate detected, fetching existing...");

      const { data } = await supabase
        .from("cycles")
        .select("*")
        .eq("user_id", user.id)
        .eq("start_date", startDate)
        .eq("end_date", endDate)
        .maybeSingle();

      return data;
    }

    console.log("Insert error:", error.message);
    return null;
  }

  return newCycle;
};

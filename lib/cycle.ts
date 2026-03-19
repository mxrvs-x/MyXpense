import { supabase } from "./supabase";

export const ensureCurrentCycle = async () => {
  console.log("Running ensureCurrentCycle");

  const { data: sessionData } = await supabase.auth.getSession();
  console.log("Session:", sessionData);
  const user = sessionData.session?.user;

  if (!user) return null;

  const today = new Date();
  const day = today.getDate();

  let start: Date;
  let end: Date;

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

  // 🔍 Check if cycle already exists
  const { data: existing } = await supabase
    .from("cycles")
    .select("*")
    .eq("user_id", user.id)
    .eq("start_date", start.toISOString().split("T")[0])
    .eq("end_date", end.toISOString().split("T")[0])
    .single();

  if (existing) return existing;

  // ➕ Create new cycle
  const { data: newCycle, error } = await supabase
    .from("cycles")
    .insert([
      {
        user_id: user.id,
        start_date: start,
        end_date: end,
        income: 0, // user sets later
        budget: 0,
      },
    ])
    .select()
    .single();

  if (error) {
    console.log(error.message);
    return null;
  }

  return newCycle;
};

import { supabase } from "./supabase";

export const updateCycleBudget = async (cycleId: string) => {
  const { data: wallets, error } = await supabase
    .from("wallets")
    .select("balance");

  if (error) {
    console.log(error.message);
    return;
  }

  const total = (wallets || []).reduce(
    (sum, w) => sum + Number(w.balance || 0),
    0,
  );

  await supabase
    .from("cycles")
    .update({ budget: Number(total.toFixed(2)) })
    .eq("id", cycleId);
};

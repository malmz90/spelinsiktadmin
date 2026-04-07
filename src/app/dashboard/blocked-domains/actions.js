"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/authService";
import { addNextDnsDenylistDomain } from "@/lib/nextDnsService";
import { createClient } from "@/lib/supabase/server";

function encodeNotice(message) {
  return encodeURIComponent(message);
}

export async function addBlockedDomainAction(formData) {
  const rawValue = String(formData.get("domain") ?? "");
  const supabase = await createClient();

  await requireAdminUser(supabase, {
    loginRedirect: "/login",
    notAdminRedirect: "/login",
  });

  let notice = "";
  let tone = "success";

  try {
    const domain = await addNextDnsDenylistDomain(rawValue);
    notice = `Domänen ${domain} har blockerats i NextDNS.`;
    revalidatePath("/dashboard/blocked-domains");
  } catch (error) {
    notice = error instanceof Error ? error.message : "Kunde inte lägga till domän i NextDNS.";
    tone = "error";
  }

  redirect(`/dashboard/blocked-domains?notice=${encodeNotice(notice)}&tone=${tone}`);
}

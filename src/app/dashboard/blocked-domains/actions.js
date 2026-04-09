"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/authService";
import {
  addNextDnsDenylistDomain,
  addNextDnsDenylistDomainsBulk,
} from "@/lib/nextDnsService";
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

function buildBulkFailureNotice(failedDomains) {
  const firstFailures = failedDomains.slice(0, 3).map((item) => item.domain);
  const extraCount = failedDomains.length - firstFailures.length;
  const suffix = extraCount > 0 ? ` (+${extraCount} till)` : "";
  return `Misslyckades med ${failedDomains.length}: ${firstFailures.join(", ")}${suffix}.`;
}

export async function addBlockedDomainsBulkAction(formData) {
  const rawValue = String(formData.get("domains") ?? "");
  const supabase = await createClient();

  await requireAdminUser(supabase, {
    loginRedirect: "/login",
    notAdminRedirect: "/login",
  });

  let notice = "";
  let tone = "success";

  try {
    const result = await addNextDnsDenylistDomainsBulk(rawValue);
    const parts = [
      `Tillagda: ${result.addedDomains.length}`,
      `Ogiltiga: ${result.invalidEntries.length}`,
      `Misslyckade: ${result.failedDomains.length}`,
    ];

    if (result.failedDomains.length > 0) {
      tone = "error";
      notice = `${parts.join(" · ")}. ${buildBulkFailureNotice(result.failedDomains)}`;
    } else {
      notice = `${parts.join(" · ")}.`;
    }

    revalidatePath("/dashboard/blocked-domains");
  } catch (error) {
    notice = error instanceof Error ? error.message : "Kunde inte lägga till domäner i NextDNS.";
    tone = "error";
  }

  redirect(`/dashboard/blocked-domains?notice=${encodeNotice(notice)}&tone=${tone}`);
}

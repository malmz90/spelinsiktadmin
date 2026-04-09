const NEXTDNS_BASE_URL = "https://api.nextdns.io";

export function normalizeDenylistInput(value) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed}`;

  let hostname = "";
  try {
    hostname = new URL(candidate).hostname;
  } catch {
    return null;
  }

  const normalized = hostname.replace(/\.$/, "");
  const domainRegex =
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

  return domainRegex.test(normalized) ? normalized : null;
}

export function parseBulkDenylistInput(value) {
  if (typeof value !== "string") {
    return { validDomains: [], invalidEntries: [] };
  }

  const entries = value
    .split(/[\n,;]+/g)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const validSet = new Set();
  const invalidEntries = [];

  for (const entry of entries) {
    const normalized = normalizeDenylistInput(entry);
    if (!normalized) {
      invalidEntries.push(entry);
      continue;
    }
    validSet.add(normalized);
  }

  return {
    validDomains: Array.from(validSet),
    invalidEntries,
  };
}

function parseApiError(payload, fallback = "Okänt fel från NextDNS.") {
  if (!payload || typeof payload !== "object") return fallback;
  const firstError = Array.isArray(payload.errors) ? payload.errors[0] : null;
  if (!firstError) return fallback;
  return firstError.detail || firstError.code || fallback;
}

async function nextDnsRequest(path, { method = "GET", body } = {}) {
  const apiKey = process.env.NEXTDNS_API_KEY;
  const profileId = process.env.NEXTDNS_PROFILE_ID;

  if (!apiKey || !profileId) {
    throw new Error(
      "NEXTDNS_API_KEY eller NEXTDNS_PROFILE_ID saknas i servermiljön."
    );
  }

  const response = await fetch(`${NEXTDNS_BASE_URL}/profiles/${profileId}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(parseApiError(payload, "Kunde inte prata med NextDNS API."));
  }

  if (payload?.errors?.length) {
    throw new Error(parseApiError(payload));
  }

  return payload ?? { data: null, meta: null };
}

export async function fetchNextDnsDenylistPage({ cursor } = {}) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);

  const qs = params.toString();
  const payload = await nextDnsRequest(`/denylist${qs ? `?${qs}` : ""}`);
  const data = Array.isArray(payload?.data) ? payload.data : [];
  const nextCursor = payload?.meta?.pagination?.cursor ?? null;

  return {
    items: data,
    nextCursor,
  };
}

export async function addNextDnsDenylistDomain(domain) {
  const normalizedDomain = normalizeDenylistInput(domain);
  if (!normalizedDomain) {
    throw new Error("Ogiltig domän. Ange en giltig URL eller domän.");
  }

  await nextDnsRequest("/denylist", {
    method: "POST",
    body: {
      id: normalizedDomain,
      active: true,
    },
  });

  return normalizedDomain;
}

export async function addNextDnsDenylistDomainsBulk(rawInput) {
  const { validDomains, invalidEntries } = parseBulkDenylistInput(rawInput);

  if (validDomains.length === 0) {
    throw new Error("Ingen giltig domän hittades. Ange minst en giltig URL eller domän.");
  }

  const addedDomains = [];
  const failedDomains = [];

  for (const domain of validDomains) {
    try {
      await addNextDnsDenylistDomain(domain);
      addedDomains.push(domain);
    } catch (error) {
      failedDomains.push({
        domain,
        reason:
          error instanceof Error ? error.message : "Kunde inte lägga till domänen i NextDNS.",
      });
    }
  }

  return {
    addedDomains,
    failedDomains,
    invalidEntries,
    submittedEntries: validDomains.length + invalidEntries.length,
  };
}

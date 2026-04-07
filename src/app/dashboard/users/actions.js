"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/authService";
import { createClient } from "@/lib/supabase/server";

function encodeNotice(message) {
  return encodeURIComponent(message);
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value);
}

function createStorageAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function buildStorageCandidates(fileValue, userId) {
  const raw = String(fileValue ?? "").trim();
  if (!raw) return [];

  const candidates = [];
  const pushCandidate = (bucket, path) => {
    if (!bucket || !path) return;
    const key = `${bucket}::${path}`;
    if (candidates.some((item) => `${item.bucket}::${item.path}` === key)) return;
    candidates.push({ bucket, path });
  };

  const fromStoragePathname = (pathname) => {
    const cleaned = pathname.replace(/^\/+/, "");
    const parts = cleaned.split("/");
    const objectIndex = parts.indexOf("object");
    if (objectIndex === -1) return;

    const bucket = parts[objectIndex + 2];
    const pathParts = parts.slice(objectIndex + 3);
    if (!bucket || pathParts.length === 0) return;

    pushCandidate(decodeURIComponent(bucket), decodeURIComponent(pathParts.join("/")));
  };

  if (isAbsoluteUrl(raw)) {
    try {
      const url = new URL(raw);
      fromStoragePathname(url.pathname);
    } catch {
      // Ignore malformed absolute URL and continue with fallbacks.
    }
  }

  if (raw.startsWith("/storage/")) {
    fromStoragePathname(raw);
  }

  const cleaned = raw.replace(/^\/+/, "").split("?")[0];
  const fallbackParts = cleaned.split("/");
  if (fallbackParts.length >= 2) {
    const maybeBucket = decodeURIComponent(fallbackParts[0]);
    const remainder = decodeURIComponent(fallbackParts.slice(1).join("/"));
    pushCandidate(maybeBucket, remainder);
    pushCandidate("feed-photos", cleaned);
    pushCandidate("avatars", cleaned);
    pushCandidate("family_photos", cleaned);
  } else if (fallbackParts.length === 1 && fallbackParts[0]) {
    const filename = decodeURIComponent(fallbackParts[0]);
    pushCandidate("feed-photos", filename);
    pushCandidate("avatars", filename);
    pushCandidate("family_photos", filename);
    if (userId) {
      pushCandidate("feed-photos", `${userId}/${filename}`);
      pushCandidate("avatars", `${userId}/${filename}`);
      pushCandidate("family_photos", `${userId}/${filename}`);
    }
  }

  return candidates;
}

async function tryDeleteStorageObjects(storageClient, files, userId) {
  for (const file of files) {
    const candidates = buildStorageCandidates(file, userId);
    for (const candidate of candidates) {
      const { data: probeData, error: probeError } = await storageClient.storage
        .from(candidate.bucket)
        .download(candidate.path);
      if (probeError || !probeData) continue;
      await storageClient.storage.from(candidate.bucket).remove([candidate.path]);
      break;
    }
  }
}

export async function deleteUserAction(formData) {
  const userId = String(formData.get("userId") ?? "");
  const confirmText = String(formData.get("confirmText") ?? "").trim();
  if (!userId) {
    redirect(`/dashboard/users?notice=${encodeNotice("Saknar användar-id.")}&tone=error`);
  }

  const supabase = await createClient();
  const adminUser = await requireAdminUser(supabase, {
    loginRedirect: "/login",
    notAdminRedirect: "/login",
  });

  const { data: targetUser } = await supabase
    .from("users")
    .select("id, name, email, auth_id, avatar")
    .eq("id", userId)
    .maybeSingle();

  if (!targetUser) {
    redirect(`/dashboard/users?notice=${encodeNotice("Användaren finns inte längre.")}&tone=error`);
  }

  const expectedDeleteToken = targetUser.name?.trim() || targetUser.email?.trim() || targetUser.id;
  if (confirmText !== expectedDeleteToken) {
    redirect(
      `/dashboard/users/${userId}?notice=${encodeNotice(
        "Fel bekräftelsetext. Skriv exakt det namn som visas för att radera användaren."
      )}&tone=error`
    );
  }

  if (targetUser.auth_id && targetUser.auth_id === adminUser.id) {
    redirect(`/dashboard/users?notice=${encodeNotice("Du kan inte radera ditt eget konto.")}&tone=error`);
  }

  const [{ data: ownedFeeds }, { data: lovedOnesPhoto }] = await Promise.all([
    supabase.from("feeds").select("id, file").eq("userid", userId),
    supabase.from("loved_ones_photos").select("image_path").eq("user_id", userId).maybeSingle(),
  ]);

  const ownedFeedIds = (ownedFeeds ?? []).map((feed) => feed.id).filter(Boolean);
  const ownedFeedFiles = (ownedFeeds ?? []).map((feed) => feed.file).filter(Boolean);

  if (ownedFeedIds.length > 0) {
    const { data: feedComments } = await supabase
      .from("comments")
      .select("id")
      .in("feedId", ownedFeedIds);
    const feedCommentIds = (feedComments ?? []).map((comment) => comment.id).filter(Boolean);

    if (feedCommentIds.length > 0) {
      const { error: feedCommentLikesError } = await supabase
        .from("commentLikes")
        .delete()
        .in("commentId", feedCommentIds);
      if (feedCommentLikesError) {
        redirect(
          `/dashboard/users/${userId}?notice=${encodeNotice(
            "Kunde inte radera kommentarreaktioner på användarens inlägg."
          )}&tone=error`
        );
      }
    }

    const { error: feedCommentsError } = await supabase
      .from("comments")
      .delete()
      .in("feedId", ownedFeedIds);
    if (feedCommentsError) {
      redirect(
        `/dashboard/users/${userId}?notice=${encodeNotice(
          "Kunde inte radera kommentarer på användarens inlägg."
        )}&tone=error`
      );
    }

    const { error: feedLikesError } = await supabase.from("feedLikes").delete().in("feedId", ownedFeedIds);
    if (feedLikesError) {
      redirect(
        `/dashboard/users/${userId}?notice=${encodeNotice(
          "Kunde inte radera likes på användarens inlägg."
        )}&tone=error`
      );
    }

    const { error: feedReportsError } = await supabase
      .from("post_reports")
      .delete()
      .in("feed_id", ownedFeedIds);
    if (feedReportsError) {
      redirect(
        `/dashboard/users/${userId}?notice=${encodeNotice(
          "Kunde inte radera rapporter på användarens inlägg."
        )}&tone=error`
      );
    }
  }

  const { data: remainingUserComments } = await supabase
    .from("comments")
    .select("id")
    .eq("userId", userId);
  const remainingUserCommentIds = (remainingUserComments ?? [])
    .map((comment) => comment.id)
    .filter(Boolean);
  if (remainingUserCommentIds.length > 0) {
    const { error: userCommentLikesError } = await supabase
      .from("commentLikes")
      .delete()
      .in("commentId", remainingUserCommentIds);
    if (userCommentLikesError) {
      redirect(
        `/dashboard/users/${userId}?notice=${encodeNotice(
          "Kunde inte radera reaktioner på användarens kommentarer."
        )}&tone=error`
      );
    }
  }

  const deletionQueries = [
    supabase.from("commentLikes").delete().eq("userId", userId),
    supabase.from("feedLikes").delete().eq("userId", userId),
    supabase.from("comments").delete().eq("userId", userId),
    supabase.from("post_reports").delete().eq("reporter_id", userId),
    supabase.from("post_reports").delete().eq("post_owner_id", userId),
    supabase.from("friendships").delete().eq("sender_id", userId),
    supabase.from("friendships").delete().eq("receiver_id", userId),
    supabase.from("sponsorships").delete().eq("sponsor_id", userId),
    supabase.from("sponsorships").delete().eq("gambler_id", userId),
    supabase.from("notifications").delete().eq("user_id", userId),
    supabase.from("user_feelings").delete().eq("user_id", userId),
    supabase.from("user_onboarding").delete().eq("user_id", userId),
    supabase.from("user_push_tokens").delete().eq("user_id", userId),
    supabase.from("loved_ones_photos").delete().eq("user_id", userId),
    supabase.from("feeds").delete().eq("userid", userId),
  ];

  for (const query of deletionQueries) {
    const { error } = await query;
    if (error) {
      redirect(
        `/dashboard/users/${userId}?notice=${encodeNotice(
          "Kunde inte radera all användardata. Ingen slutradering gjordes."
        )}&tone=error`
      );
    }
  }

  const { error: userDeleteError } = await supabase.from("users").delete().eq("id", userId);
  if (userDeleteError) {
    redirect(`/dashboard/users/${userId}?notice=${encodeNotice("Kunde inte radera användaren.")}&tone=error`);
  }

  const storageClient = createStorageAdminClient() ?? supabase;
  const candidateFiles = [targetUser.avatar, lovedOnesPhoto?.image_path, ...ownedFeedFiles].filter(Boolean);
  await tryDeleteStorageObjects(storageClient, candidateFiles, userId);

  if (targetUser.auth_id) {
    const adminClient = createStorageAdminClient();
    if (adminClient) {
      await adminClient.from("admin_users").delete().eq("user_id", targetUser.auth_id);
      await adminClient.auth.admin.deleteUser(targetUser.auth_id);
    }
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
  redirect(
    `/dashboard/users?notice=${encodeNotice(
      `Användaren ${targetUser.name || targetUser.email || userId} har raderats.`
    )}&tone=success`
  );
}

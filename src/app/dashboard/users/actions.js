"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/authService";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function encodeNotice(message) {
  return encodeURIComponent(message);
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value);
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
  const adminSupabase = createAdminClient();
  const adminUser = await requireAdminUser(supabase, {
    loginRedirect: "/login",
    notAdminRedirect: "/login",
    adminSupabase,
  });

  const { data: targetUser } = await adminSupabase
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

  const [{ data: ownedPosts }, { data: lovedOnesPhoto }] = await Promise.all([
    adminSupabase.from("posts").select("id, file").eq("user_id", userId),
    adminSupabase.from("loved_ones_photos").select("image_path").eq("user_id", userId).maybeSingle(),
  ]);

  const ownedPostIds = (ownedPosts ?? []).map((post) => post.id).filter(Boolean);
  const ownedPostFiles = (ownedPosts ?? []).map((post) => post.file).filter(Boolean);

  if (ownedPostIds.length > 0) {
    const { data: postComments } = await adminSupabase
      .from("comments")
      .select("id")
      .in("post_id", ownedPostIds);
    const postCommentIds = (postComments ?? []).map((comment) => comment.id).filter(Boolean);

    if (postCommentIds.length > 0) {
      const { error: postCommentLikesError } = await adminSupabase
        .from("comment_likes")
        .delete()
        .in("comment_id", postCommentIds);
      if (postCommentLikesError) {
        redirect(
          `/dashboard/users/${userId}?notice=${encodeNotice(
            "Kunde inte radera kommentarreaktioner på användarens inlägg."
          )}&tone=error`
        );
      }
    }

    const { error: postCommentsError } = await adminSupabase
      .from("comments")
      .delete()
      .in("post_id", ownedPostIds);
    if (postCommentsError) {
      redirect(
        `/dashboard/users/${userId}?notice=${encodeNotice(
          "Kunde inte radera kommentarer på användarens inlägg."
        )}&tone=error`
      );
    }

    const { error: reactionsError } = await adminSupabase.from("reactions").delete().in("post_id", ownedPostIds);
    if (reactionsError) {
      redirect(
        `/dashboard/users/${userId}?notice=${encodeNotice(
          "Kunde inte radera likes på användarens inlägg."
        )}&tone=error`
      );
    }

    const { error: postReportsError } = await adminSupabase
      .from("post_reports")
      .delete()
      .in("post_id", ownedPostIds);
    if (postReportsError) {
      redirect(
        `/dashboard/users/${userId}?notice=${encodeNotice(
          "Kunde inte radera rapporter på användarens inlägg."
        )}&tone=error`
      );
    }
  }

  const { data: remainingUserComments } = await adminSupabase
    .from("comments")
    .select("id")
    .eq("user_id", userId);
  const remainingUserCommentIds = (remainingUserComments ?? [])
    .map((comment) => comment.id)
    .filter(Boolean);
  if (remainingUserCommentIds.length > 0) {
    const { error: userCommentLikesError } = await adminSupabase
      .from("comment_likes")
      .delete()
      .in("comment_id", remainingUserCommentIds);
    if (userCommentLikesError) {
      redirect(
        `/dashboard/users/${userId}?notice=${encodeNotice(
          "Kunde inte radera reaktioner på användarens kommentarer."
        )}&tone=error`
      );
    }
  }

  const deletionQueries = [
    adminSupabase.from("comment_likes").delete().eq("user_id", userId),
    adminSupabase.from("reactions").delete().eq("user_id", userId),
    adminSupabase.from("comments").delete().eq("user_id", userId),
    adminSupabase.from("post_reports").delete().eq("reporter_id", userId),
    adminSupabase.from("post_reports").delete().eq("post_owner_id", userId),
    adminSupabase.from("friendships").delete().eq("sender_id", userId),
    adminSupabase.from("friendships").delete().eq("receiver_id", userId),
    adminSupabase.from("sponsorships").delete().eq("sponsor_id", userId),
    adminSupabase.from("sponsorships").delete().eq("gambler_id", userId),
    adminSupabase.from("notifications").delete().eq("user_id", userId),
    adminSupabase.from("user_feelings").delete().eq("user_id", userId),
    adminSupabase.from("user_onboarding").delete().eq("user_id", userId),
    adminSupabase.from("user_push_tokens").delete().eq("user_id", userId),
    adminSupabase.from("loved_ones_photos").delete().eq("user_id", userId),
    adminSupabase.from("posts").delete().eq("user_id", userId),
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

  const { error: userDeleteError } = await adminSupabase.from("users").delete().eq("id", userId);
  if (userDeleteError) {
    redirect(`/dashboard/users/${userId}?notice=${encodeNotice("Kunde inte radera användaren.")}&tone=error`);
  }

  const candidateFiles = [targetUser.avatar, lovedOnesPhoto?.image_path, ...ownedPostFiles].filter(Boolean);
  await tryDeleteStorageObjects(adminSupabase, candidateFiles, userId);

  if (targetUser.auth_id) {
    await adminSupabase.from("admin_users").delete().eq("user_id", targetUser.auth_id);
    await adminSupabase.auth.admin.deleteUser(targetUser.auth_id);
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
  redirect(
    `/dashboard/users?notice=${encodeNotice(
      `Användaren ${targetUser.name || targetUser.email || userId} har raderats.`
    )}&tone=success`
  );
}

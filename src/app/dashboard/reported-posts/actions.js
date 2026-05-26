"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/authService";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function encodeNotice(message) {
  return encodeURIComponent(message);
}

function buildDetailHref(reportId, notice, tone = "success") {
  const base = `/dashboard/reported-posts/${reportId}`;
  if (!notice) return base;
  return `${base}?notice=${encodeNotice(notice)}&tone=${encodeURIComponent(tone)}`;
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

  const fromStoragePathname = (pathname, rawUrl) => {
    const cleaned = pathname.replace(/^\/+/, "");
    const parts = cleaned.split("/");
    const objectIndex = parts.indexOf("object");
    if (objectIndex === -1) return;

    const bucket = parts[objectIndex + 2];
    const pathParts = parts.slice(objectIndex + 3);
    if (!bucket || pathParts.length === 0) return;
    pushCandidate(decodeURIComponent(bucket), decodeURIComponent(pathParts.join("/")));

    if (rawUrl) {
      try {
        const filename = decodeURIComponent(pathParts[pathParts.length - 1] ?? "");
        if (filename) {
          pushCandidate("feed-photos", filename);
          if (userId) pushCandidate("feed-photos", `${userId}/${filename}`);
        }
      } catch {
        // Keep graceful fallback behavior if URL decoding fails.
      }
    }
  };

  if (isAbsoluteUrl(raw)) {
    try {
      const url = new URL(raw);
      fromStoragePathname(url.pathname, raw);
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
  } else if (fallbackParts.length === 1 && fallbackParts[0]) {
    const filename = decodeURIComponent(fallbackParts[0]);
    pushCandidate("feed-photos", filename);
    if (userId) pushCandidate("feed-photos", `${userId}/${filename}`);
  }

  return candidates;
}

export async function deleteReportedFeedAction(formData) {
  const reportId = String(formData.get("reportId") ?? "");
  const postId = String(formData.get("postId") ?? "");

  if (!reportId || !postId) {
    redirect("/dashboard/reported-posts?notice=" + encodeNotice("Saknar postdata för att radera."));
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  await requireAdminUser(supabase, {
    loginRedirect: "/login",
    notAdminRedirect: "/dashboard",
    adminSupabase,
  });

  const { data: post } = await adminSupabase
    .from("posts")
    .select("file, user_id")
    .eq("id", postId)
    .maybeSingle();
  const storageCandidates = buildStorageCandidates(post?.file, post?.user_id);

  const { data: comments } = await adminSupabase
    .from("comments")
    .select("id")
    .eq("post_id", postId);

  const commentIds = (comments ?? []).map((comment) => comment.id).filter(Boolean);
  if (commentIds.length > 0) {
    const { error: commentLikesError } = await adminSupabase
      .from("comment_likes")
      .delete()
      .in("comment_id", commentIds);
    if (commentLikesError) {
      redirect(buildDetailHref(reportId, "Kunde inte radera comment likes.", "error"));
    }
  }

  const { error: commentsError } = await adminSupabase.from("comments").delete().eq("post_id", postId);
  if (commentsError) {
    redirect(buildDetailHref(reportId, "Kunde inte radera kommentarer.", "error"));
  }

  const { error: reactionsError } = await adminSupabase.from("reactions").delete().eq("post_id", postId);
  if (reactionsError) {
    redirect(buildDetailHref(reportId, "Kunde inte radera likes.", "error"));
  }

  const { error: reportsError } = await adminSupabase.from("post_reports").delete().eq("post_id", postId);
  if (reportsError) {
    redirect(buildDetailHref(reportId, "Kunde inte radera rapporter.", "error"));
  }

  const { error: postError } = await adminSupabase.from("posts").delete().eq("id", postId);
  if (postError) {
    redirect(buildDetailHref(reportId, "Kunde inte radera inlägget.", "error"));
  }

  if (storageCandidates.length > 0) {
    let deletedAnyImage = false;

    for (const candidate of storageCandidates) {
      const { data: probeData, error: probeError } = await adminSupabase.storage
        .from(candidate.bucket)
        .download(candidate.path);
      if (probeError || !probeData) continue;

      const { error: storageDeleteError } = await adminSupabase.storage
        .from(candidate.bucket)
        .remove([candidate.path]);
      if (!storageDeleteError) {
        deletedAnyImage = true;
        break;
      }
    }

    if (!deletedAnyImage) {
      revalidatePath("/dashboard/reported-posts");
      redirect(
        `/dashboard/reported-posts?notice=${encodeNotice(
          "Inlägget raderades men vi kunde inte hitta/radera bildfilen i storage automatiskt."
        )}&tone=error`
      );
    }
  }

  revalidatePath("/dashboard/reported-posts");
  redirect(
    `/dashboard/reported-posts?notice=${encodeNotice(
      "Inlägget, kommentarer, likes och bildfil har raderats."
    )}&tone=success`
  );
}

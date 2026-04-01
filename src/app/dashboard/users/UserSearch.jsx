"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHT } from "@/constants";
import styles from "./UserSearch.module.css";

export default function UserSearch({ defaultValue = "" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const debounceRef = useRef(null);

  const push = useCallback(
    (val) => {
      const params = new URLSearchParams(searchParams.toString());
      const nextValue = val.trim();

      // New search terms should always start from the first page.
      params.delete("page");

      if (nextValue) {
        params.set("q", nextValue);
      } else {
        params.delete("q");
      }

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push(value), 300);
    return () => clearTimeout(debounceRef.current);
  }, [value, push]);

  return (
    <div className={styles.wrapper}>
      <MagnifyingGlass
        size={18}
        color={COLORS.textPrimary}
        style={{ opacity: 0.4, flexShrink: 0 }}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Sök på namn eller e-post…"
        className={styles.input}
        style={{
          fontFamily: FONT_FAMILY.primary,
          fontSize: FONT_SIZES.body,
          fontWeight: FONT_WEIGHT.primary.regular,
          color: COLORS.textPrimary,
        }}
      />
    </div>
  );
}

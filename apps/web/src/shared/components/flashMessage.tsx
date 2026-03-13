"use client";

import { Trans } from "@lingui/react/macro";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const MESSAGES: Record<string, React.ReactNode> = {
  email_confirmed: <Trans>Adresse email mise à jour avec succès.</Trans>,
};

export function FlashMessage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<React.ReactNode>(null);

  useEffect(() => {
    for (const [key, node] of Object.entries(MESSAGES)) {
      if (searchParams.get(key)) {
        setMessage(node);
        const url = new URL(window.location.href);
        url.searchParams.delete(key);
        router.replace(url.pathname + (url.search || ""), { scroll: false });
        break;
      }
    }
  }, [searchParams]);

  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-green-600 px-5 py-3 text-sm font-medium text-white shadow-lg">
      {message}
    </div>
  );
}

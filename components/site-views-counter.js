"use client";

import { useEffect, useState } from "react";

function formatCount(value) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function SiteViewsCounter() {
  const [count, setCount] = useState(null);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCounter() {
      try {
        const response = await fetch("/api/visits", {
          method: "GET",
          cache: "no-store"
        });
        const data = await response.json();

        if (!active) return;

        setIsEnabled(Boolean(data?.enabled));
        setCount(typeof data?.count === "number" ? data.count : null);
      } catch {
        if (!active) return;
        setIsEnabled(false);
      }
    }

    loadCounter();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="site-views-panel" aria-label="Website views">
      <span className="site-views-label">Website views</span>
      <strong className="site-views-count">
        {isEnabled && typeof count === "number" ? formatCount(count) : "Counter belum aktif"}
      </strong>
      {!isEnabled ? <p className="site-views-note">Aktifkan storage Redis agar jumlah kunjungan dapat dicatat.</p> : null}
    </div>
  );
}

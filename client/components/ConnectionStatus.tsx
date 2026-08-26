"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { fetchConnectionSummary } from "@/lib/api";

export function ConnectionStatus() {
  const { token } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setCount(0);
      return;
    }
    fetchConnectionSummary(token)
      .then((result) => setCount(Number(result?.count) || 0))
      .catch(() => setCount(0));
  }, [token]);

  return (
    <Badge variant="secondary" className="text-xs">
      {count} {count === 1 ? "connection" : "connections"}
    </Badge>
  );
}

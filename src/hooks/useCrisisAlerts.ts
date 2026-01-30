import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

export type CrisisAlert = {
  id: string;
  session_id: string;
  message_id: string | null;
  user_id: string | null;
  pseudo_user_id: string;
  risk_level: "high" | "medium";
  primary_feeling: string | null;
  message_preview: string;
  status: "pending" | "acknowledged" | "resolved";
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

export function useCrisisAlerts() {
  const [alerts, setAlerts] = useState<CrisisAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("crisis_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setAlerts((data as CrisisAlert[]) || []);
      setError(null);
    } catch (e) {
      console.error("Error fetching crisis alerts:", e);
      setError("Failed to load alerts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchAlerts();

    // Set up realtime subscription
    const channel = supabase
      .channel("crisis_alerts_realtime")
      .on<CrisisAlert>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crisis_alerts",
        },
        (payload: RealtimePostgresInsertPayload<CrisisAlert>) => {
          console.log("New crisis alert received:", payload);
          const newAlert = payload.new;
          
          setAlerts((prev) => [newAlert, ...prev]);
          
          // Show toast notification for new high-risk alerts
          if (newAlert.risk_level === "high") {
            toast.error(
              `🚨 HIGH RISK ALERT: ${newAlert.pseudo_user_id} - "${newAlert.message_preview.slice(0, 50)}..."`,
              { duration: 10000 }
            );
          } else {
            toast.warning(
              `⚠️ Medium risk: ${newAlert.pseudo_user_id}`,
              { duration: 5000 }
            );
          }
        }
      )
      .on<CrisisAlert>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "crisis_alerts",
        },
        (payload) => {
          console.log("Crisis alert updated:", payload);
          setAlerts((prev) =>
            prev.map((alert) =>
              alert.id === payload.new.id ? (payload.new as CrisisAlert) : alert
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  // Acknowledge an alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from("crisis_alerts")
        .update({
          status: "acknowledged",
          acknowledged_by: userData.user?.id || null,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (updateError) throw updateError;

      toast.success("Alert acknowledged");
    } catch (e) {
      console.error("Error acknowledging alert:", e);
      toast.error("Failed to acknowledge alert");
    }
  }, []);

  // Resolve an alert
  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from("crisis_alerts")
        .update({
          status: "resolved",
          resolved_by: userData.user?.id || null,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (updateError) throw updateError;

      toast.success("Alert resolved");
    } catch (e) {
      console.error("Error resolving alert:", e);
      toast.error("Failed to resolve alert");
    }
  }, []);

  // Get stats
  const stats = {
    pending: alerts.filter((a) => a.status === "pending").length,
    highRisk: alerts.filter((a) => a.risk_level === "high" && a.status === "pending").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolvedToday: alerts.filter(
      (a) =>
        a.status === "resolved" &&
        new Date(a.resolved_at || "").toDateString() === new Date().toDateString()
    ).length,
  };

  return {
    alerts,
    isLoading,
    error,
    stats,
    acknowledgeAlert,
    resolveAlert,
    refetch: fetchAlerts,
  };
}

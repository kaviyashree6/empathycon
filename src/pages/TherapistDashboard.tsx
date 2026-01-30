import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Heart, 
  Users, 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Eye,
  BarChart3,
  TrendingUp,
  Activity,
  LogOut,
  Bell,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrisisAlerts, CrisisAlert } from "@/hooks/useCrisisAlerts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TherapistDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { alerts, isLoading, stats, acknowledgeAlert, resolveAlert, refetch } = useCrisisAlerts();
  const [selectedAlert, setSelectedAlert] = useState<CrisisAlert | null>(null);
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium">("all");
  const [isTherapist, setIsTherapist] = useState<boolean | null>(null);

  // Check if user has therapist role
  useEffect(() => {
    const checkTherapistRole = async () => {
      if (!user) {
        setIsTherapist(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["therapist", "admin"]);

        if (error) throw error;

        setIsTherapist(data && data.length > 0);
      } catch (e) {
        console.error("Error checking therapist role:", e);
        setIsTherapist(false);
      }
    };

    checkTherapistRole();
  }, [user]);

  const filteredAlerts = alerts.filter(
    (a) => riskFilter === "all" || a.risk_level === riskFilter
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Show access denied for non-therapists
  if (isTherapist === false) {
    return (
      <div className="min-h-screen gradient-calm flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">
              This dashboard is only available to verified therapists.
            </p>
            <Button asChild>
              <Link to="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isTherapist === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const dashboardStats = [
    { label: "Pending Alerts", value: stats.pending.toString(), change: stats.highRisk > 0 ? `${stats.highRisk} high risk` : "All stable", icon: AlertTriangle },
    { label: "High Risk", value: stats.highRisk.toString(), change: stats.highRisk > 0 ? "Needs attention" : "None", icon: Bell },
    { label: "Acknowledged", value: stats.acknowledged.toString(), change: "In progress", icon: Clock },
    { label: "Resolved Today", value: stats.resolvedToday.toString(), change: "Great work!", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">EmpathyConnect</span>
            <Badge variant="secondary" className="ml-2">Therapist Portal</Badge>
          </Link>

          <div className="flex items-center gap-4">
            {stats.highRisk > 0 && (
              <Badge variant="high" className="animate-pulse">
                <Bell className="w-3 h-3 mr-1" />
                {stats.highRisk} High Risk
              </Badge>
            )}
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {dashboardStats.map((stat) => (
            <Card key={stat.label} variant="default">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-display font-bold mt-1">{stat.value}</p>
                    <p className={`text-xs mt-1 ${
                      stat.label === "High Risk" && stats.highRisk > 0 
                        ? "text-destructive" 
                        : "text-muted-foreground"
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    stat.label === "High Risk" && stats.highRisk > 0 
                      ? "bg-destructive/10" 
                      : "bg-primary/10"
                  }`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.label === "High Risk" && stats.highRisk > 0 
                        ? "text-destructive" 
                        : "text-primary"
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="bg-card shadow-soft border border-border">
            <TabsTrigger value="queue" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Crisis Alerts
              {stats.pending > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Alerts Table */}
              <Card variant="default" className="flex-1">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Real-time Crisis Alerts
                        <Button variant="ghost" size="sm" onClick={refetch}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                      <CardDescription>Live alerts requiring immediate attention</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {(["all", "high", "medium"] as const).map((level) => (
                        <Button
                          key={level}
                          variant={riskFilter === level ? "default" : "outline"}
                          size="sm"
                          onClick={() => setRiskFilter(level)}
                        >
                          {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : filteredAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success opacity-50" />
                      <p>No crisis alerts at this time</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>User</TableHead>
                            <TableHead>Risk</TableHead>
                            <TableHead>Feeling</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAlerts.map((alert) => (
                            <TableRow 
                              key={alert.id}
                              className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                                selectedAlert?.id === alert.id ? "bg-primary/5" : ""
                              } ${alert.risk_level === "high" && alert.status === "pending" ? "bg-destructive/5" : ""}`}
                              onClick={() => setSelectedAlert(alert)}
                            >
                              <TableCell className="font-mono text-sm">{alert.pseudo_user_id}</TableCell>
                              <TableCell>
                                <Badge variant={alert.risk_level}>{alert.risk_level.toUpperCase()}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{alert.primary_feeling || "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{formatTime(alert.created_at)}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    alert.status === "resolved" ? "success" : 
                                    alert.status === "acknowledged" ? "warning" : "outline"
                                  }
                                >
                                  {alert.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alert Detail Panel */}
              <Card variant="default" className="lg:w-96">
                <CardHeader>
                  <CardTitle className="text-lg">Alert Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedAlert ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">User ID</span>
                        <span className="font-mono">{selectedAlert.pseudo_user_id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Risk Level</span>
                        <Badge variant={selectedAlert.risk_level}>{selectedAlert.risk_level.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Primary Feeling</span>
                        <span className="capitalize">{selectedAlert.primary_feeling || "Unknown"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={selectedAlert.status === "resolved" ? "success" : "outline"}>
                          {selectedAlert.status}
                        </Badge>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-2">Message Preview</p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg italic">
                          "{selectedAlert.message_preview}"
                        </p>
                      </div>

                      <div className="pt-4 space-y-2">
                        {selectedAlert.status === "pending" && (
                          <Button 
                            variant="default" 
                            className="w-full"
                            onClick={() => acknowledgeAlert(selectedAlert.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Acknowledge
                          </Button>
                        )}
                        <Button variant="hero" className="w-full">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Start Secure Chat
                        </Button>
                        {selectedAlert.status !== "resolved" && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => {
                              resolveAlert(selectedAlert.id);
                              setSelectedAlert(null);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Mark as Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select an alert to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Weekly Alert Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-40 flex items-end justify-between gap-2">
                    {[45, 62, 78, 55, 89, 95, 72].map((value, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full rounded-t bg-primary hover:bg-primary/80 transition-colors"
                          style={{ height: `${value}%` }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {["M", "T", "W", "T", "F", "S", "S"][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-success" />
                    Risk Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Risk</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="w-3/4 h-full bg-destructive" />
                        </div>
                        <span className="text-sm font-medium">{alerts.filter(a => a.risk_level === "high").length}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Medium Risk</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="w-1/2 h-full bg-warning" />
                        </div>
                        <span className="text-sm font-medium">{alerts.filter(a => a.risk_level === "medium").length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-secondary-foreground" />
                    Response Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-4xl font-display font-bold text-primary">
                        {stats.resolvedToday}<span className="text-lg ml-1">today</span>
                      </p>
                      <p className="text-sm text-muted-foreground">Cases Resolved</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{stats.pending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{stats.acknowledged}</p>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TherapistDashboard;

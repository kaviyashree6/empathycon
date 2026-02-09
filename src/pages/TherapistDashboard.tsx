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
  RefreshCw,
  Shield,
  ChevronRight,
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
import { Progress } from "@/components/ui/progress";
import { useCrisisAlerts, CrisisAlert } from "@/hooks/useCrisisAlerts";
import { toast } from "sonner";

const TherapistDashboard = () => {
  const navigate = useNavigate();
  const { alerts, isLoading, stats, acknowledgeAlert, resolveAlert, refetch } = useCrisisAlerts();
  const [selectedAlert, setSelectedAlert] = useState<CrisisAlert | null>(null);
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium">("all");
  const [therapistEmail, setTherapistEmail] = useState<string | null>(null);

  useEffect(() => {
    const session = localStorage.getItem("therapist_session");
    if (!session) {
      navigate("/therapist");
      return;
    }
    try {
      const parsed = JSON.parse(session);
      setTherapistEmail(parsed.email);
    } catch {
      localStorage.removeItem("therapist_session");
      navigate("/therapist");
    }
  }, [navigate]);

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

  const handleLogout = () => {
    localStorage.removeItem("therapist_session");
    toast.success("Logged out successfully");
    navigate("/therapist");
  };

  if (!therapistEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalAlerts = alerts.length || 1;
  const highPct = Math.round((alerts.filter((a) => a.risk_level === "high").length / totalAlerts) * 100);
  const medPct = Math.round((alerts.filter((a) => a.risk_level === "medium").length / totalAlerts) * 100);

  const statCards = [
    {
      label: "Pending",
      value: stats.pending,
      sub: stats.highRisk > 0 ? `${stats.highRisk} high risk` : "All stable",
      icon: AlertTriangle,
      color: stats.pending > 0 ? "text-warning" : "text-muted-foreground",
      bg: stats.pending > 0 ? "bg-warning/10" : "bg-muted",
    },
    {
      label: "High Risk",
      value: stats.highRisk,
      sub: stats.highRisk > 0 ? "Needs attention" : "None",
      icon: Bell,
      color: stats.highRisk > 0 ? "text-destructive" : "text-muted-foreground",
      bg: stats.highRisk > 0 ? "bg-destructive/10" : "bg-muted",
    },
    {
      label: "In Progress",
      value: stats.acknowledged,
      sub: "Acknowledged",
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Resolved Today",
      value: stats.resolvedToday,
      sub: "Great work!",
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground hidden sm:inline">EmpathyConnect</span>
            </Link>
            <Badge variant="secondary" className="text-xs gap-1">
              <Shield className="w-3 h-3" />
              Therapist
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {stats.highRisk > 0 && (
              <Badge variant="high" className="animate-pulse gap-1">
                <Bell className="w-3 h-3" />
                {stats.highRisk} High Risk
              </Badge>
            )}
            <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-[160px]">
              {therapistEmail}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2 self-start">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  {s.label === "High Risk" && stats.highRisk > 0 && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                    </span>
                  )}
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className={`text-[11px] mt-1 ${s.value > 0 && s.label === "High Risk" ? "text-destructive" : "text-muted-foreground"}`}>
                  {s.sub}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main content */}
        <Tabs defaultValue="queue" className="space-y-5">
          <TabsList className="bg-card border border-border shadow-soft">
            <TabsTrigger value="queue" className="gap-2 data-[state=active]:shadow-sm">
              <AlertTriangle className="w-4 h-4" />
              Crisis Queue
              {stats.pending > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:shadow-sm">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Crisis Queue Tab */}
          <TabsContent value="queue" className="space-y-5">
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Table */}
              <Card className="flex-1 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Real-time Alerts</CardTitle>
                      <CardDescription className="text-xs">Click a row to view details</CardDescription>
                    </div>
                    <div className="flex gap-1.5">
                      {(["all", "high", "medium"] as const).map((level) => (
                        <Button
                          key={level}
                          variant={riskFilter === level ? "default" : "ghost"}
                          size="sm"
                          className="h-8 text-xs px-3"
                          onClick={() => setRiskFilter(level)}
                        >
                          {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : filteredAlerts.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="w-16 h-16 rounded-2xl bg-success/10 mx-auto mb-4 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-success" />
                      </div>
                      <p className="font-medium text-foreground">All clear</p>
                      <p className="text-sm text-muted-foreground mt-1">No crisis alerts at this time</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="text-xs font-semibold">User</TableHead>
                            <TableHead className="text-xs font-semibold">Risk</TableHead>
                            <TableHead className="text-xs font-semibold hidden sm:table-cell">Feeling</TableHead>
                            <TableHead className="text-xs font-semibold">Time</TableHead>
                            <TableHead className="text-xs font-semibold">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-right w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAlerts.map((alert) => (
                            <TableRow
                              key={alert.id}
                              className={`cursor-pointer transition-colors ${
                                selectedAlert?.id === alert.id
                                  ? "bg-primary/5 border-l-2 border-l-primary"
                                  : alert.risk_level === "high" && alert.status === "pending"
                                  ? "bg-destructive/[0.03]"
                                  : ""
                              }`}
                              onClick={() => setSelectedAlert(alert)}
                            >
                              <TableCell className="font-mono text-xs py-3">{alert.pseudo_user_id}</TableCell>
                              <TableCell className="py-3">
                                <Badge variant={alert.risk_level} className="text-[10px] px-2">
                                  {alert.risk_level.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm hidden sm:table-cell py-3">
                                {alert.primary_feeling || "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs py-3">{formatTime(alert.created_at)}</TableCell>
                              <TableCell className="py-3">
                                <Badge
                                  variant={
                                    alert.status === "resolved"
                                      ? "success"
                                      : alert.status === "acknowledged"
                                      ? "warning"
                                      : "outline"
                                  }
                                  className="text-[10px] px-2"
                                >
                                  {alert.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right py-3">
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detail Panel */}
              <Card className="lg:w-[360px] lg:sticky lg:top-24 lg:self-start">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    Case Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedAlert ? (
                    <div className="space-y-5 animate-fade-in">
                      {/* Risk badge hero */}
                      <div className={`rounded-xl p-4 text-center ${
                        selectedAlert.risk_level === "high"
                          ? "bg-destructive/10"
                          : "bg-warning/10"
                      }`}>
                        <Badge variant={selectedAlert.risk_level} className="text-sm px-4 py-1 mb-2">
                          {selectedAlert.risk_level.toUpperCase()} RISK
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(selectedAlert.created_at)}
                        </p>
                      </div>

                      {/* Info rows */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">User ID</span>
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                            {selectedAlert.pseudo_user_id}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Feeling</span>
                          <span className="capitalize">{selectedAlert.primary_feeling || "Unknown"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <Badge
                            variant={selectedAlert.status === "resolved" ? "success" : "outline"}
                            className="text-[10px]"
                          >
                            {selectedAlert.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Message preview */}
                      <div className="border-t border-border pt-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                          Message Preview
                        </p>
                        <div className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed italic text-foreground/80">
                          "{selectedAlert.message_preview}"
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2 pt-2">
                        {selectedAlert.status === "pending" && (
                          <Button
                            variant="default"
                            className="w-full gap-2"
                            onClick={() => acknowledgeAlert(selectedAlert.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Acknowledge
                          </Button>
                        )}
                        <Button variant="hero" className="w-full gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Start Secure Chat
                        </Button>
                        {selectedAlert.status !== "resolved" && (
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => {
                              resolveAlert(selectedAlert.id);
                              setSelectedAlert(null);
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                            Mark as Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Select an alert to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Weekly trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Weekly Alert Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-36 flex items-end justify-between gap-1.5 pt-4">
                    {[45, 62, 78, 55, 89, 95, 72].map((value, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div
                          className="w-full rounded-md bg-primary/80 hover:bg-primary transition-all duration-200"
                          style={{ height: `${value}%` }}
                        />
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {["M", "T", "W", "T", "F", "S", "S"][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-success" />
                    Risk Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">High Risk</span>
                      <span className="font-semibold text-destructive">
                        {alerts.filter((a) => a.risk_level === "high").length} ({highPct}%)
                      </span>
                    </div>
                    <Progress value={highPct} className="h-2 [&>div]:bg-destructive" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Medium Risk</span>
                      <span className="font-semibold text-warning">
                        {alerts.filter((a) => a.risk_level === "medium").length} ({medPct}%)
                      </span>
                    </div>
                    <Progress value={medPct} className="h-2 [&>div]:bg-warning" />
                  </div>
                </CardContent>
              </Card>

              {/* Response metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Response Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-center mb-4">
                    <p className="text-4xl font-display font-bold text-primary">
                      {stats.resolvedToday}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Resolved today</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                    <div className="text-center rounded-lg bg-muted/50 p-3">
                      <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Pending</p>
                    </div>
                    <div className="text-center rounded-lg bg-muted/50 p-3">
                      <p className="text-2xl font-bold text-foreground">{stats.acknowledged}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">In Progress</p>
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

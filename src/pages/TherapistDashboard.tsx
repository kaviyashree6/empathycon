import { useState } from "react";
import { Link } from "react-router-dom";
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
  LogOut
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

type EscalationCase = {
  id: string;
  pseudoUserId: string;
  riskLevel: "high" | "medium" | "low";
  time: Date;
  status: "pending" | "acknowledged" | "resolved";
  lastMessage: string;
};

const mockCases: EscalationCase[] = [
  {
    id: "ESC-001",
    pseudoUserId: "User_A7X2",
    riskLevel: "high",
    time: new Date(Date.now() - 1000 * 60 * 15),
    status: "pending",
    lastMessage: "I don't know if I can handle this anymore...",
  },
  {
    id: "ESC-002",
    pseudoUserId: "User_B3K9",
    riskLevel: "medium",
    time: new Date(Date.now() - 1000 * 60 * 45),
    status: "acknowledged",
    lastMessage: "Everything feels overwhelming at work.",
  },
  {
    id: "ESC-003",
    pseudoUserId: "User_C1M4",
    riskLevel: "low",
    time: new Date(Date.now() - 1000 * 60 * 120),
    status: "pending",
    lastMessage: "I've been feeling anxious about my exams.",
  },
  {
    id: "ESC-004",
    pseudoUserId: "User_D5P8",
    riskLevel: "high",
    time: new Date(Date.now() - 1000 * 60 * 5),
    status: "pending",
    lastMessage: "I feel so alone and hopeless.",
  },
];

const stats = [
  { label: "Active Sessions", value: "127", change: "+12%", icon: Users },
  { label: "Pending Escalations", value: "4", change: "-3", icon: AlertTriangle },
  { label: "Avg Response Time", value: "4.2m", change: "-18%", icon: Clock },
  { label: "Resolved Today", value: "23", change: "+8", icon: CheckCircle },
];

const TherapistDashboard = () => {
  const [cases, setCases] = useState<EscalationCase[]>(mockCases);
  const [selectedCase, setSelectedCase] = useState<EscalationCase | null>(null);
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const filteredCases = cases.filter(
    (c) => riskFilter === "all" || c.riskLevel === riskFilter
  );

  const handleAcknowledge = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, status: "acknowledged" as const } : c
      )
    );
  };

  const handleResolve = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, status: "resolved" as const } : c
      )
    );
    setSelectedCase(null);
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

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
            <span className="text-sm text-muted-foreground hidden sm:inline">Dr. Sarah Mitchell</span>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} variant="default">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-display font-bold mt-1">{stat.value}</p>
                    <p className={`text-xs mt-1 ${stat.change.startsWith("+") ? "text-success" : stat.change.startsWith("-") ? "text-primary" : "text-muted-foreground"}`}>
                      {stat.change} from yesterday
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
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
              Escalation Queue
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Cases Table */}
              <Card variant="default" className="flex-1">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Escalation Queue</CardTitle>
                      <CardDescription>Cases requiring therapist attention</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {(["all", "high", "medium", "low"] as const).map((level) => (
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
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Case ID</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Risk</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCases.map((caseItem) => (
                          <TableRow 
                            key={caseItem.id}
                            className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                              selectedCase?.id === caseItem.id ? "bg-primary/5" : ""
                            }`}
                            onClick={() => setSelectedCase(caseItem)}
                          >
                            <TableCell className="font-mono text-sm">{caseItem.id}</TableCell>
                            <TableCell>{caseItem.pseudoUserId}</TableCell>
                            <TableCell>
                              <Badge variant={caseItem.riskLevel}>{caseItem.riskLevel.toUpperCase()}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatTime(caseItem.time)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  caseItem.status === "resolved" ? "success" : 
                                  caseItem.status === "acknowledged" ? "warning" : "outline"
                                }
                              >
                                {caseItem.status}
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
                </CardContent>
              </Card>

              {/* Case Detail Panel */}
              <Card variant="default" className="lg:w-96">
                <CardHeader>
                  <CardTitle className="text-lg">Case Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCase ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Case ID</span>
                        <span className="font-mono">{selectedCase.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Risk Level</span>
                        <Badge variant={selectedCase.riskLevel}>{selectedCase.riskLevel.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={selectedCase.status === "resolved" ? "success" : "outline"}>
                          {selectedCase.status}
                        </Badge>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-2">Last Message</p>
                        <p className="text-sm bg-muted/50 p-3 rounded-lg italic">
                          "{selectedCase.lastMessage}"
                        </p>
                      </div>

                      <div className="pt-4 space-y-2">
                        {selectedCase.status === "pending" && (
                          <Button 
                            variant="default" 
                            className="w-full"
                            onClick={() => handleAcknowledge(selectedCase.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Acknowledge
                          </Button>
                        )}
                        <Button variant="hero" className="w-full">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Start Secure Chat
                        </Button>
                        {selectedCase.status !== "resolved" && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleResolve(selectedCase.id)}
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
                      <p className="text-sm">Select a case to view details</p>
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
                    Weekly Active Sessions
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
                    Escalations This Week
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
                        <span className="text-sm font-medium">12</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Medium Risk</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="w-1/2 h-full bg-warning" />
                        </div>
                        <span className="text-sm font-medium">28</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Low Risk</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="w-1/4 h-full bg-success" />
                        </div>
                        <span className="text-sm font-medium">45</span>
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
                      <p className="text-4xl font-display font-bold text-primary">4.2<span className="text-lg">min</span></p>
                      <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="text-center">
                        <p className="text-2xl font-bold">23</p>
                        <p className="text-xs text-muted-foreground">Resolved Today</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">98%</p>
                        <p className="text-xs text-muted-foreground">Satisfaction</p>
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

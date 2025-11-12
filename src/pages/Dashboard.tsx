import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (session) {
        setUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: leads, error } = await supabase
        .from("leads")
        .select("status, created_at");

      if (error) throw error;

      const total = leads?.length || 0;
      const newLeads = leads?.filter(l => l.status === "new").length || 0;
      const converted = leads?.filter(l => l.status === "converted").length || 0;
      const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : "0";

      return { total, newLeads, converted, conversionRate };
    },
    enabled: !!userId,
  });

  const statCards = [
    {
      title: "Total Leads",
      value: stats?.total || 0,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "New Leads",
      value: stats?.newLeads || 0,
      icon: Clock,
      color: "text-accent",
    },
    {
      title: "Converted",
      value: stats?.converted || 0,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      title: "Conversion Rate",
      value: `${stats?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: "text-secondary",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
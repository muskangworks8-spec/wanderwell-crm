import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User } from "lucide-react";
import { LeadNotes } from "@/components/leads/LeadNotes";
import { LeadActivities } from "@/components/leads/LeadActivities";
import { LeadReminders } from "@/components/leads/LeadReminders";
import { LeadCommunication } from "@/components/leads/LeadCommunication";
import { LeadStatusUpdate } from "@/components/leads/LeadStatusUpdate";
import { LeadReassign } from "@/components/leads/LeadReassign";
import { toast } from "sonner";

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      setUserRole(roleData?.role || null);
    };
    checkAuth();
  }, [navigate]);

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          profiles!leads_assigned_to_fkey(full_name, email),
          created_by_profile:profiles!leads_created_by_fkey(full_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/leads")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Lead not found</h2>
          <Button className="mt-4" onClick={() => navigate("/leads")}>
            Go back to leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/leads")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{lead.name}</h1>
              <p className="text-muted-foreground">Lead Details</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            {lead.source}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Lead Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{lead.email}</p>
                  </div>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{lead.phone}</p>
                    </div>
                  </div>
                )}
                {lead.destination && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Destination</p>
                      <p className="text-sm font-medium">{lead.destination}</p>
                    </div>
                  </div>
                )}
                {lead.check_in_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Check-in</p>
                      <p className="text-sm font-medium">
                        {new Date(lead.check_in_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {lead.assigned_to && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned To</p>
                      <p className="text-sm font-medium">
                        {(lead as any).profiles?.full_name || "Unassigned"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <LeadStatusUpdate leadId={lead.id} currentStatus={lead.status} />
            
            {userRole === "admin" && (
              <LeadReassign leadId={lead.id} currentAssignee={lead.assigned_to} />
            )}
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="notes" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="reminders">Reminders</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="mt-4">
                <LeadNotes leadId={lead.id} currentNotes={lead.notes} />
              </TabsContent>

              <TabsContent value="activities" className="mt-4">
                <LeadActivities leadId={lead.id} />
              </TabsContent>

              <TabsContent value="reminders" className="mt-4">
                <LeadReminders leadId={lead.id} />
              </TabsContent>

              <TabsContent value="communication" className="mt-4">
                <LeadCommunication leadId={lead.id} leadEmail={lead.email} leadPhone={lead.phone} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeadDetails;

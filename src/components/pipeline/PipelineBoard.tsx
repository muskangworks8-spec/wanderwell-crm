import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone } from "lucide-react";

const stages = [
  { id: "new", label: "New", color: "bg-accent" },
  { id: "contacted", label: "Contacted", color: "bg-primary" },
  { id: "qualified", label: "Qualified", color: "bg-secondary" },
  { id: "proposal", label: "Proposal", color: "bg-blue-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-purple-500" },
  { id: "converted", label: "Converted", color: "bg-success" },
  { id: "lost", label: "Lost", color: "bg-muted" },
];

export const PipelineBoard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["pipeline-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus as any })
      .eq("id", leadId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] });
      toast({
        title: "Success",
        description: "Lead status updated",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {stages.map((stage) => (
          <Skeleton key={stage.id} className="h-96" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {stages.map((stage) => {
          const stageLeads = leads?.filter((lead) => lead.status === stage.id) || [];
          return (
            <div key={stage.id} className="flex-shrink-0 w-72">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {stage.label}
                    </CardTitle>
                    <Badge variant="secondary">{stageLeads.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
                  {stageLeads.map((lead) => (
                    <Card
                      key={lead.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4 space-y-2">
                        <h4 className="font-semibold text-sm">{lead.name}</h4>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {lead.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </div>
                        {lead.destination && (
                          <Badge variant="outline" className="text-xs">
                            {lead.destination}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {stageLeads.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No leads in this stage
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};
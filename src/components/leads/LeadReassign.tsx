import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface LeadReassignProps {
  leadId: string;
  currentAssignee: string | null;
}

export function LeadReassign({ leadId, currentAssignee }: LeadReassignProps) {
  const queryClient = useQueryClient();

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles!user_roles_user_id_fkey(id, full_name)")
        .eq("role", "agent");

      if (error) throw error;
      return data.map(d => ({
        id: d.user_id,
        name: (d as any).profiles?.full_name || "Unknown",
      }));
    },
  });

  const handleReassign = async (newAssignee: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("leads")
        .update({ assigned_to: newAssignee })
        .eq("id", leadId);

      if (error) throw error;

      // Log activity
      const newAgent = agents.find(a => a.id === newAssignee);
      await supabase.from("activities").insert({
        lead_id: leadId,
        user_id: user?.id,
        type: "assignment",
        title: "Lead Reassigned",
        description: `Lead assigned to ${newAgent?.name}`,
      });

      // Create notification for new assignee
      await supabase.from("notifications").insert({
        user_id: newAssignee,
        lead_id: leadId,
        title: "New Lead Assigned",
        message: "A new lead has been assigned to you",
      });

      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead reassigned successfully");
    } catch (error) {
      console.error("Error reassigning lead:", error);
      toast.error("Failed to reassign lead");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reassign Lead</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={currentAssignee || ""} onValueChange={handleReassign}>
          <SelectTrigger>
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

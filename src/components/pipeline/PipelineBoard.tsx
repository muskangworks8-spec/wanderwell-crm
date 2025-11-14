import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye } from "lucide-react";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

const stages = [
  { id: "new", label: "New", color: "bg-blue-500" },
  { id: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { id: "follow_up", label: "Follow-up", color: "bg-purple-500" },
  { id: "interested", label: "Interested", color: "bg-orange-500" },
  { id: "converted", label: "Converted", color: "bg-green-500" },
  { id: "closed", label: "Closed", color: "bg-red-500" },
];

export function PipelineBoard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, profiles!leads_assigned_to_fkey(full_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus as any })
        .eq("id", leadId);

      if (error) throw error;

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("activities").insert({
        lead_id: leadId,
        user_id: user?.id,
        type: "status_change",
        title: "Status Changed",
        description: `Lead moved to ${stages.find(s => s.id === newStatus)?.label}`,
      });

      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead status updated");
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast.error("Failed to update lead status");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((stage) => (
          <Card key={stage.id}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((stage) => (
            <DroppableColumn key={stage.id} stage={stage} leads={leads} navigate={navigate} />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeLead && (
          <Card className="min-w-[280px] opacity-90 shadow-lg">
            <CardContent className="p-4">
              <h4 className="font-medium text-sm">{activeLead.name}</h4>
              <p className="text-xs text-muted-foreground">{activeLead.email}</p>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function DroppableColumn({ stage, leads, navigate }: { stage: typeof stages[0]; leads: Lead[]; navigate: any }) {
  const { setNodeRef } = useDroppable({ id: stage.id });
  const stageLeads = leads.filter((lead) => lead.status === stage.id);

  return (
    <Card ref={setNodeRef} className="min-w-[320px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${stage.color}`} />
            {stage.label}
          </CardTitle>
          <Badge variant="secondary">{stageLeads.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 min-h-[200px]">
        {stageLeads.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
            Drop leads here
          </div>
        ) : (
          stageLeads.map((lead) => (
            <DraggableLeadCard key={lead.id} lead={lead} stage={stage} onView={() => navigate(`/leads/${lead.id}`)} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function DraggableLeadCard({ lead, stage, onView }: { lead: Lead; stage: typeof stages[0]; onView: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-move hover:shadow-md transition-shadow ${isDragging ? "opacity-50" : ""}`}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm">{lead.name}</h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>{lead.email}</p>
            {lead.phone && <p>{lead.phone}</p>}
            {lead.destination && (
              <p className="font-medium text-foreground">
                📍 {lead.destination}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between pt-2">
            <Badge variant="outline" className="text-xs">
              {lead.source}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

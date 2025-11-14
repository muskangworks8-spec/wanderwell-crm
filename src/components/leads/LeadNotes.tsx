import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LeadNotesProps {
  leadId: string;
  currentNotes: string | null;
}

export function LeadNotes({ leadId, currentNotes }: LeadNotesProps) {
  const [notes, setNotes] = useState(currentNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("leads")
        .update({ notes })
        .eq("id", leadId);

      if (error) throw error;

      // Log activity
      await supabase.from("activities").insert({
        lead_id: leadId,
        user_id: user?.id,
        type: "note",
        title: "Notes Updated",
        description: "Lead notes were updated",
      });

      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      toast.success("Notes saved successfully");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this lead..."
          className="min-h-[200px]"
        />
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Notes"}
        </Button>
      </CardContent>
    </Card>
  );
}

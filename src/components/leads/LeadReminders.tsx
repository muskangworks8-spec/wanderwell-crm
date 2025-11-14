import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Bell, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface LeadRemindersProps {
  leadId: string;
}

export function LeadReminders({ leadId }: LeadRemindersProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("lead_id", leadId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleCreate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("reminders").insert({
        lead_id: leadId,
        user_id: user?.id,
        title,
        description,
        due_date: new Date(dueDate).toISOString(),
      });

      if (error) throw error;

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user?.id,
        lead_id: leadId,
        title: "New Reminder",
        message: `Reminder set for ${title}`,
      });

      queryClient.invalidateQueries({ queryKey: ["reminders", leadId] });
      setOpen(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      toast.success("Reminder created");
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast.error("Failed to create reminder");
    }
  };

  const handleToggle = async (reminderId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("reminders")
        .update({ completed: !completed })
        .eq("id", reminderId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["reminders", leadId] });
      toast.success(completed ? "Reminder reopened" : "Reminder completed");
    } catch (error) {
      console.error("Error updating reminder:", error);
      toast.error("Failed to update reminder");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const overdue = reminders.filter(r => !r.completed && new Date(r.due_date) < now);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reminders</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Reminder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Follow up call"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Discuss pricing options..."
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date & Time</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">
                  Create Reminder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {overdue.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive">
              {overdue.length} overdue reminder{overdue.length > 1 ? "s" : ""}
            </p>
          </div>
        )}

        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No reminders set
          </p>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const isOverdue = !reminder.completed && new Date(reminder.due_date) < now;
              
              return (
                <div
                  key={reminder.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    reminder.completed ? "opacity-50" : ""
                  } ${isOverdue ? "border-destructive/50 bg-destructive/5" : ""}`}
                >
                  <Checkbox
                    checked={reminder.completed || false}
                    onCheckedChange={() => handleToggle(reminder.id, reminder.completed || false)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-sm ${reminder.completed ? "line-through" : ""}`}>
                        {reminder.title}
                      </p>
                      {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                    </div>
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground">
                        {reminder.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Bell className="h-3 w-3" />
                      <span>
                        {format(new Date(reminder.due_date), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface LeadsTableProps {
  searchQuery: string;
}

export const LeadsTable = ({ searchQuery }: LeadsTableProps) => {
  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select(`
          *,
          assigned_to_profile:profiles!leads_assigned_to_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-accent text-accent-foreground",
      contacted: "bg-primary text-primary-foreground",
      qualified: "bg-secondary text-secondary-foreground",
      proposal: "bg-blue-500 text-white",
      negotiation: "bg-purple-500 text-white",
      converted: "bg-success text-success-foreground",
      lost: "bg-muted text-muted-foreground",
    };
    return colors[status] || "bg-muted";
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      facebook: "bg-blue-600 text-white",
      google: "bg-red-500 text-white",
      manual: "bg-gray-500 text-white",
      referral: "bg-green-500 text-white",
      other: "bg-gray-400 text-white",
    };
    return colors[source] || "bg-muted";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No leads found. Create your first lead to get started.
              </TableCell>
            </TableRow>
          ) : (
            leads?.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>
                  <Badge className={getSourceColor(lead.source)} variant="secondary">
                    {lead.source}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell>{lead.destination || "-"}</TableCell>
                <TableCell>{lead.assigned_to_profile?.full_name || "Unassigned"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(lead.created_at), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LeadCommunicationProps {
  leadId: string;
  leadEmail: string;
  leadPhone: string | null;
}

export function LeadCommunication({ leadId, leadEmail, leadPhone }: LeadCommunicationProps) {
  const [emailMessage, setEmailMessage] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Log activity
      await supabase.from("activities").insert({
        lead_id: leadId,
        user_id: user?.id,
        type: "email",
        title: "Email Sent",
        description: `Email sent to ${leadEmail}: ${emailMessage.substring(0, 50)}...`,
      });

      queryClient.invalidateQueries({ queryKey: ["activities", leadId] });
      setEmailMessage("");
      toast.success("Email logged (SMTP integration placeholder)");
    } catch (error) {
      console.error("Error logging email:", error);
      toast.error("Failed to log email");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendWhatsApp = async () => {
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Log activity
      await supabase.from("activities").insert({
        lead_id: leadId,
        user_id: user?.id,
        type: "message",
        title: "WhatsApp Message Sent",
        description: `WhatsApp message sent to ${leadPhone}: ${whatsappMessage.substring(0, 50)}...`,
      });

      queryClient.invalidateQueries({ queryKey: ["activities", leadId] });
      setWhatsappMessage("");
      toast.success("WhatsApp message logged (API integration placeholder)");
    } catch (error) {
      console.error("Error logging WhatsApp message:", error);
      toast.error("Failed to log WhatsApp message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            <strong>Note:</strong> Communication features are currently in placeholder mode.
            Configure SMTP (email) and WhatsApp API keys in Settings to enable actual sending.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" disabled={!leadPhone}>
              <MessageSquare className="h-4 w-4 mr-2" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">To: {leadEmail}</p>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Type your email message here..."
                className="min-h-[200px]"
              />
            </div>
            <Button onClick={handleSendEmail} disabled={isSending || !emailMessage}>
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send Email"}
            </Button>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">To: {leadPhone}</p>
              <Textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Type your WhatsApp message here..."
                className="min-h-[200px]"
              />
            </div>
            <Button onClick={handleSendWhatsApp} disabled={isSending || !whatsappMessage}>
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send WhatsApp"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

-- Add campaign field to leads table
ALTER TABLE public.leads ADD COLUMN campaign text;

-- Create notifications table for tracking lead notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can create notifications for any user
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster email/phone lookups (duplicate check)
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_phone ON public.leads(phone);

-- Create function to get next available agent for lead distribution
CREATE OR REPLACE FUNCTION public.get_next_agent()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_agent_id uuid;
BEGIN
  -- Get agent with least number of active leads
  SELECT ur.user_id INTO next_agent_id
  FROM user_roles ur
  LEFT JOIN leads l ON l.assigned_to = ur.user_id AND l.status NOT IN ('converted', 'lost')
  WHERE ur.role = 'agent'
  GROUP BY ur.user_id
  ORDER BY COUNT(l.id) ASC, RANDOM()
  LIMIT 1;
  
  RETURN next_agent_id;
END;
$$;
-- Update lead_status enum to match new pipeline stages
-- First, remove the default constraint
ALTER TABLE leads ALTER COLUMN status DROP DEFAULT;

-- Rename old enum
ALTER TYPE lead_status RENAME TO lead_status_old;

-- Create new enum
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'follow_up', 'interested', 'converted', 'closed');

-- Update the column to use new enum
ALTER TABLE leads 
  ALTER COLUMN status TYPE lead_status 
  USING (
    CASE status::text
      WHEN 'new' THEN 'new'::lead_status
      WHEN 'contacted' THEN 'contacted'::lead_status
      WHEN 'qualified' THEN 'follow_up'::lead_status
      WHEN 'proposal' THEN 'interested'::lead_status
      WHEN 'negotiation' THEN 'interested'::lead_status
      WHEN 'won' THEN 'converted'::lead_status
      WHEN 'lost' THEN 'closed'::lead_status
      ELSE 'new'::lead_status
    END
  );

-- Add back the default
ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new'::lead_status;

-- Drop old enum
DROP TYPE lead_status_old;

-- Update RLS policies for agents to only access their assigned leads
DROP POLICY IF EXISTS "Users can view all leads" ON leads;

CREATE POLICY "Agents can view their assigned leads" 
ON leads FOR SELECT 
USING (
  auth.uid() = assigned_to 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can view all leads" 
ON leads FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update leads update policy for role-based access
DROP POLICY IF EXISTS "Users can update leads" ON leads;

CREATE POLICY "Agents can update their assigned leads" 
ON leads FOR UPDATE 
USING (
  auth.uid() = assigned_to 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update all leads" 
ON leads FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update activities RLS for role-based access
DROP POLICY IF EXISTS "Users can view activities for accessible leads" ON activities;

CREATE POLICY "Users can view activities for their leads" 
ON activities FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM leads 
    WHERE leads.id = activities.lead_id 
    AND (leads.assigned_to = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Enable realtime for better UX
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
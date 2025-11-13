import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if credentials are configured
    const fbAppId = Deno.env.get('FACEBOOK_APP_ID');
    const fbAccessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
    
    if (!fbAppId || !fbAccessToken) {
      return new Response(
        JSON.stringify({ error: 'Facebook credentials not configured' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch leads from Facebook Ads API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${fbAppId}/leadgen_forms?access_token=${fbAccessToken}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Facebook leads');
    }

    const data = await response.json();
    const leads = data.data || [];

    // Process and store leads
    for (const fbLead of leads) {
      const leadData = {
        name: fbLead.field_data?.find((f: any) => f.name === 'full_name')?.values[0] || '',
        email: fbLead.field_data?.find((f: any) => f.name === 'email')?.values[0] || '',
        phone: fbLead.field_data?.find((f: any) => f.name === 'phone_number')?.values[0] || '',
        source: 'Facebook Ads',
        campaign: fbLead.campaign_name || 'Unknown',
        status: 'new',
      };

      // Check for duplicates
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .or(`email.eq.${leadData.email},phone.eq.${leadData.phone}`)
        .single();

      if (!existing) {
        // Get next agent for assignment
        const { data: agentId } = await supabase.rpc('get_next_agent');
        
        const { data: newLead, error } = await supabase
          .from('leads')
          .insert({ ...leadData, assigned_to: agentId })
          .select()
          .single();

        if (newLead && !error) {
          // Create notification
          await supabase.from('notifications').insert({
            user_id: agentId,
            lead_id: newLead.id,
            title: 'New Lead Assigned',
            message: `New lead from Facebook Ads: ${leadData.name}`,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: leads.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

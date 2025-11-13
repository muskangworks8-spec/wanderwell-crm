import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if credentials are configured
    const clientId = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
    const refreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');
    const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
    
    if (!clientId || !refreshToken || !developerToken) {
      return new Response(
        JSON.stringify({ error: 'Google Ads credentials not configured' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get access token using refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: Deno.env.get('GOOGLE_ADS_CLIENT_SECRET') || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch lead form submissions
    // Note: This is a simplified example - actual implementation depends on your Google Ads setup
    const response = await fetch(
      'https://googleads.googleapis.com/v14/customers/CUSTOMER_ID/leadFormSubmissionData',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google Ads leads');
    }

    const data = await response.json();
    const leads = data.results || [];

    // Process and store leads
    for (const googleLead of leads) {
      const leadData = {
        name: googleLead.leadFormSubmissionData?.fullName || '',
        email: googleLead.leadFormSubmissionData?.email || '',
        phone: googleLead.leadFormSubmissionData?.phoneNumber || '',
        source: 'Google Ads',
        campaign: googleLead.campaign?.name || 'Unknown',
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
            message: `New lead from Google Ads: ${leadData.name}`,
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

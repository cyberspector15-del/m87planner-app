import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const PRODUCT_TIER_MAP: Record<string, string> = {
  'Event Horizon Monthly': 'event_horizon',
  'Event Horizon Annual': 'event_horizon',
  'Advance Monthly': 'advance',
  'Advance Annual': 'advance',
  'Apex Monthly': 'apex',
  'Apex Annual': 'apex',
  'Singularity Monthly': 'singularity',
  'Singularity Annual': 'singularity',
}

const ADDON_CREDITS: Record<string, number> = {
  'FLUX BOOST': 200,
  'FLUX SURGE': 500,
  'FLUX OVERDRIVE': 1200,
}

const TIER_ALLOWANCE: Record<string, number> = {
  event_horizon: 500,
  advance: 1000,
  apex: 2000,
  singularity: 4000,
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await req.text()
  const payload = JSON.parse(body)
  
  const { action, data } = payload
  const userEmail = data?.user?.email
  const productName = data?.product?.name

  if (!userEmail || !productName) {
    return new Response('Missing data', { status: 400 })
  }

  // Find user by email
  const { data: { users }, error: userError } = 
    await supabaseAdmin.auth.admin.listUsers()
  
  const user = users?.find(u => u.email === userEmail)
  
  if (!user) {
    return new Response('User not found', { status: 404 })
  }

  const userId = user.id

  if (action === 'membership_activated' || 
      action === 'payment_succeeded') {
    
    // Check if it's an addon
    const addonCredits = ADDON_CREDITS[productName]
    if (addonCredits) {
      // Add credits to existing balance
      const { data: credits } = await supabaseAdmin
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single()
      
      const newBalance = (credits?.balance ?? 0) + addonCredits
      
      await supabaseAdmin
        .from('user_credits')
        .upsert({ 
          user_id: userId, 
          balance: newBalance,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: addonCredits,
          action_type: 'addon_purchase',
          description: `FLUX Top-Up — ${productName}`
        })
        
      return new Response('Addon credits added', { status: 200 })
    }

    // It's a subscription tier
    const tier = PRODUCT_TIER_MAP[productName]
    if (!tier) {
      return new Response('Unknown product', { status: 400 })
    }

    const allowance = TIER_ALLOWANCE[tier]

    await supabaseAdmin
      .from('profiles')
      .update({ 
        subscription_tier: tier,
        subscription_status: 'active'
      })
      .eq('user_id', userId)

    await supabaseAdmin
      .from('user_credits')
      .upsert({
        user_id: userId,
        balance: allowance,
        monthly_allowance: allowance,
        last_reset_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    return new Response('Subscription activated', { status: 200 })
  }

  if (action === 'membership_deactivated') {
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'inactive' })
      .eq('user_id', userId)

    return new Response('Subscription deactivated', { status: 200 })
  }

  return new Response('Event ignored', { status: 200 })
})

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import webPush from 'npm:web-push@3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!;
const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')!;
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:bladex@bladex.com.br';

webPush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, tipo, mensagem, dados } = await req.json();
    if (!user_id || !mensagem) {
      return new Response(JSON.stringify({ error: 'user_id e mensagem são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: subRow } = await supabase
      .from('push_subscriptions')
      .select('subscription, prefs')
      .eq('user_id', user_id)
      .single();

    if (!subRow) {
      return new Response(JSON.stringify({ ok: true, sent: false, reason: 'no_subscription' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prefs = subRow.prefs as Record<string, boolean> || {};
    const tipoKeyMap: Record<string, string> = {
      resultado_torneio: 'resultados',
      torre_x_desafio: 'desafios',
      pedido_amizade: 'amigos',
      amizade_aceita: 'amigos',
      conquista: 'conquistas',
      torneio_publicado: 'torneios',
      torneio_iniciado: 'torneios',
      torneio_amanha: 'torneios',
    };
    const prefKey = tipoKeyMap[tipo] || 'geral';
    if (prefs[prefKey] === false) {
      return new Response(JSON.stringify({ ok: true, sent: false, reason: 'pref_disabled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pushSubscription = JSON.parse(subRow.subscription as string);

    const titles: Record<string, string> = {
      resultado_torneio: 'Resultado de Torneio',
      torre_x_desafio: 'Desafio Torre X',
      pedido_amizade: 'Novo Pedido de Amizade',
      conquista: 'Conquista Desbloqueada',
      torneio_publicado: 'Novo Torneio',
      torneio_iniciado: 'Torneio Iniciado',
    };

    const payload = JSON.stringify({
      title: titles[tipo] || 'BLADEX',
      body: mensagem,
      tipo,
      url: dados?.url || '/',
    });

    await webPush.sendNotification(pushSubscription, payload);

    return new Response(JSON.stringify({ ok: true, sent: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Push error:', error);
    return new Response(JSON.stringify({ error: error.message || 'unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

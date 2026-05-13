CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  user_agent TEXT,
  prefs JSONB DEFAULT '{"torneios":true,"desafios":true,"amigos":true,"resultados":true,"conquistas":true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_manage_own_push" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER push_subs_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: ao inserir notificação, chama edge function via pg_net para enviar push
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.dispatch_push_on_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text;
  v_anon text;
BEGIN
  -- URL e anon key do projeto (pegos do Vault não disponível; hardcoded da config)
  v_url := 'https://dszvslbnpubecwlpmzco.supabase.co/functions/v1/send-push';
  v_anon := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzenZzbGJucHViZWN3bHBtemNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4Njg4NjYsImV4cCI6MjA5MDQ0NDg2Nn0.fmFSEVY_ITzQALio2S_ws5IAspF4zdzrxouisFG5NoI';

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'tipo', NEW.tipo,
      'mensagem', NEW.mensagem,
      'dados', NEW.dados
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- nunca bloquear a inserção
END;
$$;

CREATE TRIGGER trg_dispatch_push
  AFTER INSERT ON public.notificacoes
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_on_notification();
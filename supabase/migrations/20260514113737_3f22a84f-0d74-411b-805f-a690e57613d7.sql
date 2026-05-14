-- Remover função de dispatch de push (caso exista)
DROP FUNCTION IF EXISTS public.dispatch_push_on_notification() CASCADE;

-- Remover tabela de push_subscriptions se existir
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
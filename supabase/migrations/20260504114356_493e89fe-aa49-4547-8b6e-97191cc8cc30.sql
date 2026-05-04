UPDATE public.tournaments 
SET status = 'active', final_standings = NULL 
WHERE id = 'fd940ca8-8a89-4a0b-9504-49f4af3c9c39';

UPDATE public.inscricoes
SET posicao_final = NULL, xp_ganho = 0, vitorias = 0, derrotas = 0, streak_max = 0
WHERE torneio_id = 'fd940ca8-8a89-4a0b-9504-49f4af3c9c39';

DO $$
DECLARE u uuid;
BEGIN
  FOR u IN 
    SELECT DISTINCT blader_id FROM public.inscricoes 
    WHERE torneio_id = 'fd940ca8-8a89-4a0b-9504-49f4af3c9c39' AND blader_id IS NOT NULL
    UNION
    SELECT DISTINCT bt.vinculado_a FROM public.inscricoes i 
    JOIN public.bladers_temp bt ON bt.id = i.blader_temp_id 
    WHERE i.torneio_id = 'fd940ca8-8a89-4a0b-9504-49f4af3c9c39' AND bt.vinculado_a IS NOT NULL
  LOOP
    PERFORM public.recompute_blader_metrics(u);
  END LOOP;
END $$;
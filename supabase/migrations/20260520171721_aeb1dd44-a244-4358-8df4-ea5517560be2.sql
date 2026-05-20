REVOKE EXECUTE ON FUNCTION public.recompute_elo_rankings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_tournament_results(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_tournament_results(uuid, jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.link_bladers_temp(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_bladers_temp(uuid, uuid[]) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.match_bladers_temp_by_email(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_bladers_temp_by_email(uuid, text) TO authenticated;
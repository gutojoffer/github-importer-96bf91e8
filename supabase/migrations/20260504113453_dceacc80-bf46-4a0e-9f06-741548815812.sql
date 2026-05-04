REVOKE EXECUTE ON FUNCTION public.apply_tournament_results(uuid, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_tournament_results(uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.apply_tournament_results(uuid, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.match_bladers_temp_by_email(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.match_bladers_temp_by_email(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_bladers_temp_by_email(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.link_bladers_temp(uuid, uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_bladers_temp(uuid, uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.link_bladers_temp(uuid, uuid[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.recompute_blader_metrics(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recompute_blader_metrics(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.recompute_blader_metrics(uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.rebuild_tournament_results_from_rounds(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rebuild_tournament_results_from_rounds(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.rebuild_tournament_results_from_rounds(uuid) TO authenticated;
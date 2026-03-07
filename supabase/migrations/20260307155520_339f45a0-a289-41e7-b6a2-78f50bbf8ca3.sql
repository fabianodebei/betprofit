GRANT EXECUTE ON FUNCTION public.decrypt_telegram_credential(bytea) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_telegram_credential(bytea) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_telegram_credential(bytea) TO anon;
GRANT EXECUTE ON FUNCTION public.encrypt_telegram_credential(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.encrypt_telegram_credential(text) TO authenticated;
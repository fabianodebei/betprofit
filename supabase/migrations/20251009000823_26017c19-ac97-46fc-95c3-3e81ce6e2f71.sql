-- Cancella tutti i dati applicativi, mantenendo account utente
DELETE FROM public.lay_bets WHERE user_id = '9ef0ed27-fa33-4863-83f8-1ed46d38179e';
DELETE FROM public.bets WHERE user_id = '9ef0ed27-fa33-4863-83f8-1ed46d38179e';
DELETE FROM public.transactions WHERE user_id = '9ef0ed27-fa33-4863-83f8-1ed46d38179e';
DELETE FROM public.accounts WHERE user_id = '9ef0ed27-fa33-4863-83f8-1ed46d38179e';
DELETE FROM public.wallets WHERE user_id = '9ef0ed27-fa33-4863-83f8-1ed46d38179e';
DELETE FROM public.intestatari WHERE user_id = '9ef0ed27-fa33-4863-83f8-1ed46d38179e';
DELETE FROM public.tags WHERE user_id = '9ef0ed27-fa33-4863-83f8-1ed46d38179e';
DELETE FROM public.books WHERE user_id = '9ef0ed27-fa33-4863-83f8-1ed46d38179e';
DELETE FROM public.notification_logs;
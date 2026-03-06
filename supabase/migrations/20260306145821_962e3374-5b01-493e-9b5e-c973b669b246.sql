-- Insert Italian bookmakers as public books owned by admin
INSERT INTO public.books (user_id, nome, metodo, stato, predefinito, is_public) VALUES
('137de58e-cd30-40f9-b6a1-a5d96694fed5', '888sport', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Admiral', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Bet365', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Betclic', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Betfair', 'Exchange', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Betflag', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Betsson', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Betway', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Bwin', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Eurobet', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Goldbet', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'LeoVegas', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Lottomatica', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'NetBet', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Novibet', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'PokerStars Sport', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Sisal', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Snai', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'StarCasinò', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'Unibet', 'Bookmaker', 'Abilitato', false, true),
('137de58e-cd30-40f9-b6a1-a5d96694fed5', 'William Hill', 'Bookmaker', 'Abilitato', false, true)
ON CONFLICT DO NOTHING;
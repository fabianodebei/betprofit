-- Enable realtime for lay_bets table
ALTER TABLE lay_bets REPLICA IDENTITY FULL;

-- Add lay_bets to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE lay_bets;
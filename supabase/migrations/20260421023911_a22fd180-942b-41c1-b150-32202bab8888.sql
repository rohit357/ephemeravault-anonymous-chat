CREATE POLICY "Anyone can read rooms"
ON public.rooms
FOR SELECT
USING (true);
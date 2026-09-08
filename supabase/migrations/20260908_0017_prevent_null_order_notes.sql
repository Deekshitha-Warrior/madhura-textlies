-- Keep legacy and current order RPCs compatible with NOT NULL order note columns.
-- Some deployed RPC versions omit these columns or pass NULL explicitly, which
-- bypasses the column defaults during POS billing.

CREATE OR REPLACE FUNCTION public.normalize_order_note_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.remarks := COALESCE(NEW.remarks, '');
  NEW.reference_number := COALESCE(NEW.reference_number, '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_order_note_columns_trigger ON public.orders;
CREATE TRIGGER normalize_order_note_columns_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.normalize_order_note_columns();

CREATE UNIQUE INDEX products_generic_name_uniq
ON public.products (LOWER(name))
WHERE off_id IS NULL;

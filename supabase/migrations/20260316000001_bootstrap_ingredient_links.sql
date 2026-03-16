create extension if not exists pg_trgm;

create or replace function bootstrap_ingredient_links(p_user_id uuid)
returns table(
  ingredient_name  text,
  matched_product_id uuid,
  product_name     text,
  matched_count    int
)
language plpgsql security definer
set search_path = public
as $$
declare
  v_rec            record;
  v_product_id     uuid;
  v_product_name   text;
  v_sim            float;
  v_count          int;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized';
  end if;

  for v_rec in
    select distinct lower(trim(ri.custom_name)) as norm_name,
                    ri.custom_name              as raw_name
    from   recipe_ingredients ri
    join   recipes r on r.id = ri.recipe_id
    where  r.user_id    = p_user_id
      and  ri.product_id is null
      and  ri.custom_name is not null
      and  trim(ri.custom_name) <> ''
  loop
    select p.id,
           p.name,
           similarity(lower(p.name), v_rec.norm_name)
    into   v_product_id, v_product_name, v_sim
    from   products p
    where  similarity(lower(p.name), v_rec.norm_name) > 0.25
    order  by similarity(lower(p.name), v_rec.norm_name) desc
    limit  1;

    if v_product_id is null then
      continue;
    end if;

    update recipe_ingredients ri
    set    product_id = v_product_id
    from   recipes r
    where  ri.recipe_id = r.id
      and  r.user_id    = p_user_id
      and  lower(trim(ri.custom_name)) = v_rec.norm_name
      and  ri.product_id is null;

    get diagnostics v_count = row_count;

    insert into user_ingredient_preferences (user_id, ingredient_name, product_id)
    values (p_user_id, v_rec.norm_name, v_product_id)
    on conflict (user_id, ingredient_name) do update
      set product_id = excluded.product_id,
          updated_at = now();

    ingredient_name     := v_rec.raw_name;
    matched_product_id  := v_product_id;
    product_name        := v_product_name;
    matched_count       := v_count;
    return next;
  end loop;
end;
$$;

grant execute on function bootstrap_ingredient_links(uuid) to authenticated;

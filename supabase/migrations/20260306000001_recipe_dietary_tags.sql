alter table recipes add column if not exists dietary_tags text[] not null default '{}';

create table jokes (
  id bigint generated always as identity primary key,
  setup text not null,
  punchline text not null,
  created_at timestamptz not null default now()
);

alter table jokes enable row level security;

create policy "Anyone can read jokes"
  on jokes for select
  to anon
  using (true);

insert into jokes (setup, punchline) values
  ('Why do programmers prefer dark mode?', 'Because light attracts bugs.'),
  ('Why did the database administrator leave his wife?', 'She had one-to-many relationships.'),
  ('How many programmers does it take to change a light bulb?', 'None, that''s a hardware problem.'),
  ('Why did the developer go broke?', 'Because he used up all his cache.'),
  ('What''s a SQL query''s favorite place to hang out?', 'The JOIN-t.');

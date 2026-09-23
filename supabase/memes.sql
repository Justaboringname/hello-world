drop table if exists jokes;

create table memes (
  id bigint generated always as identity primary key,
  title text not null,
  image_url text not null,
  top_text text,
  bottom_text text,
  created_at timestamptz not null default now()
);

alter table memes enable row level security;

create policy "Anyone can read memes"
  on memes for select
  to anon
  using (true);

insert into memes (title, image_url, top_text, bottom_text) values
  ('One Does Not Simply', 'https://i.imgflip.com/1bij.jpg', 'One does not simply', 'push to main on Friday'),
  ('Futurama Fry', 'https://i.imgflip.com/26am.jpg', 'Not sure if it''s a bug', 'or a feature'),
  ('Mocking SpongeBob', 'https://i.imgflip.com/1otk96.jpg', 'It works on my machine', 'iT wOrKs On My MaChInE'),
  ('Batman Slapping Robin', 'https://i.imgflip.com/9ehk.jpg', 'Let''s just hardcode the API key', 'Use environment variables!'),
  ('Two Buttons', 'https://i.imgflip.com/1g8my4.jpg', 'Fix the bug', 'Add a console.log');

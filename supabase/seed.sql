-- ScreenParty seed: premade question packs (free tier)

insert into public.question_packs (slug, title, topic, description, difficulty) values
  ('general-knowledge', 'General Knowledge', 'General', 'A bit of everything — geography, language, and the world around us.', 'mixed'),
  ('movies-tv', 'Movies & TV', 'Entertainment', 'Blockbusters, binge-worthy shows, and famous characters.', 'mixed'),
  ('science-space', 'Science & Space', 'Science', 'Planets, elements, and the human body.', 'mixed'),
  ('sports', 'Sports', 'Sports', 'Rules, records, and legends across the sports world.', 'mixed');

insert into public.pack_questions (pack_id, question_text, correct_answer, accepted_answers, difficulty)
select (select id from public.question_packs where slug = 'general-knowledge'), v.q, v.a, v.acc::jsonb, v.d
from (values
  ('What is the capital of Australia?', 'Canberra', '["canberra"]', 'medium'),
  ('How many continents are there on Earth?', 'Seven', '["7", "seven"]', 'easy'),
  ('What is the largest ocean on Earth?', 'The Pacific Ocean', '["pacific", "pacific ocean"]', 'easy'),
  ('What currency is used in Japan?', 'The Yen', '["yen", "japanese yen"]', 'easy'),
  ('How many sides does a hexagon have?', 'Six', '["6", "six"]', 'easy'),
  ('What is the tallest mountain above sea level?', 'Mount Everest', '["everest", "mt everest", "mount everest"]', 'easy'),
  ('Which country gifted the Statue of Liberty to the United States?', 'France', '["france"]', 'medium'),
  ('What is generally considered the longest river in the world?', 'The Nile', '["nile", "the nile", "nile river"]', 'medium'),
  ('What color do you get by mixing blue and yellow?', 'Green', '["green"]', 'easy'),
  ('Which planet is closest to the Sun?', 'Mercury', '["mercury"]', 'easy'),
  ('What is the largest country in the world by land area?', 'Russia', '["russia"]', 'easy'),
  ('How many strings does a standard guitar have?', 'Six', '["6", "six"]', 'medium'),
  ('Which language has the most native speakers in the world?', 'Mandarin Chinese', '["mandarin", "chinese", "mandarin chinese"]', 'medium'),
  ('In which city is the Eiffel Tower located?', 'Paris', '["paris"]', 'easy'),
  ('What do bees collect from flowers to make honey?', 'Nectar', '["nectar"]', 'medium')
) as v(q, a, acc, d);

insert into public.pack_questions (pack_id, question_text, correct_answer, accepted_answers, difficulty)
select (select id from public.question_packs where slug = 'movies-tv'), v.q, v.a, v.acc::jsonb, v.d
from (values
  ('Who played Iron Man in the Marvel Cinematic Universe?', 'Robert Downey Jr.', '["robert downey jr", "robert downey junior", "rdj"]', 'easy'),
  ('Which movie franchise features the line "May the Force be with you"?', 'Star Wars', '["star wars"]', 'easy'),
  ('What kind of fish is Nemo in Finding Nemo?', 'A clownfish', '["clownfish", "clown fish"]', 'easy'),
  ('In Friends, what is the name of Ross''s pet monkey?', 'Marcel', '["marcel"]', 'hard'),
  ('What is the highest-grossing film of all time?', 'Avatar', '["avatar"]', 'medium'),
  ('Who directed Jurassic Park?', 'Steven Spielberg', '["spielberg", "steven spielberg"]', 'medium'),
  ('What is the name of the wizarding school in Harry Potter?', 'Hogwarts', '["hogwarts"]', 'easy'),
  ('In The Office (US), what paper company does Michael Scott work for?', 'Dunder Mifflin', '["dunder mifflin"]', 'easy'),
  ('Which Pixar movie features a rat who dreams of becoming a chef?', 'Ratatouille', '["ratatouille"]', 'easy'),
  ('Who voices Woody in Toy Story?', 'Tom Hanks', '["tom hanks", "hanks"]', 'medium'),
  ('Which TV show features dragons and the Iron Throne?', 'Game of Thrones', '["game of thrones", "got"]', 'easy'),
  ('What is the name of the hobbit played by Elijah Wood in The Lord of the Rings?', 'Frodo Baggins', '["frodo", "frodo baggins"]', 'easy'),
  ('In Stranger Things, what is the name of the dark parallel dimension?', 'The Upside Down', '["upside down", "the upside down"]', 'medium'),
  ('Who played Jack in the 1997 film Titanic?', 'Leonardo DiCaprio', '["leonardo dicaprio", "leo dicaprio", "dicaprio"]', 'easy'),
  ('What is the name of SpongeBob''s pet snail?', 'Gary', '["gary"]', 'medium')
) as v(q, a, acc, d);

insert into public.pack_questions (pack_id, question_text, correct_answer, accepted_answers, difficulty)
select (select id from public.question_packs where slug = 'science-space'), v.q, v.a, v.acc::jsonb, v.d
from (values
  ('What planet is known as the Red Planet?', 'Mars', '["mars", "the planet mars"]', 'easy'),
  ('What is the chemical symbol for gold?', 'Au', '["au"]', 'medium'),
  ('What gas do plants absorb from the atmosphere for photosynthesis?', 'Carbon dioxide', '["co2", "carbon dioxide"]', 'easy'),
  ('What is the largest planet in our solar system?', 'Jupiter', '["jupiter"]', 'easy'),
  ('What force keeps us on the ground?', 'Gravity', '["gravity"]', 'easy'),
  ('How many bones are in the adult human body?', '206', '["206", "two hundred six", "two hundred and six"]', 'hard'),
  ('What part of the cell contains DNA?', 'The nucleus', '["nucleus", "the nucleus"]', 'medium'),
  ('What is H2O commonly known as?', 'Water', '["water"]', 'easy'),
  ('Which planet has the most prominent ring system?', 'Saturn', '["saturn"]', 'easy'),
  ('What is the closest star to Earth?', 'The Sun', '["sun", "the sun"]', 'medium'),
  ('What is the largest mammal on Earth?', 'The blue whale', '["blue whale", "the blue whale", "whale"]', 'easy'),
  ('What is the chemical symbol for oxygen?', 'O', '["o"]', 'easy'),
  ('How many planets are in our solar system?', 'Eight', '["8", "eight"]', 'easy'),
  ('What organ pumps blood around the body?', 'The heart', '["heart", "the heart"]', 'easy'),
  ('What natural phenomenon is measured by the Richter scale?', 'Earthquakes', '["earthquake", "earthquakes"]', 'medium')
) as v(q, a, acc, d);

insert into public.pack_questions (pack_id, question_text, correct_answer, accepted_answers, difficulty)
select (select id from public.question_packs where slug = 'sports'), v.q, v.a, v.acc::jsonb, v.d
from (values
  ('How many players from one soccer team are on the field at once?', 'Eleven', '["11", "eleven"]', 'medium'),
  ('In which sport would you perform a slam dunk?', 'Basketball', '["basketball"]', 'easy'),
  ('How many rings are on the Olympic flag?', 'Five', '["5", "five"]', 'easy'),
  ('In which country is the Wimbledon tennis tournament held?', 'England', '["england", "uk", "united kingdom", "great britain", "britain"]', 'easy'),
  ('How many points is a touchdown worth in American football?', 'Six', '["6", "six"]', 'medium'),
  ('Which sport is known as "the beautiful game"?', 'Soccer', '["soccer", "football"]', 'medium'),
  ('In baseball, how many strikes make an out?', 'Three', '["3", "three"]', 'easy'),
  ('Which player has won the most NBA championships?', 'Bill Russell', '["bill russell", "russell"]', 'hard'),
  ('Which sport uses a shuttlecock?', 'Badminton', '["badminton"]', 'easy'),
  ('How often are the Summer Olympics held?', 'Every four years', '["4", "four", "4 years", "four years", "every 4 years", "every four years"]', 'easy'),
  ('In golf, what is one stroke under par called?', 'A birdie', '["birdie", "a birdie"]', 'medium'),
  ('Which country has won the most FIFA World Cups?', 'Brazil', '["brazil"]', 'medium'),
  ('How many miles long is a marathon, to the nearest mile?', '26 miles', '["26", "26.2", "26 miles", "26.2 miles", "twenty six"]', 'medium'),
  ('What sport do the Toronto Maple Leafs play?', 'Ice hockey', '["hockey", "ice hockey"]', 'easy'),
  ('In tennis, what is a score of zero called?', 'Love', '["love"]', 'medium')
) as v(q, a, acc, d);

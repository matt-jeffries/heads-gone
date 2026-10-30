// Hand-picked starter categories. Run scripts/fetch-wikidata.mjs to add
// Wikidata-generated ones (written to wikidata-categories.js).
window.CATEGORIES = [
  {
    id: "magpies", free: true, name: "The Magpies", blurb: "Black and white heroes of Tyneside",
    players: ["Alan Shearer","Jackie Milburn","Malcolm Macdonald","Hughie Gallacher","Bobby Moncur","Kevin Keegan","Peter Beardsley","Terry McDermott","Chris Waddle","Paul Gascoigne","Andy Cole","Les Ferdinand","David Ginola","Faustino Asprilla","Rob Lee","Philippe Albert","Steve Watson","Warren Barton","John Beresford","Pavel Srníček","Steve Howey","Lee Clark","Shay Given","Gary Speed","Nolberto Solano","Craig Bellamy","Laurent Robert","Kieron Dyer","Michael Owen","Obafemi Martins","Hatem Ben Arfa","Yohan Cabaye","Papiss Cissé","Demba Ba","Cheick Tioté","Fabricio Coloccini","Jonás Gutiérrez","Tim Krul","Moussa Sissoko","Jamaal Lascelles","Miguel Almirón","Allan Saint-Maximin","Callum Wilson","Joelinton","Bruno Guimarães","Kieran Trippier","Nick Pope","Sven Botman","Fabian Schär","Dan Burn","Sean Longstaff","Jacob Murphy","Alexander Isak","Anthony Gordon","Sandro Tonali"]
  },
  {
    id: "blackcats", free: true, name: "The Black Cats", blurb: "Red and white heroes of Wearside",
    players: ["Raich Carter","Bobby Gurney","Len Shackleton","Charlie Hurley","Jim Montgomery","Ian Porterfield","Dennis Tueart","Gary Rowell","Gary Bennett","Marco Gabbiadini","Kevin Ball","Niall Quinn","Kevin Phillips","Michael Gray","Thomas Sørensen","Stefan Schwarz","Julio Arca","Dwight Yorke","Kenwyne Jones","Djibril Cissé","Darren Bent","Asamoah Gyan","Jordan Henderson","Lee Cattermole","Craig Gordon","Phil Bardsley","Sebastian Larsson","John O'Shea","Wes Brown","Simon Mignolet","Stéphane Sessègnon","Steven Fletcher","Fabio Borini","Jermain Defoe","Patrick van Aanholt","Jordan Pickford","Lamine Koné","Aiden McGeady","Luke O'Nien","Ross Stewart","Jack Clarke","Dan Neil","Patrick Roberts","Jobe Bellingham","Chris Rigg"]
  },
  {
    id: "spireites", free: true, name: "The Spireites", blurb: "Heroes from the crooked spire town",
    players: ["Gordon Banks","Ernie Moss","Dave Blakey","Alan Birch","Sean Dyche","Kevin Davies","Jonathan Howard","Andy Morris","Tony Lormor","Chris Beaumont","Billy Mercer","Jamie Hewitt","Mark Jules","Darren Carr","Jack Lester","Jamie Ward","Derek Niven","Craig Westcarr","Tommy Lee","Sam Hird","Jordan Bowery","Kristian Dennis","Jamie Grimes","Liam Mandeville","Joe Quigley","Armando Dobra","Will Grigg","Tom Naylor","Mike Jones","Ryan Colclough"]
  },
  {
    id: "90s", free: true, name: "Nineties Legends", blurb: "Baggy shirts, curtain haircuts and teletext",
    players: ["Alan Shearer","Eric Cantona","Ryan Giggs","Dennis Bergkamp","Gianfranco Zola","Paul Gascoigne","Ian Wright","Roberto Baggio","Ronaldo Nazário","Zinedine Zidane","Gabriel Batistuta","Paolo Maldini","George Weah","Peter Schmeichel","Matt Le Tissier","Jürgen Klinsmann","David Ginola","Robbie Fowler","Steve McManaman","Teddy Sheringham","Andy Cole","Tony Adams","Stuart Pearce","David Seaman","Les Ferdinand","Fabrizio Ravanelli","Juninho","Hristo Stoichkov","Romário","Gheorghe Hagi","Davor Šuker","Michael Owen","Roy Keane","Paul Ince","Patrick Vieira","Emmanuel Petit","Marc Overmars","Ole Gunnar Solskjær"]
  },
  {
    id: "hair", free: true, name: "Perms, Mullets & Barnets", blurb: "Famous for what was on their heads",
    players: ["Kevin Keegan","Chris Waddle","Carlos Valderrama","Ruud Gullit","Barry Venison","Rudi Völler","Terry McDermott","Graeme Souness","Jason Lee","Taribo West","David Seaman","Roberto Baggio","Ronaldo Nazário","Marouane Fellaini","David Luiz","Carles Puyol","Abel Xavier","Alexi Lalas","Andrea Pirlo","Zlatan Ibrahimović","Gareth Bale","Mario Balotelli","Djibril Cissé","Jack Grealish","Paul Pogba"]
  },
  {
    id: "wingers", free: true, name: "Wingers", blurb: "Chalk on their boots",
    players: ["Ryan Giggs","Cristiano Ronaldo","Arjen Robben","Franck Ribéry","Mohamed Salah","Sadio Mané","Raheem Sterling","Eden Hazard","Luís Figo","Marc Overmars","David Ginola","Garrincha","Stanley Matthews","George Best","Chris Waddle","John Barnes","Steve McManaman","Damien Duff","Robert Pires","Ashley Young","Aaron Lennon","Theo Walcott","Riyad Mahrez","Bukayo Saka","Vinícius Júnior","Leroy Sané","Kingsley Coman","Ángel Di María","Ricardo Quaresma","Nani","Antonio Valencia","Adama Traoré","Wilfried Zaha","Jack Grealish","Khvicha Kvaratskhelia","Lamine Yamal"]
  },
  {
    id: "keepers", free: true, name: "Goalkeepers", blurb: "Number ones and cult gloves",
    players: ["Peter Schmeichel","David Seaman","Gianluigi Buffon","Iker Casillas","Manuel Neuer","Petr Čech","Edwin van der Sar","Oliver Kahn","Lev Yashin","Gordon Banks","Peter Shilton","Pat Jennings","Neville Southall","Bruce Grobbelaar","José Luis Chilavert","René Higuita","Jorge Campos","Thibaut Courtois","Alisson Becker","Ederson","David de Gea","Jordan Pickford","Hugo Lloris","Joe Hart","Brad Friedel","Tim Howard","Shay Given","Jens Lehmann","Emiliano Martínez","Jan Oblak","Marc-André ter Stegen","Gianluigi Donnarumma","Kasper Schmeichel","David James"]
  },
  {
    id: "worldcup", name: "World Champions", blurb: "Lifted the big one",
    players: ["Pelé","Diego Maradona","Zinedine Zidane","Lionel Messi","Ronaldo Nazário","Ronaldinho","Cafu","Roberto Carlos","Rivaldo","Kylian Mbappé","Antoine Griezmann","Paul Pogba","N'Golo Kanté","Hugo Lloris","Thierry Henry","Fabien Barthez","Marcel Desailly","Lilian Thuram","Andrés Iniesta","Xavi","Iker Casillas","Sergio Ramos","Carles Puyol","David Villa","Fernando Torres","Fabio Cannavaro","Andrea Pirlo","Francesco Totti","Gianluigi Buffon","Alessandro Del Piero","Miroslav Klose","Thomas Müller","Manuel Neuer","Mario Götze","Bastian Schweinsteiger","Philipp Lahm","Bobby Moore","Geoff Hurst","Gordon Banks","Bobby Charlton","Franz Beckenbauer","Gerd Müller","Paolo Rossi","Ángel Di María","Emiliano Martínez","Julián Álvarez","Romário","Bebeto","Lothar Matthäus","Jürgen Klinsmann"]
  },
  {
    id: "prem", name: "Top Flight Icons", blurb: "English top flight, since 1992",
    players: ["Thierry Henry","Alan Shearer","Frank Lampard","Steven Gerrard","Wayne Rooney","Cristiano Ronaldo","Didier Drogba","Sergio Agüero","Mohamed Salah","Kevin De Bruyne","Harry Kane","Erling Haaland","Patrick Vieira","Roy Keane","John Terry","Rio Ferdinand","Vincent Kompany","Paul Scholes","Ryan Giggs","Eric Cantona","Dennis Bergkamp","Gianfranco Zola","Yaya Touré","David Silva","Cesc Fàbregas","Robin van Persie","Luis Suárez","Jamie Vardy","Son Heung-min","Virgil van Dijk","Ashley Cole","Gareth Bale","Eden Hazard","Michael Owen","Jermain Defoe","Peter Crouch","Matt Le Tissier","Tim Cahill","Kevin Phillips","Les Ferdinand"]
  },
  {
    id: "now", name: "Current Stars", blurb: "The 2025/26 big names",
    players: ["Erling Haaland","Kylian Mbappé","Vinícius Júnior","Jude Bellingham","Lamine Yamal","Mohamed Salah","Harry Kane","Bukayo Saka","Cole Palmer","Phil Foden","Declan Rice","Martin Ødegaard","Pedri","Raphinha","Robert Lewandowski","Florian Wirtz","Jamal Musiala","Rodri","Federico Valverde","Alexander Isak","Bruno Fernandes","Virgil van Dijk","William Saliba","Victor Osimhen","Lautaro Martínez","Ousmane Dembélé","Khvicha Kvaratskhelia","Achraf Hakimi","Vitinha","Désiré Doué","Alexis Mac Allister","Trent Alexander-Arnold","Kevin De Bruyne","Bruno Guimarães","Michael Olise","Viktor Gyökeres","Pau Cubarsí","Jeremy Frimpong"]
  },
  {
    id: "strikers", free: true, name: "Goal Machines", blurb: "Strikers who lived in the six-yard box",
    players: ["Alan Shearer","Thierry Henry","Ian Rush","Gary Lineker","Jimmy Greaves","Gerd Müller","Miroslav Klose","Robert Lewandowski","Zlatan Ibrahimović","Luis Suárez","Sergio Agüero","Harry Kane","Erling Haaland","Didier Drogba","Samuel Eto'o","Andriy Shevchenko","Filippo Inzaghi","Ruud van Nistelrooy","Raúl","Fernando Torres","Karim Benzema","Edinson Cavani","Gabriel Batistuta","Hernán Crespo","Christian Vieri","Romário","Michael Owen","Robbie Fowler","Andy Cole","Jermain Defoe","Wayne Rooney","Ian Wright","Teddy Sheringham","Les Ferdinand","Jamie Vardy","Peter Crouch","Emile Heskey","Dwight Yorke","Kevin Phillips","Eusébio"]
  },
  {
    id: "ballon", name: "Best in the World", blurb: "Officially crowned the planet's best",
    players: ["Lionel Messi","Cristiano Ronaldo","Luka Modrić","Karim Benzema","Rodri","Ousmane Dembélé","Kaká","Ronaldinho","Fabio Cannavaro","Andriy Shevchenko","Pavel Nedvěd","Ronaldo Nazário","Michael Owen","Luís Figo","Rivaldo","Zinedine Zidane","George Weah","Matthias Sammer","Hristo Stoichkov","Roberto Baggio","Jean-Pierre Papin","Marco van Basten","Lothar Matthäus","Ruud Gullit","Igor Belanov","Michel Platini","Paolo Rossi","Karl-Heinz Rummenigge","Kevin Keegan","Allan Simonsen","Johan Cruyff","Franz Beckenbauer","Gerd Müller","George Best","Bobby Charlton","Eusébio","Denis Law","Alfredo Di Stéfano","Lev Yashin","Stanley Matthews"]
  },
  {
    id: "england", name: "England Internationals", blurb: "Capped for England, all eras",
    players: ["Bobby Moore","Bobby Charlton","Gary Lineker","Paul Gascoigne","Alan Shearer","David Beckham","Wayne Rooney","Steven Gerrard","Frank Lampard","John Terry","Rio Ferdinand","Ashley Cole","Michael Owen","Paul Scholes","Harry Kane","Raheem Sterling","Jordan Henderson","Bukayo Saka","Jude Bellingham","Declan Rice","Phil Foden","Jack Grealish","Marcus Rashford","Jordan Pickford","Kyle Walker","Harry Maguire","John Stones","Stuart Pearce","Tony Adams","David Seaman","Peter Shilton","Gordon Banks","Bryan Robson","Glenn Hoddle","Kevin Keegan","Chris Waddle","John Barnes","Teddy Sheringham","Peter Crouch","Emile Heskey","Jermain Defoe","Theo Walcott","Joe Cole","Gareth Southgate","Sol Campbell","Cole Palmer"]
  },
  {
    id: "cult", free: true, name: "Cult Heroes", blurb: "Loved more than their medal count suggests",
    players: ["Jay-Jay Okocha","Matt Le Tissier","Paolo Di Canio","Faustino Asprilla","Juninho","Fabrizio Ravanelli","Georgi Kinkladze","Benito Carbone","Yakubu","Nwankwo Kanu","Peter Crouch","Tony Yeboah","Duncan Ferguson","Jimmy Bullard","Rory Delap","Robbie Savage","Craig Bellamy","Dimitar Berbatov","Adel Taarabt","Mario Balotelli","Vinnie Jones","Dean Windass","Kevin Davies","Nolberto Solano","Lomana LuaLua","Andy Carroll","Emmanuel Adebayor","Grant Holt","Rickie Lambert","Glenn Murray","Charlie Austin","Troy Deeney"]
  },
  {
    id: "liverpool", name: "The Reds", blurb: "Legends from the red half of Merseyside",
    players: ["Kenny Dalglish","Ian Rush","Steven Gerrard","Jamie Carragher","John Barnes","Robbie Fowler","Michael Owen","Steve McManaman","Graeme Souness","Kevin Keegan","Bruce Grobbelaar","Alan Hansen","Mark Lawrenson","Phil Thompson","Emlyn Hughes","Ray Clemence","John Aldridge","Peter Beardsley","Jan Mølby","Sami Hyypiä","Xabi Alonso","Fernando Torres","Luis Suárez","Dietmar Hamann","Jerzy Dudek","Mohamed Salah","Sadio Mané","Roberto Firmino","Virgil van Dijk","Jordan Henderson","Trent Alexander-Arnold","Alisson Becker","Andrew Robertson","Pepe Reina","Dirk Kuyt","Ian St John","Roger Hunt","Phil Neal","Javier Mascherano"]
  },
  {
    id: "manutd", name: "Red Devils", blurb: "Legends from the red half of Manchester",
    players: ["George Best","Bobby Charlton","Denis Law","Eric Cantona","Ryan Giggs","Paul Scholes","David Beckham","Roy Keane","Gary Neville","Peter Schmeichel","Cristiano Ronaldo","Wayne Rooney","Rio Ferdinand","Nemanja Vidić","Bryan Robson","Mark Hughes","Steve Bruce","Gary Pallister","Denis Irwin","Ole Gunnar Solskjær","Andy Cole","Dwight Yorke","Teddy Sheringham","Ruud van Nistelrooy","Edwin van der Sar","Patrice Evra","Michael Carrick","Robin van Persie","Dimitar Berbatov","Park Ji-sung","Nicky Butt","Phil Neville","Jaap Stam","Bruno Fernandes","Marcus Rashford","David de Gea","Lee Sharpe","Paul Ince"]
  },
  {
    id: "arsenal", name: "The Gunners", blurb: "North London's red and white",
    players: ["Thierry Henry","Dennis Bergkamp","Patrick Vieira","Tony Adams","Ian Wright","Robert Pires","Freddie Ljungberg","Sol Campbell","Ashley Cole","Jens Lehmann","David Seaman","Lee Dixon","Nigel Winterburn","Steve Bould","Martin Keown","Ray Parlour","Marc Overmars","Emmanuel Petit","Nicolas Anelka","Nwankwo Kanu","Cesc Fàbregas","Robin van Persie","Gilberto Silva","Kolo Touré","Charlie George","Liam Brady","Pat Jennings","David Rocastle","Paul Merson","Alan Smith","Santi Cazorla","Mesut Özil","Alexis Sánchez","Bukayo Saka","Martin Ødegaard","Declan Rice","William Saliba","Gabriel Martinelli","Aaron Ramsey","Olivier Giroud","Pierre-Emerick Aubameyang"]
  }
];

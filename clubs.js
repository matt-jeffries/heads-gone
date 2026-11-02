// Every club for the "Who do you support?" picker (2025/26 season).
// Shown by nickname and place, not club name. A club whose id matches a pack id gets that pack free;
// the rest are remembered so their pack is free when it's added.
// Row: id | league | nickname | place | kit style | colour A | colour B
window.LEAGUES = [
  ["eng1", "Top flight", "England"], ["eng2", "Second tier", "England"], ["eng3", "Third tier", "England"], ["eng4", "Fourth tier", "England"],
  ["sco", "Scotland", "Scotland"], ["esp", "Spain", "Spain"], ["ita", "Italy", "Italy"], ["ger", "Germany", "Germany"], ["fra", "France", "France"],
];
window.POPULAR_CLUBS = ["manutd", "liverpool", "arsenal", "chelsea", "mancity", "lilywhites", "magpies", "everton", "villa", "hammers", "leeds", "celtic", "rangers", "realmadrid", "barca"];
window.CLUBS = `
arsenal|eng1|Gunners|Islington|sleeves|#db0007|#f6f6f2
villa|eng1|Villans|Birmingham|sleeves|#670e36|#95bfe5
bournemouth|eng1|Cherries|Bournemouth|stripes|#da291c|#151515
brentford|eng1|Bees|Brentford|stripes|#e30613|#f6f6f2
brighton|eng1|Seagulls|Brighton|stripes|#0057b8|#f6f6f2
burnley|eng1|Clarets|Burnley|sleeves|#6c1d45|#99d6ea
chelsea|eng1|Blues|Chelsea|trim|#034694|#f6f6f2
eagles|eng1|Eagles|Croydon|stripes|#1b458f|#c4122e
everton|eng1|Toffees|Liverpool|trim|#003399|#f6f6f2
fulham|eng1|Cottagers|Fulham|trim|#f6f6f2|#151515
leeds|eng1|Peacocks|Leeds|trim|#f6f6f2|#1d428a
liverpool|eng1|Reds|Liverpool|trim|#c8102e|#f6f6f2
mancity|eng1|Citizens|Manchester|trim|#6cabdd|#f6f6f2
manutd|eng1|Red Devils|Manchester|trim|#da291c|#151515
magpies|eng1|Magpies|Newcastle|stripes|#151515|#f6f6f2
forest|eng1|Tricky Trees|Nottingham|trim|#dd0000|#f6f6f2
blackcats|eng1|Black Cats|Sunderland|stripes|#d2232a|#f6f6f2
lilywhites|eng1|Lilywhites|Tottenham|trim|#f6f6f2|#132257
hammers|eng1|Hammers|West Ham|sleeves|#7a263a|#5fb8e6
wolves|eng1|Wolves|Wolverhampton|trim|#fdb913|#151515
birmingham|eng2|Blues|Birmingham|trim|#0000ff|#f6f6f2
blackburn|eng2|Rovers|Blackburn|halves|#009ee0|#f6f6f2
bristolcity|eng2|Robins|Bristol|trim|#e21a23|#f6f6f2
charlton|eng2|Addicks|Charlton|trim|#d4021d|#f6f6f2
coventry|eng2|Sky Blues|Coventry|trim|#59cbe8|#f6f6f2
derby|eng2|Rams|Derby|trim|#f6f6f2|#151515
hull|eng2|Tigers|Hull|stripes|#f5a12d|#151515
ipswich|eng2|Tractor Boys|Ipswich|trim|#0044a9|#f6f6f2
leicester|eng2|Foxes|Leicester|trim|#003090|#fdbe11
boro|eng2|Boro|Middlesbrough|trim|#e11b22|#f6f6f2
millwall|eng2|Lions|Bermondsey|trim|#001d5e|#f6f6f2
norwich|eng2|Canaries|Norwich|trim|#fff200|#00a650
oxford|eng2|U's|Oxford|trim|#ffd700|#001e62
portsmouth|eng2|Pompey|Portsmouth|trim|#001489|#f6f6f2
preston|eng2|Lilywhites|Preston|trim|#f6f6f2|#001d5e
qpr|eng2|Hoops|Shepherd's Bush|hoops|#005cab|#f6f6f2
sheffutd|eng2|Blades|Sheffield|stripes|#ee2737|#f6f6f2
sheffwed|eng2|Owls|Sheffield|stripes|#0e00f7|#f6f6f2
southampton|eng2|Saints|Southampton|stripes|#d71920|#f6f6f2
stoke|eng2|Potters|Stoke|stripes|#e03a3e|#f6f6f2
swansea|eng2|Swans|Swansea|trim|#f6f6f2|#151515
watford|eng2|Hornets|Watford|trim|#fbee23|#ed2127
westbrom|eng2|Baggies|West Bromwich|stripes|#122f67|#f6f6f2
wrexham|eng2|Red Dragons|Wrexham|trim|#d71920|#f6f6f2
barnsley|eng3|Tykes|Barnsley|trim|#d71920|#f6f6f2
blackpool|eng3|Seasiders|Blackpool|trim|#f68712|#f6f6f2
bolton|eng3|Trotters|Bolton|trim|#f6f6f2|#263c7e
bradford|eng3|Bantams|Bradford|stripes|#7a003c|#fdb913
burton|eng3|Brewers|Burton|trim|#fdd800|#151515
cardiff|eng3|Bluebirds|Cardiff|trim|#0070b5|#f6f6f2
doncaster|eng3|Rovers|Doncaster|hoops|#ed1c24|#f6f6f2
exeter|eng3|Grecians|Exeter|stripes|#d71920|#f6f6f2
huddersfield|eng3|Terriers|Huddersfield|stripes|#0e63ad|#f6f6f2
orient|eng3|O's|Leyton|trim|#e2231a|#f6f6f2
lincoln|eng3|Imps|Lincoln|stripes|#e30613|#f6f6f2
luton|eng3|Hatters|Luton|trim|#f78f1e|#002d62
mansfield|eng3|Stags|Mansfield|trim|#f5a12d|#1d428a
northampton|eng3|Cobblers|Northampton|trim|#7a1e2e|#f6f6f2
peterborough|eng3|Posh|Peterborough|trim|#005daa|#f6f6f2
plymouth|eng3|Pilgrims|Plymouth|trim|#005a3c|#f6f6f2
portvale|eng3|Valiants|Burslem|trim|#f6f6f2|#151515
reading|eng3|Royals|Reading|hoops|#004494|#f6f6f2
rotherham|eng3|Millers|Rotherham|trim|#e30613|#f6f6f2
stevenage|eng3|Boro|Stevenage|trim|#d71920|#f6f6f2
stockport|eng3|Hatters|Stockport|trim|#005daa|#f6f6f2
wigan|eng3|Latics|Wigan|stripes|#1d59af|#f6f6f2
wycombe|eng3|Chairboys|High Wycombe|quarters|#87ceeb|#002f6c
wimbledon|eng3|Dons|Wimbledon|trim|#003893|#fff200
accrington|eng4|Stanley|Accrington|trim|#d71920|#f6f6f2
barnet|eng4|Bees|Barnet|trim|#f68712|#151515
barrow|eng4|Bluebirds|Barrow|trim|#0055a5|#f6f6f2
bristolrovers|eng4|Gas|Bristol|quarters|#0047ab|#f6f6f2
bromley|eng4|Ravens|Bromley|trim|#f6f6f2|#151515
cambridge|eng4|U's|Cambridge|trim|#fdb913|#151515
cheltenham|eng4|Robins|Cheltenham|stripes|#d71920|#f6f6f2
spireites|eng4|Spireites|Chesterfield|trim|#1450a3|#f6f6f2
colchester|eng4|U's|Colchester|stripes|#0057b8|#f6f6f2
crawley|eng4|Reds|Crawley|trim|#d71920|#f6f6f2
crewe|eng4|Railwaymen|Crewe|trim|#d71920|#f6f6f2
fleetwood|eng4|Cod Army|Fleetwood|trim|#d71920|#f6f6f2
gillingham|eng4|Gills|Gillingham|trim|#0047ab|#f6f6f2
grimsby|eng4|Mariners|Grimsby|stripes|#151515|#f6f6f2
harrogate|eng4|Sulphurites|Harrogate|trim|#fdd800|#151515
mkdons|eng4|Dons|Milton Keynes|trim|#f6f6f2|#151515
newport|eng4|Exiles|Newport|trim|#f5a12d|#151515
nottscounty|eng4|Magpies|Nottingham|stripes|#151515|#f6f6f2
oldham|eng4|Latics|Oldham|trim|#003da5|#f6f6f2
salford|eng4|Ammies|Salford|trim|#d71920|#f6f6f2
shrewsbury|eng4|Shrews|Shrewsbury|trim|#0047ab|#fdb913
swindon|eng4|Robins|Swindon|trim|#d71920|#f6f6f2
tranmere|eng4|Rovers|Birkenhead|trim|#f6f6f2|#0047ab
walsall|eng4|Saddlers|Walsall|trim|#d71920|#f6f6f2
aberdeen|sco|Dons|Aberdeen|trim|#d71920|#f6f6f2
celtic|sco|Bhoys|Glasgow|hoops|#018749|#f6f6f2
dundee|sco|Dark Blues|Dundee|trim|#002f6c|#f6f6f2
dundeeutd|sco|Terrors|Dundee|trim|#f68712|#151515
falkirk|sco|Bairns|Falkirk|trim|#002f6c|#f6f6f2
hearts|sco|Jambos|Edinburgh|trim|#8b0020|#f6f6f2
hibs|sco|Hibees|Edinburgh|sleeves|#007a3d|#f6f6f2
kilmarnock|sco|Killie|Kilmarnock|stripes|#0047ab|#f6f6f2
livingston|sco|Livi|Livingston|trim|#fdd800|#151515
motherwell|sco|Well|Motherwell|trim|#f5a12d|#8b0020
rangers|sco|Gers|Glasgow|trim|#1b458f|#f6f6f2
stmirren|sco|Buddies|Paisley|stripes|#151515|#f6f6f2
alaves|esp|Babazorros|Vitoria|stripes|#0057b8|#f6f6f2
athletic|esp|Lions|Bilbao|stripes|#ee2523|#f6f6f2
atletico|esp|Colchoneros|Madrid|stripes|#cb3524|#f6f6f2
barca|esp|Blaugrana|Barcelona|stripes|#a50044|#004d98
celta|esp|Celestes|Vigo|trim|#8ac3ee|#f6f6f2
elche|esp|Franjiverdes|Elche|trim|#f6f6f2|#05642c
espanyol|esp|Periquitos|Barcelona|stripes|#007fc8|#f6f6f2
getafe|esp|Azulones|Getafe|trim|#005999|#f6f6f2
girona|esp|Blanquivermells|Girona|stripes|#cd2534|#f6f6f2
levante|esp|Granotes|Valencia|stripes|#b4053f|#004d98
mallorca|esp|Bermellones|Mallorca|trim|#e20613|#151515
osasuna|esp|Rojillos|Pamplona|trim|#d91a21|#0a346f
rayo|esp|Franjirrojos|Madrid|sash|#f6f6f2|#e53027
betis|esp|Verdiblancos|Seville|stripes|#0bb363|#f6f6f2
realmadrid|esp|Los Blancos|Madrid|trim|#f6f6f2|#febe10
oviedo|esp|Carbayones|Oviedo|trim|#0057b8|#f6f6f2
realsociedad|esp|Txuri-urdin|San Sebastián|stripes|#0067b1|#f6f6f2
sevilla|esp|Nervionenses|Seville|trim|#f6f6f2|#d71920
valencia|esp|Los Che|Valencia|trim|#f6f6f2|#151515
villarreal|esp|Yellow Submarine|Villarreal|trim|#ffe667|#005187
atalanta|ita|La Dea|Bergamo|stripes|#1e71b8|#151515
bologna|ita|Rossoblù|Bologna|stripes|#a21c26|#1a2f48
cagliari|ita|Isolani|Sardinia|halves|#a8102e|#002350
como|ita|Lariani|Como|trim|#1c4f9c|#f6f6f2
cremonese|ita|Grigiorossi|Cremona|stripes|#8f8f8f|#d71920
fiorentina|ita|La Viola|Florence|trim|#482e92|#f6f6f2
genoa|ita|Grifone|Genoa|halves|#a50034|#002b5c
verona|ita|Gialloblù|Verona|trim|#002f6c|#fdd800
inter|ita|Nerazzurri|Milan|stripes|#0068a8|#151515
juve|ita|Bianconeri|Turin|stripes|#151515|#f6f6f2
lazio|ita|Biancocelesti|Rome|trim|#87d8f7|#f6f6f2
lecce|ita|Giallorossi|Lecce|stripes|#ffd700|#d71920
milan|ita|Rossoneri|Milan|stripes|#fb090b|#151515
napoli|ita|Partenopei|Naples|trim|#12a0d7|#f6f6f2
parma|ita|Crociati|Parma|trim|#f6f6f2|#151515
pisa|ita|Nerazzurri|Pisa|stripes|#0068a8|#151515
roma|ita|Lupi|Rome|trim|#8e1f2f|#f0bc42
sassuolo|ita|Neroverdi|Sassuolo|stripes|#00a752|#151515
torino|ita|Granata|Turin|trim|#8a1e03|#f6f6f2
udinese|ita|Zebrette|Udine|stripes|#151515|#f6f6f2
augsburg|ger|Fuggerstädter|Augsburg|trim|#ba3733|#f6f6f2
leverkusen|ger|Werkself|Leverkusen|trim|#e32221|#151515
bayern|ger|Die Roten|Munich|trim|#dc052d|#f6f6f2
dortmund|ger|Black and Yellows|Dortmund|trim|#fde100|#151515
gladbach|ger|Foals|Mönchengladbach|trim|#f6f6f2|#151515
frankfurt|ger|Eagles|Frankfurt|trim|#151515|#e1000f
freiburg|ger|Breisgau Brazilians|Freiburg|trim|#151515|#d71920
hamburg|ger|Dino|Hamburg|trim|#f6f6f2|#0a3f86
heidenheim|ger|Heidenheimers|Heidenheim|trim|#e30613|#003b79
hoffenheim|ger|Kraichgauer|Sinsheim|trim|#1961b5|#f6f6f2
koln|ger|Billy Goats|Cologne|trim|#f6f6f2|#ed1c24
mainz|ger|Carnival Club|Mainz|trim|#ed1c24|#f6f6f2
leipzig|ger|Rasenballer|Leipzig|trim|#f6f6f2|#dd0741
stpauli|ger|Kiezkicker|Hamburg|trim|#6b4c3b|#f6f6f2
stuttgart|ger|Die Schwaben|Stuttgart|trim|#f6f6f2|#e32219
union|ger|Iron Ones|Berlin|trim|#eb1923|#f6f6f2
werder|ger|Werderaner|Bremen|trim|#1d9053|#f6f6f2
wolfsburg|ger|Wolves|Wolfsburg|trim|#65b32e|#f6f6f2
angers|fra|Scoïstes|Angers|stripes|#151515|#f6f6f2
auxerre|fra|L'AJA|Auxerre|trim|#f6f6f2|#0047ab
brest|fra|Pirates|Brest|trim|#e30613|#f6f6f2
lehavre|fra|Ciel et Marine|Le Havre|halves|#87ceeb|#002f6c
lens|fra|Sang et Or|Lens|trim|#ffd700|#e30613
lille|fra|Dogues|Lille|trim|#e01e13|#0a2240
lorient|fra|Merlus|Lorient|trim|#f68712|#151515
lyon|fra|Gones|Lyon|trim|#f6f6f2|#0047ab
marseille|fra|Phocéens|Marseille|trim|#f6f6f2|#2faee0
metz|fra|Grenats|Metz|trim|#8b0020|#f6f6f2
monaco|fra|Monégasques|Monaco|sash|#f6f6f2|#e30613
nantes|fra|Canaris|Nantes|trim|#fcd405|#00843d
nice|fra|Aiglons|Nice|stripes|#d71920|#151515
parisfc|fra|Bleu et Blanc|Paris|trim|#002f6c|#f6f6f2
psg|fra|Rouge et Bleu|Paris|trim|#004170|#da291c
rennes|fra|Rouge et Noir|Rennes|halves|#e13327|#151515
strasbourg|fra|Racing|Strasbourg|trim|#009fe3|#f6f6f2
toulouse|fra|Violets|Toulouse|trim|#5b2c86|#f6f6f2
`.trim().split("\n").map((l) => { const [id, league, nick, place, s, a, b] = l.split("|"); return { id, league, nick, place, kit: [s, a, b] }; });

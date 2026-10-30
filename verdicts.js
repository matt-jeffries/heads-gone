// Full-time pundit lines, picked by the winning margin.
// Each entry is [line, scene]. The scene names a hand-drawn animation in scenes.js,
// optionally with a variant after the colon.
// {w} is the winner's name, {l} the loser's. Tiers: by 1, by 2-3, by 4-6, by 7+.
// "{ceefax}" is replaced with the scoreline written the Ceefax way, e.g. "Matt 9 (nine) Sam 1".
window.VERDICTS = {
  win: [
    [["Agueroooo!!!", "lastgasp:swing"], ["They've stolen it at the death!", "lastgasp:slide"], ["What a comeback!", "invasion"], ["The fans are on the pitch!", "invasion"], ["With the last flip of the game!", "lastgasp:slide"], ["Had to work very hard for that", "scramble"]],
    [["Wasn't pretty but they got the job done", "scrappy"], ["Had too much for them in the end", "tapin"], ["Won't live long in the memory", "scrappy"], ["Winning ugly is the sign of a good team", "scrappy"], ["Not much between the teams", "scrappy"], ["{l} will be kicking themselves", "scrappy:kick"]],
    [["A routine victory", "topbins"], ["They've put {l} to the sword", "rout"], ["Can't miss at the moment", "topbins:reps"], ["Made them look ordinary", "nutmeg"], ["The game was done by half-time", "tunnel"], ["Right in the postage stamp", "topbins:stamp"]],
    [["Stop, they're already dead", "dead"], ["Great, son's crying", "crying"], ["Running riot", "conga"], ["{ceefax}", "ceefax"], ["Olé, olé, oooo-olé", "ole"], ["Absolutely Yeboah-ed it", "volley"]],
  ],
  lose: [
    [["Heartbreak for {l}", "post"], ["Just needed one to go in off his backside", "post"], ["It'll take a while to get over that", "post"], ["Didn't have his shooting boots on", "miss"], ["Just lacked that bit of cutting edge", "miss"], ["Plenty of positives despite the defeat", "interview"]],
    [["Comfortable win for {w} in the end", "deckchair"], ["Bad day at the office", "office"], ["{w} didn't get out of second gear", "stroll"], ["Too little too late", "consolation"], ["Couldn't lay a glove on {w}", "boxing"], ["Never really got going", "stuck"]],
    [["Men against boys", "menboys"], ["You're in training tomorrow after that", "manager:training"], ["They just wanted the game to end", "whistle"], ["Not fit to lace {w}'s boots", "menboys:lace"], ["I'd give it Big Sam till the end of the season", "manager:sacked"], ["Lost the dressing room", "manager:dressing"]],
    [["Make them walk home", "walkhome"], ["I'd drive him to the airport myself", "airport"], ["Not fit to wear the shirt", "manager:shirt"], ["It can't carry on like this, can it?", "manager:despair"], ["Should refund the fans", "manager:refund"], ["Worse than David Dunn's rabona", "rabona"]],
  ],
  draw: [["Honours even", "draw"], ["Spoils shared", "draw"], ["Nothing to separate them", "draw"]],
};

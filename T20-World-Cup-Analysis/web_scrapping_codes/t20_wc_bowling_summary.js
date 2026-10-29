const { eachMatch, save } = require("./common");
eachMatch(async (d, id) => {
  const rows = [];
  for (const inn of d.content.innings) {
    for (const b of inn.inningBowlers || []) {
      rows.push({
        match_id: id, teamInnings: inn.team?.name, bowlerName: b.player.longName || b.player.name,
        overs: b.overs, maidens: b.maidens, runs: b.conceded, wickets: b.wickets, economy: b.economy,
      });
    }
  }
  return rows;
}).then((r) => save("t20_wc_bowling_summary", r));

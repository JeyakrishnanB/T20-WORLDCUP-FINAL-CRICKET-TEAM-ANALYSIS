const { eachMatch, save } = require("./common");
eachMatch(async (d, id) => {
  const m = d.match;
  return [{
    match_id: id, team1: m.teams?.[0]?.team?.name, team2: m.teams?.[1]?.team?.name,
    winner: m.teams?.find((t) => t.isWinner)?.team?.name || "No result",
    margin: m.statusText, stage: m.stage || m.series?.name || "", ground: m.ground?.name, date: m.startDate,
  }];
}).then((r) => save("t20_wc_match_results", r));

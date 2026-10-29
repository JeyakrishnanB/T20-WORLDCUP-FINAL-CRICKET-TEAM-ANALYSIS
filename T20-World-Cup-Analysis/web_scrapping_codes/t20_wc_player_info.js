const { eachMatch, save } = require("./common");
const seen = new Map();
eachMatch(async (d) => {
  for (const inn of d.content.innings) {
    for (const p of [...(inn.inningBatsmen || []).map((x) => x.player), ...(inn.inningBowlers || []).map((x) => x.player)]) {
      const name = p.longName || p.name;
      if (!seen.has(name)) seen.set(name, { playerName: name, team: inn.team?.name,
        battingStyle: (p.battingStyles || [""])[0], bowlingStyle: (p.bowlingStyles || [""])[0], playingRole: p.playingRole || "" });
    }
  }
  return [];
}).then(() => save("t20_wc_player_info", [...seen.values()]));

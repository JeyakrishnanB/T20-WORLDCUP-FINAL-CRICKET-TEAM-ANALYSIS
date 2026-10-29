const { eachMatch, save } = require("./common");
// NOTE: JSON paths follow Cricinfo's __NEXT_DATA__ layout at time of writing; inspect one scorecard and adjust if it changes.
eachMatch(async (d, id) => {
  const rows = [];
  for (const inn of d.content.innings) {
    for (const b of inn.inningBatsmen || []) {
      if (!b.battedType || b.battedType === "no") continue; // DNB
      rows.push({
        match_id: id, teamInnings: inn.team?.name, batsmanName: b.player.longName || b.player.name,
        battingPos: (inn.inningBatsmen.indexOf(b)) + 1, runs: b.runs, balls: b.balls,
        fours: b.fours, sixes: b.sixes, "out/not_out": b.isOut ? "out" : "not_out",
      });
    }
  }
  return rows;
}).then((r) => save("t20_wc_batting_summary", r));

"""Clean scraped T20 WC JSON, classify roles, pick Best XI.
Adjust column names to match your JSON keys."""
import json, pathlib
import pandas as pd

JSON_DIR = pathlib.Path("t20_json_files")
CSV_DIR = pathlib.Path("t20_csv_files"); CSV_DIR.mkdir(exist_ok=True)

def load(name):
    return pd.json_normalize(json.loads((JSON_DIR / f"{name}.json").read_text(encoding="utf-8")))

bat, bowl = load("t20_wc_batting_summary"), load("t20_wc_bowling_summary")
match, players = load("t20_wc_match_results"), load("t20_wc_player_info")

for df in (bat, bowl, match, players):
    df.columns = [c.strip() for c in df.columns]
    df.drop_duplicates(inplace=True)

for c in ["runs", "balls", "fours", "sixes", "battingPos"]:
    bat[c] = pd.to_numeric(bat[c], errors="coerce")        # DNB -> NaN
bat = bat.dropna(subset=["runs", "balls"])
for c in ["overs", "runs", "wickets", "economy"]:
    bowl[c] = pd.to_numeric(bowl[c], errors="coerce")

players.to_csv(CSV_DIR / "dim_players.csv", index=False)
match.to_csv(CSV_DIR / "dim_match_summary.csv", index=False)
bat.to_csv(CSV_DIR / "fact_batting_summary.csv", index=False)
bowl.to_csv(CSV_DIR / "fact_bowling_summary.csv", index=False)

# ---- batting aggregates
g = bat.groupby("batsmanName").agg(
    innings=("match_id", "count"), runs=("runs", "sum"), balls=("balls", "sum"),
    fours=("fours", "sum"), sixes=("sixes", "sum"), pos=("battingPos", "mean"),
    outs=("out/not_out", lambda s: (s == "out").sum()))
g["sr"] = g.runs / g.balls * 100
g["avg"] = g.runs / g.outs.replace(0, pd.NA)
g["boundary_pct"] = (g.fours * 4 + g.sixes * 6) / g.runs * 100
g = g[g.innings >= 4]

def role(r):
    if r.pos <= 3 and r.sr >= 140: return "Power Hitter"
    if 3 <= r.pos <= 5 and r.avg >= 35 and r.sr < 130: return "Anchor"
    if r.pos >= 5 and r.sr >= 140: return "Finisher"
    return "Other"
g["role"] = g.apply(role, axis=1)

# ---- composite score (min-max normalised)
norm = lambda s: (s - s.min()) / (s.max() - s.min())
g["score"] = 0.4 * norm(g.sr) + 0.3 * norm(g.avg.astype(float)) + 0.3 * norm(g.boundary_pct)

quota = {"Power Hitter": 2, "Anchor": 2, "Finisher": 2}
xi = pd.concat([g[g.role == r].nlargest(n, "score") for r, n in quota.items()])

# bowlers: wickets + economy
b = bowl.groupby("bowlerName").agg(wkts=("wickets", "sum"), eco=("economy", "mean"),
                                   overs=("overs", "sum"))
b = b[b.overs >= 10]
b["score"] = 0.6 * norm(b.wkts) + 0.4 * (1 - norm(b.eco))
best_bowlers = b.nlargest(5, "score")

xi.to_csv("best11_batters.csv"); best_bowlers.to_csv("best11_bowlers.csv")
print(xi[["role", "sr", "avg", "boundary_pct", "score"]].round(2))
print(best_bowlers.round(2))

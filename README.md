# T20 World Cup Cricket Analytics: Best XI Selection

End-to-end analytics project: scrape ESPN Cricinfo T20 World Cup data, clean it with Python/Pandas, model it as a star schema and build an interactive Power BI dashboard that classifies players by role and recommends an optimal playing XI.

## Dashboard pages
- **Player Analysis**: role tabs (Power Hitters/Openers, Anchors, Finishers, All Rounders, Specialist Fast Bowlers), Qualifier / Super 12 stage filters, player table with data bars, trend area charts vs. average line, and a Strike Rate vs. Batting Average bubble chart. Click players to see individual or combined strength.
- **Final 11**: the recommended XI built from the role shortlists.

## Tech stack
Node.js (scraping) · Python, Pandas (cleaning) · Power BI, DAX · CSV/JSON

## Project structure
```
web_scrapping_codes/   common.js + 4 Node scrapers (batting, bowling, match results, player info)
t20_json_files/        raw scraped JSON (generated)
t20_csv_files/         dim_match_summary, dim_players, fact_batting_summary, fact_bowling_summary (generated)
python/pipeline.py     JSON -> clean CSV -> role classification -> Best XI scoring
powerbi/DAX_measures.dax   all DAX measures and role column
docs/index.html        standalone interactive dashboard (GitHub Pages) - load the 4 CSVs in the page
```

## Data model (star schema)
- `dim_players` (playerName, team, battingStyle, bowlingStyle, playingRole)
- `dim_match_summary` (match_id, teams, winner, margin, stage: Qualifier / Super 12)
- `fact_batting_summary` (match_id, player, runs, balls, 4s, 6s, position, out/not out)
- `fact_bowling_summary` (match_id, player, overs, maidens, runs, wickets, economy)

## Pipeline
1. **Scrape**: JS scripts pull batting, bowling, match results and player info into JSON.
2. **Clean** (`python/pipeline.py`): flatten JSON, fix types, handle "DNB"/"absent hurt", remove duplicates, derive metrics.
3. **Model**: load the 4 CSVs into Power BI, relate facts to dims on match_id and player.
4. **Classify** players into roles using rule-based thresholds.
5. **Score and select** the XI per role with benchmarked metrics.

## Key metrics
| Metric | Formula |
|---|---|
| Strike rate | runs / balls x 100 |
| Batting average | runs / dismissals |
| Boundary % | (4s x 4 + 6s x 6) / runs x 100 |
| Economy | runs conceded / overs |

Sample DAX:
```DAX
Strike Rate = DIVIDE(SUM(fact_batting_summary[runs]), SUM(fact_batting_summary[balls])) * 100
Batting Avg = DIVIDE(SUM(fact_batting_summary[runs]), CALCULATE(COUNTROWS(fact_batting_summary), fact_batting_summary[out] = "out"))
Boundary % = DIVIDE(SUM(fact_batting_summary[fours])*4 + SUM(fact_batting_summary[sixes])*6, SUM(fact_batting_summary[runs])) * 100
```

## Role rules (editable in `pipeline.py`)
- **Power Hitter/Opener**: batting position 1-3, strike rate >= 140
- **Anchor**: position 3-5, average >= 35, strike rate < 130
- **Finisher**: position 5-7, strike rate >= 140
- **All-rounder**: meaningful runs and wickets
- **Specialist fast bowler**: bowling-only, pace

## Validation ("90% accuracy")
The selected XI is compared with the tournament's actual top performers / official Team of the Tournament; accuracy = players matched / 11. Document the reference list you use so the figure can be reproduced.

## How to run
```bash
pip install pandas
python python/pipeline.py        # reads t20_json_files, writes t20_csv_files + best11.csv
```
Open the `.pbix` in Power BI Desktop and refresh the CSV source path.

## Author
Jeyakrishnan B, github.com/JeyakrishnanB

## Run order
```bash
node web_scrapping_codes/t20_wc_batting_summary.js   # also bowling_summary, match_results, player_info
python python/pipeline.py
# then open docs/index.html (or the GitHub Pages link) and select the 4 CSVs from t20_csv_files/
```
> Scrapers are best-effort: Cricinfo's page JSON can change, so inspect one scorecard's `__NEXT_DATA__` and adjust field paths if a run returns empty rows. Respect the site's terms of use.

## Live demo
Enable GitHub Pages (Settings -> Pages -> `/docs`) to host the dashboard.

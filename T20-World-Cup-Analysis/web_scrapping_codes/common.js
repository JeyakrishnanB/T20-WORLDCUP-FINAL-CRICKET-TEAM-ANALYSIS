// Shared helpers. Requires Node 18+ (built-in fetch). Be polite: keep the delay, check ESPN Cricinfo's ToS/robots.txt.
const fs = require("fs");
const SERIES_URL = process.env.SERIES_URL ||
  "https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2022-23-1298134/match-schedule-fixtures-and-results";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (research project)" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
};
const nextData = (html) => JSON.parse(html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)[1]);
async function scorecardLinks() {
  const html = await get(SERIES_URL);
  const links = [...new Set([...html.matchAll(/href="(\/series\/[^"]+\/full-scorecard)"/g)].map((m) => "https://www.espncricinfo.com" + m[1]))];
  return links;
}
async function eachMatch(cb) {
  const links = await scorecardLinks();
  const out = [];
  for (let i = 0; i < links.length; i++) {
    try {
      const d = nextData(await get(links[i])).props.appPageProps.data;
      out.push(...(await cb(d, i + 1)));
    } catch (e) { console.error("skip", links[i], e.message); }
    await sleep(1500);
  }
  return out;
}
const save = (name, data) => {
  fs.mkdirSync("t20_json_files", { recursive: true });
  fs.writeFileSync(`t20_json_files/${name}.json`, JSON.stringify(data, null, 2));
  console.log(name, data.length, "rows");
};
module.exports = { eachMatch, save };

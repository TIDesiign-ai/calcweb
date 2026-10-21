const fs = require("node:fs");

const source = "calccalc/out";
const destination = "public/tools/calccalc";
const standaloneDestination =
  ".next/standalone/public/tools/calccalc";

if (!fs.existsSync(`${source}/index.html`)) {
  throw new Error(`静的ビルドが見つかりません: ${source}/index.html`);
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });

console.log("calccalc を public/tools/calccalc に配置しました");

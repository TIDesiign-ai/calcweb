import os, zipfile, textwrap, json
base='/mnt/data/grad-credit-simulator'
files={
'package.json': r'''{
  "name": "grad-credit-simulator",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "next": "15.5.6",
    "react": "19.1.1",
    "react-dom": "19.1.1"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.5.6",
    "typescript": "^5"
  }
}''',
'tsconfig.json': r'''{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}''',
'next.config.ts': r'''import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
''',
'eslint.config.mjs': r'''import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
''',
'.gitignore': r'''node_modules/
.next/
out/
build/
dist/
.env*
!.env.example
*.tsbuildinfo
next-env.d.ts
''',
'app/layout.tsx': r'''import type { Metadata } from "next";
import "./globals.css";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
''',
'app/page.tsx': r'''import CreditSimulator from "@/components/CreditSimulator";

export default function Home() {
  return <CreditSimulator />;
}
''',
'components/CreditSimulator.tsx': r'''"use client";

import { useMemo, useState } from "react";
import styles from "./CreditSimulator.module.css";

type RowKey = "requirement" | "earned" | "enrolled" | "planned";
type CreditRow = {
  key: RowKey;
  label: string;
  values: string[];
};
type ParsedTable = {
  headers: string[];
  rows: CreditRow[];
  sourceFormat: "markdown" | "tsv";
};

const SAMPLE = `| 分野区分 | 基礎数理 必修 | 基礎キャリア 必修 | 基礎科目 必修合計 | 基礎数理 選択 | 基礎現社 選択 | 基礎キャリア 選択 | 基礎アート 選択 | 基礎語学 選択 | 基礎科目 選択合計 | 基礎科目 合計 | 職業専門 必修 | 職業専門 選択 | 職業専門 コア科目 | 職業専門科目 合計 | 展開科目 必修 | 展開科目 選択 | 展開科目 合計 | 総合科目 | 卒業要件合計 | 総合計 |
| 卒業要件 | 4 | 6 | 10 | 2 | 2 |  | 2 | 2 | 10 | 20 | 55 | 25 | 4 | 84 | 16 | 4 | 20 | 6 | 130 |  |
| 修得単位 | 4 | 6 | 10 | 3 | 4 |  | 2 | 2 | 11 | 21 | 32 | 24 | 1 | 57 | 12 |  | 12 |  | 90 | 90 |
| 不足単位 |  |  |  |  |  |  |  |  |  |  | 23 | 1 | 3 | 27 | 4 | 4 | 8 | 6 | 41 |  |
| 履修単位 |  |  |  |  |  |  |  |  |  |  | 11 | 3 | 1 | 15 |  | 1 | 1 |  | 16 | 16 |`;

const ROW_LABELS: Array<{ key: RowKey; aliases: string[]; label: string }> = [
  { key: "requirement", aliases: ["卒業要件", "必要単位", "要件"], label: "卒業要件" },
  { key: "earned", aliases: ["修得単位", "取得単位", "修得済み"], label: "修得済み" },
  { key: "enrolled", aliases: ["履修単位", "履修中"], label: "履修中" },
  { key: "planned", aliases: ["履修予定", "予定単位"], label: "履修予定" },
];

function splitLine(line: string, format: ParsedTable["sourceFormat"]): string[] {
  if (format === "tsv") return line.split("\t").map((cell) => cell.trim());
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim().replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " "));
}

function isMarkdownSeparator(cells: string[]) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")));
}

function findRowKey(label: string): RowKey | null {
  const normalized = label.replace(/\s/g, "");
  return ROW_LABELS.find((row) => row.aliases.some((alias) => normalized.includes(alias)))?.key ?? null;
}

function parsePastedTable(input: string): ParsedTable | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const sourceFormat: ParsedTable["sourceFormat"] = lines.some((line) => line.includes("|"))
    ? "markdown"
    : "tsv";
  const tableLines = lines.filter((line) => sourceFormat === "tsv" || line.includes("|"));
  const matrix = tableLines.map((line) => splitLine(line, sourceFormat));
  const filtered = matrix.filter((cells) => !isMarkdownSeparator(cells));
  if (filtered.length < 2) return null;

  const headers = filtered[0].map((header, index) =>
    header || (index === 0 ? "分野区分" : `区分 ${index}`)
  );
  const rows: CreditRow[] = [];
  for (const cells of filtered.slice(1)) {
    const label = (cells[0] ?? "").replace(/\s/g, "");
    const rowDef = ROW_LABELS.find((row) => row.aliases.some((alias) => label.includes(alias)));
    if (!rowDef) continue;
    const values = headers.slice(1).map((_, index) => {
      const raw = (cells[index + 1] ?? "").replace(/[,\s単位]/g, "");
      return raw !== "" && Number.isFinite(Number(raw)) ? String(Number(raw)) : "";
    });
    rows.push({ key: rowDef.key, label: rowDef.label, values });
  }

  if (!rows.some((row) => row.key === "requirement")) return null;
  return { headers: headers.slice(1), rows, sourceFormat };
}

function valueAt(row: CreditRow | undefined, index: number): number {
  if (!row) return 0;
  const value = Number(row.values[index] ?? "");
  return Number.isFinite(value) ? value : 0;
}

export default function CreditSimulator() {
  const [source, setSource] = useState(SAMPLE);
  const [parsed, setParsed] = useState<ParsedTable | null>(() => parsePastedTable(SAMPLE));
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "details">("overview");
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const requirement = parsed?.rows.find((row) => row.key === "requirement");
  const earned = parsed?.rows.find((row) => row.key === "earned");
  const enrolled = parsed?.rows.find((row) => row.key === "enrolled");

  const summary = useMemo(() => {
    if (!parsed || !requirement) return { required: 0, earned: 0, enrolled: 0, remaining: 0 };
    const totalIndex = parsed.headers.findIndex((header) => /卒業要件合計|総合計|総単位|合計$/.test(header.replace(/\s/g, "")));
    const broadTotalIndex = parsed.headers.findIndex((header) => /卒業要件合計|総合計/.test(header.replace(/\s/g, "")));
    const index = broadTotalIndex >= 0 ? broadTotalIndex : totalIndex;
    const required = index >= 0 ? valueAt(requirement, index) : requirement.values.reduce((sum, val) => sum + (Number(val) || 0), 0);
    const earnedTotal = index >= 0 ? valueAt(earned, index) : earned?.values.reduce((sum, val) => sum + (Number(val) || 0), 0) ?? 0;
    const enrolledTotal = index >= 0 ? valueAt(enrolled, index) : enrolled?.values.reduce((sum, val) => sum + (Number(val) || 0), 0) ?? 0;
    return { required, earned: earnedTotal, enrolled: enrolledTotal, remaining: Math.max(0, required - earnedTotal - enrolledTotal) };
  }, [parsed, requirement, earned, enrolled]);

  function parseInput() {
    const result = parsePastedTable(source);
    if (!result) {
      setError("表を読み取れませんでした。見出し行と「卒業要件」の行が含まれているか確認してください。");
      setParsed(null);
      return;
    }
    setParsed(result);
    setOverrides({});
    setError("");
    setActiveTab("overview");
  }

  function setCell(rowKey: RowKey, index: number, value: string) {
    if (!parsed) return;
    const rowExists = parsed.rows.some((row) => row.key === rowKey);
    const rows = parsed.rows.map((row) =>
      row.key === rowKey
        ? { ...row, values: row.values.map((cell, i) => (i === index ? value : cell)) }
        : row
    );
    if (!rowExists) {
      const label = ROW_LABELS.find((row) => row.key === rowKey)?.label ?? rowKey;
      rows.push({ key: rowKey, label, values: parsed.headers.map((_, i) => (i === index ? value : "")) });
    }
    setParsed({ ...parsed, rows });
  }

  function exportJson() {
    if (!parsed) return;
    const blob = new Blob([JSON.stringify({ version: 1, ...parsed }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "graduation-credits.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importJson(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as ParsedTable;
        if (!Array.isArray(data.headers) || !Array.isArray(data.rows)) throw new Error("invalid");
        setParsed(data);
        setError("");
      } catch {
        setError("JSONを読み込めませんでした。このアプリで出力したJSONを選択してください。");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  const progress = summary.required > 0 ? Math.min(100, (summary.earned / summary.required) * 100) : 0;

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="#" aria-label="卒業単位シミュレーター ホーム">
          <span className={styles.brandIcon}>G</span>
          <span>Grad<span className={styles.brandAccent}>Path</span></span>
        </a>
        <span className={styles.topbarNote}>卒業単位シミュレーター</span>
      </header>

      <div className={styles.container}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>GRADUATION PLANNER</p>
            <h1>卒業までの道のりを、<br />ひと目でわかるように。</h1>
            <p className={styles.heroText}>卒業要件表を貼り付けるだけで、区分ごとの単位状況と不足単位を可視化します。</p>
          </div>
          <div className={styles.heroMark} aria-hidden="true">
            <div className={styles.heroCircle}><span>G</span></div>
            <span className={styles.heroDot} />
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.step}>STEP 01</p>
              <h2>卒業要件表を貼り付け</h2>
            </div>
            <span className={styles.pill}>Excel / Web / Markdown</span>
          </div>
          <p className={styles.muted}>表をコピーして貼り付けてください。サンプルデータを初期表示しています。</p>
          <textarea
            className={styles.pasteArea}
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="ここに卒業要件表を貼り付け..."
            spellCheck={false}
            aria-label="卒業要件表の貼り付け欄"
          />
          <div className={styles.actionRow}>
            <button className={styles.buttonPrimary} onClick={parseInput}>表を解析する <span aria-hidden="true">→</span></button>
            <button className={styles.buttonSecondary} onClick={() => setSource("")}>入力をクリア</button>
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </section>

        {parsed && (
          <>
            <section className={styles.metrics}>
              <article className={`${styles.metricCard} ${styles.metricMain}`}>
                <span className={styles.metricLabel}>卒業要件</span>
                <strong>{summary.required}<small> 単位</small></strong>
                <span className={styles.metricFoot}>修得状況の基準</span>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>修得済み</span>
                <strong>{summary.earned}<small> 単位</small></strong>
                <span className={styles.metricFoot}>卒業要件の {progress.toFixed(1)}%</span>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>履修中</span>
                <strong>{summary.enrolled}<small> 単位</small></strong>
                <span className={styles.metricFoot}>取得確定前の単位</span>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>履修中を含む不足</span>
                <strong>{summary.remaining}<small> 単位</small></strong>
                <span className={styles.metricFoot}>履修中をすべて修得した場合</span>
              </article>
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.step}>STEP 02</p>
                  <h2>単位取得状況</h2>
                </div>
                <div className={styles.tabs}>
                  <button className={activeTab === "overview" ? styles.tabActive : styles.tab} onClick={() => setActiveTab("overview")}>概要</button>
                  <button className={activeTab === "details" ? styles.tabActive : styles.tab} onClick={() => setActiveTab("details")}>データ確認・編集</button>
                </div>
              </div>

              {activeTab === "overview" ? (
                <div className={styles.overview}>
                  <div className={styles.progressHeader}>
                    <div><span className={styles.progressTitle}>卒業要件の修得率</span><p className={styles.muted}>修得済み単位 ÷ 卒業要件</p></div>
                    <strong>{progress.toFixed(1)}%</strong>
                  </div>
                  <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
                  <div className={styles.categoryList}>
                    {parsed.headers.map((header, index) => {
                      const req = valueAt(requirement, index);
                      const got = valueAt(earned, index);
                      const taking = valueAt(enrolled, index);
                      if (req <= 0 || /合計|総合計/.test(header.replace(/\s/g, ""))) return null;
                      const ratio = Math.min(100, (got / req) * 100);
                      return (
                        <div className={styles.categoryRow} key={`${header}-${index}`}>
                          <div className={styles.categoryTop}>
                            <span>{header}</span>
                            <span className={styles.categoryNumbers}><b>{got}</b> / {req} 単位{taking > 0 && <em> · 履修中 {taking}</em>}</span>
                          </div>
                          <div className={styles.miniTrack}><div className={styles.miniFill} style={{ width: `${ratio}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <p className={styles.muted}>空欄は未入力として扱います。数値は直接編集できます。変更した内容はこの画面の計算に反映されます。</p>
                  <table className={styles.dataTable}>
                    <thead><tr><th>区分</th>{parsed.headers.map((header, index) => <th key={`${header}-${index}`}>{header}</th>)}</tr></thead>
                    <tbody>
                      {ROW_LABELS.map((rowDef) => {
                        const row = parsed.rows.find((item) => item.key === rowDef.key);
                        return (
                          <tr key={rowDef.key}>
                            <th>{rowDef.label}</th>
                            {parsed.headers.map((_, index) => (
                              <td key={`${rowDef.key}-${index}`}>
                                <input
                                  className={styles.cellInput}
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={row?.values[index] ?? ""}
                                  onChange={(event) => setCell(rowDef.key, index, event.target.value)}
                                  aria-label={`${rowDef.label} ${parsed.headers[index]}`}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className={styles.actionRow}>
                    <button className={styles.buttonSecondary} onClick={exportJson}>JSONを書き出す ↓</button>
                    <label className={styles.buttonSecondary}>JSONを読み込む ↑<input type="file" accept="application/json,.json" onChange={importJson} hidden /></label>
                  </div>
                </div>
              )}
            </section>
            <footer className={styles.footer}>GradPath · 卒業要件の確認をサポートするシミュレーターです。正式な卒業判定は学校の規定を確認してください。</footer>
          </>
        )}
      </div>
    </main>
  );
}
''',
'components/CreditSimulator.module.css': r''':root {}
.page {
  min-height: 100vh;
  background: #f4f6f8;
  color: #182230;
}
.topbar {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 max(24px, calc((100vw - 1120px) / 2));
  background: rgba(255,255,255,.9);
  border-bottom: 1px solid #e6eaf0;
}
.brand { display: inline-flex; align-items: center; gap: 10px; color: #182230; text-decoration: none; font-size: 19px; font-weight: 800; letter-spacing: -.6px; }
.brandIcon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 11px; background: #2259d6; color: white; font-size: 18px; }
.brandAccent { color: #2259d6; }
.topbarNote { color: #788495; font-size: 12px; letter-spacing: .04em; }
.container { max-width: 1120px; margin: 0 auto; padding: 44px 24px 36px; }
.hero { display: flex; align-items: center; justify-content: space-between; min-height: 210px; padding: 20px 10px 38px; }
.eyebrow, .step { margin: 0 0 10px; color: #2259d6; font-size: 11px; font-weight: 800; letter-spacing: .13em; }
.hero h1 { margin: 0; font-size: clamp(30px, 4vw, 44px); line-height: 1.35; letter-spacing: -.055em; }
.heroText { max-width: 590px; margin: 15px 0 0; color: #697586; font-size: 14px; line-height: 1.9; }
.heroMark { position: relative; display: grid; place-items: center; width: 170px; height: 150px; margin-right: 36px; }
.heroCircle { display: grid; place-items: center; width: 118px; height: 118px; border: 1px solid #cdd9f8; border-radius: 38px; transform: rotate(-10deg); background: linear-gradient(145deg, #eaf0ff, #fff); box-shadow: 0 20px 50px #214c9d13; }
.heroCircle span { color: #2259d6; font-size: 56px; font-weight: 800; transform: rotate(10deg); }
.heroDot { position: absolute; right: 8px; top: 10px; width: 18px; height: 18px; border-radius: 50%; background: #7ad7b0; box-shadow: 0 0 0 8px #7ad7b026; }
.panel { padding: 27px; margin-bottom: 22px; border: 1px solid #e5eaf0; border-radius: 18px; background: #fff; box-shadow: 0 5px 24px #18223006; }
.sectionHeading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 10px; }
.sectionHeading h2 { margin: 0; font-size: 20px; letter-spacing: -.035em; }
.step { margin-bottom: 5px; font-size: 10px; }
.pill { padding: 8px 12px; border: 1px solid #e6eaf0; border-radius: 99px; color: #647184; font-size: 11px; white-space: nowrap; }
.muted { margin: 8px 0 14px; color: #7a8595; font-size: 12px; line-height: 1.7; }
.pasteArea { width: 100%; min-height: 210px; padding: 15px; border: 1px solid #dce3ec; border-radius: 12px; outline: none; resize: vertical; background: #fbfcfe; color: #344054; font: 12px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace; transition: border .15s, box-shadow .15s; }
.pasteArea:focus { border-color: #7ea0ef; box-shadow: 0 0 0 3px #2259d615; }
.actionRow { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 15px; }
.buttonPrimary, .buttonSecondary { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 42px; padding: 0 17px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 700; transition: transform .15s, background .15s; }
.buttonPrimary { border: 1px solid #2259d6; background: #2259d6; color: white; box-shadow: 0 4px 10px #2259d622; }
.buttonPrimary:hover { background: #1849bb; transform: translateY(-1px); }
.buttonSecondary { border: 1px solid #dfe5ed; background: #fff; color: #465365; }
.buttonSecondary:hover { background: #f6f8fb; }
.error { margin: 12px 0 0; color: #b42318; font-size: 12px; }
.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 22px; }
.metricCard { display: flex; flex-direction: column; min-height: 130px; padding: 19px; border: 1px solid #e5eaf0; border-radius: 16px; background: #fff; }
.metricMain { border-color: #d6e2ff; background: linear-gradient(145deg, #edf3ff, #fff); }
.metricLabel { color: #748094; font-size: 11px; font-weight: 600; }
.metricCard strong { margin: 12px 0 7px; color: #1c2d48; font-size: 30px; letter-spacing: -.05em; line-height: 1; }
.metricCard strong small { font-size: 12px; font-weight: 600; letter-spacing: 0; }
.metricFoot { margin-top: auto; color: #8a95a5; font-size: 10px; line-height: 1.5; }
.tabs { display: flex; padding: 4px; border-radius: 10px; background: #f2f4f7; }
.tab, .tabActive { padding: 8px 12px; border: 0; border-radius: 7px; background: transparent; color: #778294; cursor: pointer; font-size: 11px; font-weight: 700; white-space: nowrap; }
.tabActive { background: #fff; color: #2259d6; box-shadow: 0 1px 4px #18223012; }
.overview { padding-top: 17px; }
.progressHeader { display: flex; align-items: center; justify-content: space-between; gap: 15px; }
.progressTitle { font-size: 14px; font-weight: 750; }
.progressHeader p { margin-bottom: 10px; }
.progressHeader > strong { color: #2259d6; font-size: 26px; letter-spacing: -.04em; }
.progressTrack, .miniTrack { overflow: hidden; height: 9px; border-radius: 99px; background: #edf0f4; }
.progressFill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #2259d6, #4c83f1); transition: width .25s; }
.categoryList { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 23px 28px; margin-top: 29px; }
.categoryTop { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 9px; font-size: 12px; }
.categoryTop > span:first-child { color: #465365; font-weight: 650; }
.categoryNumbers { color: #788495; white-space: nowrap; font-size: 11px; }
.categoryNumbers b { color: #182230; font-size: 13px; }
.categoryNumbers em { color: #b7791f; font-style: normal; }
.miniTrack { height: 6px; }
.miniFill { height: 100%; border-radius: inherit; background: #5b84de; }
.tableWrap { margin-top: 16px; }
.tableWrap > .muted { margin-bottom: 15px; }
.dataTable { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 11px; }
.dataTable th, .dataTable td { min-width: 110px; padding: 10px; border-right: 1px solid #e9edf2; border-bottom: 1px solid #e9edf2; text-align: left; vertical-align: middle; }
.dataTable thead th { background: #f5f7fa; color: #526074; font-weight: 700; }
.dataTable tr > :first-child { position: sticky; left: 0; min-width: 100px; background: #fafbfd; font-weight: 700; }
.dataTable thead tr > :first-child { z-index: 1; background: #f0f3f7; }
.dataTable tr:first-child th { border-top: 1px solid #e9edf2; }
.dataTable tr > :first-child { border-left: 1px solid #e9edf2; }
.tableWrap { overflow-x: auto; }
.cellInput { width: 82px; padding: 7px; border: 1px solid #dfe5ed; border-radius: 7px; outline: none; color: #344054; background: #fff; font-size: 12px; }
.cellInput:focus { border-color: #7ea0ef; box-shadow: 0 0 0 2px #2259d615; }
.footer { padding: 10px 0 0; color: #9aa3b1; font-size: 10px; text-align: center; line-height: 1.8; }
@media (max-width: 800px) {
  .heroMark { margin-right: 0; transform: scale(.8); }
  .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .categoryList { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .topbar { height: 62px; padding: 0 17px; }
  .topbarNote { max-width: 125px; text-align: right; font-size: 10px; }
  .container { padding: 24px 14px 28px; }
  .hero { min-height: 0; padding: 20px 4px 27px; }
  .hero h1 { font-size: 29px; }
  .heroText { font-size: 12px; }
  .heroMark { display: none; }
  .panel { padding: 18px 14px; border-radius: 14px; }
  .sectionHeading { align-items: flex-start; flex-direction: column; gap: 12px; }
  .sectionHeading h2 { font-size: 18px; }
  .pill { font-size: 10px; }
  .pasteArea { min-height: 190px; }
  .metrics { gap: 9px; }
  .metricCard { min-height: 115px; padding: 14px; }
  .metricCard strong { font-size: 26px; }
  .tabs { width: 100%; }
  .tab, .tabActive { flex: 1; padding: 8px 6px; }
  .categoryTop { align-items: flex-start; }
}
''',
'app/globals.css': r'''* { box-sizing: border-box; }
html { min-height: 100%; }
body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", sans-serif; -webkit-font-smoothing: antialiased; }
button, textarea, input { font: inherit; }
button:focus-visible, input:focus-visible, textarea:focus-visible, a:focus-visible { outline: 3px solid #9ab5ff; outline-offset: 2px; }
::selection { background: #dce7ff; color: #182230; }
''',
'README.md': r'''# 卒業単位シミュレーター

Next.js + TypeScript で作った初期プロトタイプです。

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## 現在の機能

- 卒業要件表（Markdown / タブ区切り）の貼り付け
- 「卒業要件」「修得単位」「履修単位」行の簡易解析
- 総単位数・進捗率・区分別プログレスバーの表示
- 解析データのプレビュー・数値編集
- JSONのエクスポート・インポート

## 注意点

これは初期試作です。大学ごとに異なる必修条件や区分間の算入ルールをまだ完全には扱っていません。
表示される卒業見込みは参考値であり、正式な卒業判定ではありません。
'''
}
for path, content in files.items():
    full=os.path.join(base,path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full,'w',encoding='utf-8') as f: f.write(content)
zip_path='/mnt/data/grad-credit-simulator.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as z:
    for path in files:
        z.write(os.path.join(base,path), arcname=f'grad-credit-simulator/{path}')
print(zip_path, len(files))

"use client";

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

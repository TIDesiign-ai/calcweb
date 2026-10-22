"use client";

import { useMemo, useState } from "react";

type Course = {
  category: string;
  name: string;
  teacher?: string;
  exam: string;
  score: string;
  grade: string;
  credits: number;
  year?: string;
};
type Dataset = { recent: Course[]; earned: Course[] };
type ViewKind = "recent" | "earned";

function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\u00a0/g, " ").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function cell(row: HTMLTableRowElement, index: number): string {
  return clean(row.cells[index]?.textContent);
}

function parseCourseTable(table: HTMLTableElement | null, kind: ViewKind): Course[] {
  if (!table) return [];
  const rows = Array.from(table.querySelectorAll("tr"));
  const courses: Course[] = [];
  for (const row of rows.slice(1)) {
    const cells = Array.from(row.cells);
    if (cells.length < 6) continue;
    const name = cell(row, 1);
    const category = cell(row, 0).replace(/^《|》$/g, "").trim();
    if (!name || !category) continue;
    // tblchokingakki columns: category, name, exam, score, grade, credits
    // tblShutoku columns: category, name, teacher, exam, score, grade, credits, year
    const creditsIndex = kind === "recent" ? 5 : 6;
    const credits = Number(cell(row, creditsIndex));
    if (!Number.isFinite(credits)) continue;
    courses.push({
      category,
      name,
      ...(kind === "earned" ? { teacher: cell(row, 2) } : {}),
      exam: cell(row, kind === "recent" ? 2 : 3),
      score: cell(row, kind === "recent" ? 3 : 4),
      grade: cell(row, kind === "recent" ? 4 : 5),
      credits,
      ...(kind === "earned" ? { year: cell(row, 7) } : {}),
    });
  }
  return courses;
}

function parseGradeHtml(source: string): Dataset {
  const doc = new DOMParser().parseFromString(source, "text/html");
  const recentTable = doc.querySelector<HTMLTableElement>("#tblchokingakki");
  const earnedTable = doc.querySelector<HTMLTableElement>("#tblShutoku");
  return {
    recent: parseCourseTable(recentTable, "recent"),
    earned: parseCourseTable(earnedTable, "earned"),
  };
}

const buttonStyle: React.CSSProperties = {
  border: "1px solid #d6deeb", borderRadius: 10, padding: "10px 14px", background: "#fff",
  color: "#26344d", fontWeight: 650, cursor: "pointer",
};

export default function GradesPage() {
  const [data, setData] = useState<Dataset>({ recent: [], earned: [] });
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [view, setView] = useState<ViewKind>("earned");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  async function importFile(file?: File) {
    if (!file) return;
    setFileName(file.name);
    setMessage("");
    try {
      const source = await file.text();
      if (!/<html[\s>]|<table[\s>]|<!doctype\s+html/i.test(source)) {
        setMessage("HTMLファイルとして認識できませんでした。.html / .htm ファイルを選択してください。");
        return;
      }
      const parsed = parseGradeHtml(source);
      if (parsed.recent.length === 0 && parsed.earned.length === 0) {
        setMessage("tblchokingakki / tblShutoku が見つかりませんでした。成績表の詳細テーブルを含むHTMLを選択してください。");
        return;
      }
      setData(parsed);
      setCategoryFilter("all");
      setQuery("");
      setMessage(`読み込み完了：直近の履修結果 ${parsed.recent.length}件、修得成績 ${parsed.earned.length}件を取り込みました。`);
    } catch {
      setMessage("ファイルを読み込めませんでした。HTMLファイルを確認してください。");
    }
  }

  const allRows = view === "recent" ? data.recent : data.earned;
  const categories = useMemo(() => Array.from(new Set(allRows.map((row) => row.category))).sort((a, b) => a.localeCompare(b, "ja")), [allRows]);
  const filteredRows = allRows.filter((row) =>
    (categoryFilter === "all" || row.category === categoryFilter) &&
    `${row.name} ${row.category} ${row.teacher ?? ""} ${row.grade} ${row.year ?? ""}`.toLowerCase().includes(query.toLowerCase().trim()),
  );
  const grouped = useMemo(() => {
    const map = new Map<string, Course[]>();
    for (const row of filteredRows) {
      if (!map.has(row.category)) map.set(row.category, []);
      map.get(row.category)!.push(row);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "ja"));
  }, [filteredRows]);
  const totalCredits = filteredRows.reduce((sum, row) => sum + row.credits, 0);

  return (
    <main style={{ minHeight: "100vh", background: "#f4f6fb", color: "#172033", fontFamily: "Arial, 'Noto Sans JP', sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e3e8f0", padding: "18px max(4%, calc((100% - 1180px) / 2))", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ fontSize: 20, fontWeight: 800, color: "#172033", textDecoration: "none" }}>成績表<span style={{ color: "#3563e9" }}>DI</span></a>
        <span style={{ fontSize: 12, color: "#758198" }}>科目別成績ビューア</span>
      </header>
      <div style={{ width: "min(1180px, 94%)", margin: "0 auto", padding: "30px 0 48px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "#3563e9", fontSize: 11, fontWeight: 800, letterSpacing: 2 }}>COURSE RECORDS</div>
          <h1 style={{ fontSize: "clamp(27px, 4vw, 38px)", margin: "8px 0", lineHeight: 1.3 }}>科目別の成績一覧</h1>
          <p style={{ color: "#718096", fontSize: 14, lineHeight: 1.8, margin: 0 }}>成績表HTMLに含まれる「直近の学期の履修結果」と「修得成績」を抽出し、分野カテゴリー別に整理します。ファイルはブラウザ内で解析され、サーバーには送信されません。</p>
        </div>

        <section style={{ background: "#fff", border: "1px solid #dbe4f4", borderRadius: 16, padding: 18, marginBottom: 18 }}>
          <h2 style={{ fontSize: 17, margin: "0 0 10px" }}>成績表HTMLを読み込む</h2>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <label style={{ ...buttonStyle, display: "inline-flex", alignItems: "center", gap: 8 }}>
              HTMLファイルを選択
              <input
                type="file"
                accept=".html,.htm,.mht,.mhtml,text/html,application/x-mimearchive,message/rfc822"
                onChange={(event) => {
                  void importFile(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
                style={{ display: "none" }}
              />
            </label>
            <span style={{ color: "#718096", fontSize: 12 }}>{fileName || ".html / .htm"}</span>
          </div>
          {message && <p role="status" style={{ color: message.startsWith("読み込み完了") ? "#167447" : "#b45309", fontSize: 13, lineHeight: 1.7, margin: "12px 0 0" }}>{message}</p>}
        </section>

        <section style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <button onClick={() => { setView("earned"); setCategoryFilter("all"); }} style={{ ...buttonStyle, background: view === "earned" ? "#3563e9" : "#fff", color: view === "earned" ? "#fff" : "#26344d", borderColor: view === "earned" ? "#3563e9" : "#d6deeb" }}>修得成績（{data.earned.length}）</button>
          <button onClick={() => { setView("recent"); setCategoryFilter("all"); }} style={{ ...buttonStyle, background: view === "recent" ? "#3563e9" : "#fff", color: view === "recent" ? "#fff" : "#26344d", borderColor: view === "recent" ? "#3563e9" : "#d6deeb" }}>直近の履修結果（{data.recent.length}）</button>
        </section>

        <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <input aria-label="科目を検索" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="科目名・分野・評価で検索" style={{ flex: "1 1 240px", minWidth: 0, padding: "10px 12px", border: "1px solid #d5deec", borderRadius: 9, fontSize: 13 }} />
            <select aria-label="カテゴリーで絞り込み" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} style={{ flex: "0 1 240px", padding: "10px 12px", border: "1px solid #d5deec", borderRadius: 9, background: "#fff", color: "#26344d", fontSize: 13 }}>
              <option value="all">すべてのカテゴリー</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <div style={{ fontSize: 12, color: "#718096", whiteSpace: "nowrap" }}>{filteredRows.length}科目 / {totalCredits}単位</div>
          </div>

          {grouped.length === 0 ? (
            <div style={{ textAlign: "center", padding: "44px 12px", color: "#718096", fontSize: 13, lineHeight: 1.8 }}>
              {data.recent.length === 0 && data.earned.length === 0 ? "成績表HTMLを読み込むと、カテゴリー別に科目が表示されます。" : "条件に一致する科目がありません。検索条件を変更してください。"}
            </div>
          ) : grouped.map(([category, courses]) => (
            <section key={category} style={{ marginBottom: 22, border: "1px solid #e5eaf3", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ background: "#f2f5fc", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <h2 style={{ fontSize: 15, margin: 0 }}>{category}</h2>
                <span style={{ fontSize: 12, color: "#718096", whiteSpace: "nowrap" }}>{courses.length}科目・{courses.reduce((sum, row) => sum + row.credits, 0)}単位</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: view === "earned" ? 760 : 620, borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr>{["科目名称", ...(view === "earned" ? ["教員"] : []), "試験区分", "素点", "評価", "単位", ...(view === "earned" ? ["修得年度"] : [])].map((label) => <th key={label} style={{ background: "#fbfcfe", color: "#59667c", textAlign: label === "素点" || label === "評価" || label === "単位" ? "center" : "left", padding: "10px 12px", borderBottom: "1px solid #e5eaf3", whiteSpace: "nowrap", fontWeight: 650 }}>{label}</th>)}</tr></thead>
                  <tbody>{courses.map((course, index) => <tr key={`${course.name}-${course.year ?? "recent"}-${index}`}>
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #edf0f5", fontWeight: 600 }}>{course.name}</td>
                    {view === "earned" && <td style={{ padding: "11px 12px", borderBottom: "1px solid #edf0f5", whiteSpace: "nowrap", color: "#59667c" }}>{course.teacher || "—"}</td>}
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #edf0f5", whiteSpace: "nowrap" }}>{course.exam || "—"}</td>
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #edf0f5", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{course.score || "—"}</td>
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #edf0f5", textAlign: "center" }}><span style={{ display: "inline-block", minWidth: 28, padding: "4px 6px", borderRadius: 6, background: course.grade === "S" || course.grade === "A" ? "#e7f7ee" : course.grade === "B" ? "#eaf0ff" : "#f3f4f6", color: course.grade === "S" || course.grade === "A" ? "#167447" : "#364152", fontWeight: 750 }}>{course.grade || "—"}</span></td>
                    <td style={{ padding: "11px 12px", borderBottom: "1px solid #edf0f5", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{course.credits}</td>
                    {view === "earned" && <td style={{ padding: "11px 12px", borderBottom: "1px solid #edf0f5", whiteSpace: "nowrap", color: "#59667c" }}>{course.year || "—"}</td>}
                  </tr>)}</tbody>
                </table>
              </div>
            </section>
          ))}
        </section>
        <footer style={{ textAlign: "center", color: "#8993a3", fontSize: 11, lineHeight: 1.8 }}>成績表DI — 科目情報は読み込んだHTMLファイルからブラウザ内で解析しています。<br />正式な成績・単位情報は学校のシステムで確認してください。</footer>
      </div>
    </main>
  );
}

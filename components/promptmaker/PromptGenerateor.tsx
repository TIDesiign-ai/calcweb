"use client";
import tagData from "../../data/lib/promptmaker/tags.json";
import promptData from "../../data/lib/promptmaker/prompts.json";

import { useMemo, useState } from "react";

import type { Grade } from "../../data/lib/grade-theme";
import type { Semester } from "../../data/lib/course-selector";

type CourseModelId =
  | "SEコース"
  | "IoTコース"
  | "DSコース"
  | "CSコース"
  | "CGコース"
  | "DEコース";

  type PromptGeneratorProps = {
    grade: Grade;
    semester: Semester;
    course: CourseModelId | null;
    onGradeChangeAction: (grade: Grade) => void;
    onSemesterChangeAction: (semester: Semester) => void;
    onCourseChangeAction: (course: CourseModelId) => void;
    onGeneratePromptAction: () => void;
  };

type Tag = {
  id: string;
  label: string;
};

type TagCategory = {
  id: string;
  label: string;
  tags: Tag[];
};

const TAG_CATEGORIES = tagData.categories as TagCategory[];

export default function PromptGenerator({
  grade,
  semester,
  course,
  onGradeChangeAction,
  onSemesterChangeAction,
  onCourseChangeAction,
  onGeneratePromptAction,
}: PromptGeneratorProps) {
  const [search, setSearch] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const filterTags = (tags: Tag[]) =>
    tags.filter((tag) =>
      tag.label.toLowerCase().includes(search.trim().toLowerCase())
    );

  const toggleTag = (
    tagId: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId]
    );
  };

  const getSelectedLabels = (ids: string[]) =>
    TAG_CATEGORIES.flatMap((category) => category.tags)
      .filter((tag) => ids.includes(tag.id))
      .map((tag) => tag.label);

  const generatePrompt = () => {
    const interests = getSelectedLabels(selectedInterests);
    const styles = getSelectedLabels(selectedStyles);

    setPrompt(`あなたは大学の履修選択を支援する専門アドバイザーです。

    ## ユーザーの履修条件
    - 学年：${grade}年
    - 学期：${semester}
    - 履修コース：${course ?? "未選択"}

    ## ユーザーの興味・関心
    ${interests.length ? interests.join("、") : "特に指定なし"}

    ## この学期の過ごし方
    ${styles.length ? styles.join("、") : "特に指定なし"}

    ## 提供資料
    以下の2つのPDF資料が添付されます。必ず両方を確認し、相互に照合したうえで分析してください。

    ### 1. シラバスPDF
    - 授業の内容、到達目標、学習内容、評価方法、課題、必要な知識などを確認する。
    - ユーザーの興味・関心や目標との適合度を評価する。
    - 課題や評価方法から、授業の負担を判断する。
    - 資料から判断できない情報は推測しない。

    ### 2. 開講時間割PDF
    - 授業の開講曜日、時限、学期、対象学年、履修条件など、資料に記載された情報を確認する。
    - シラバスに記載された授業と照合し、実際の開講情報を確認する。
    - 曜日・時限が重複する授業を同時に履修候補として提案しない。
    - 開講情報が確認できない授業は、確定候補として扱わない。

    ## 依頼内容
    2つのPDFを照合し、ユーザーの履修条件と希望に合ったおすすめ授業をランキング形式で提案してください。

    単に授業内容が魅力的なものを選ぶのではなく、開講情報と時間割の整合性を確認し、現実的に履修を組める候補を提案してください。

    ## 分析手順

    1. シラバスPDFから授業名、授業内容、評価方法、課題、到達目標などを抽出する。
    2. 開講時間割PDFから授業名、曜日、時限、開講学期、対象学年、履修条件などを抽出する。
    3. 両資料の授業名を照合する。表記揺れや名称の類似だけで同一授業と断定せず、不確かな場合は要確認とする。
    4. ユーザーの学年・学期・履修コースに合う授業を優先する。
    5. 同じ曜日・時限に重なる授業を同時に履修する提案を避ける。
    6. 興味・関心、学期の過ごし方、専門性の向上、課題負担などを考慮してランキングを作成する。
    7. 資料だけでは確認できない条件や、追加確認が必要な事項を整理する。
    8. 最終的な推薦候補について、曜日・時限の重複がないことを確認する。
    9. 分析結果を指定されたJSONスキーマに変換する。

    ## 評価基準

    - 興味・関心との適合度
    - 学期の過ごし方や目標との相性
    - スキル習得や専門性を深めるうえでの有用性
    - シラバスから判断できる課題負担や評価方法
    - 履修条件との適合性
    - 開講曜日・時限の確認状況
    - おすすめする具体的な理由

    ## JSON出力の厳守ルール

    最終的な分析結果は、以下に定義するJSONスキーマに必ず従って出力してください。

    ### 基本ルール

    - 出力はJSONオブジェクトのみとする。
    - Markdownのコードブロック（\`\`\`json）で囲まない。
    - JSONの前後に挨拶、解説、補足などの文章を付けない。
    - 指定されたキー名を変更しない。
    - 指定されたデータ型を変更しない。
    - 指定されたキーを省略しない。
    - 定義されていない独自のキーを追加しない。
    - 文字列は必ずダブルクォーテーションで囲む。
    - JSONの末尾に余分なカンマを付けない。
    - コメントやJSON以外の構文を含めない。
    - 数値は文字列に変換せず、数値型で出力する。
    - 不明な値は指定された場合に限りnullを使用する。
    - 配列に該当するデータがない場合は空配列[]を出力する。

    ### 情報が不明な場合

    - 資料から確認できない情報は推測しない。
    - 不明な文字列はnullとする。
    - 不明な曜日はnullとする。
    - 不明な時限はnullとする。
    - 確認が必要な事項はconfirmation_itemsに記録する。
    - 不明な情報を理由にキー自体を削除してはならない。
    - 授業名自体を確認できない場合は、無理に授業を特定しない。

    ### JSONスキーマ

    必ず以下と同じ構造で出力してください。

    {
      "ranking": [
        {
          "rank": 1,
          "course_name": "授業名",
          "day": "月",
          "period": 1,
          "reason": "おすすめ理由",
          "interest_match": "高",
          "workload": "課題負担や注意点",
          "verification_status": "confirmed"
        }
      ],
      "timetable": [
        {
          "day": "月",
          "period": 1,
          "course_name": "授業名"
        }
      ],
      "excluded_courses": [
        {
          "course_name": "授業名",
          "reason": "除外理由",
          "category": "schedule_conflict"
        }
      ],
      "confirmation_items": [
        {
          "item": "確認事項",
          "reason": "確認が必要な理由"
        }
      ],
      "summary": {
        "recommendation": "総合的なおすすめ",
        "next_steps": [
          "次に検討すべきこと"
        ]
      }
    }

    ### 各フィールドの定義

    #### ranking

    おすすめ授業のランキングを格納する配列。

    - rank：順位を表す整数。
    - course_name：授業名。
    - day：開講曜日。
    - period：開講時限を表す整数。
    - reason：おすすめする具体的な理由。
    - interest_match：興味・関心との適合度。
    - workload：課題負担、評価方法、注意点など。
    - verification_status：資料との照合状況。

    #### timetable

    おすすめ授業を曜日・時限ごとに整理する配列。

    - day：開講曜日。
    - period：開講時限。
    - course_name：授業名。

    rankingに含まれる授業のうち、曜日・時限を確認できた授業のみを登録してください。

    #### excluded_courses

    推薦対象から除外した授業とその理由を格納する配列。

    - course_name：授業名。
    - reason：除外した具体的な理由。
    - category：除外理由の分類。

    #### confirmation_items

    履修前に追加確認が必要な事項を格納する配列。

    - item：確認すべき内容。
    - reason：確認が必要な理由。

    #### summary

    分析全体のまとめ。

    - recommendation：総合的なおすすめ。
    - next_steps：次に検討すべきことを格納する文字列配列。

    ### 使用可能な値

    day：
    - 月
    - 火
    - 水
    - 木
    - 金
    - 土
    - 日
    - 不明な場合はnull

    period：
    - 1〜5の整数
    - 不明な場合はnull

    interest_match：
    - "高"
    - "中"
    - "低"
    - "不明"

    verification_status：
    - "confirmed"
    - "needs_confirmation"
    - "unconfirmed"

    excluded_courses.category：
    - "schedule_conflict"：曜日・時限の重複
    - "grade_mismatch"：対象学年の不一致
    - "semester_mismatch"：開講学期の不一致
    - "course_mismatch"：履修コースの不一致
    - "prerequisite_mismatch"：前提条件の不一致
    - "unavailable_information"：開講情報を確認できない
    - "other"：その他

    ### データ整合性ルール

    1. rankingにはおすすめ順位を付けた授業のみを含める。
    2. rankは1から始まる連番とする。
    3. timetableにはrankingに含まれる授業のうち、曜日・時限を確認できたもののみを含める。
    4. timetable内で同一曜日・時限に複数授業を配置してはならない。
    5. 開講情報を確認できない授業は、確定した時間割に含めない。
    6. verification_statusが"needs_confirmation"または"unconfirmed"の授業は、確定候補として扱わない。
    7. excluded_coursesには、推薦対象から除外した授業と理由を記録する。
    8. confirmation_itemsには、履修登録前に追加確認が必要な事項を記録する。
    9. 該当するデータがない場合も、配列は省略せず空配列[]とする。
    10. rankingとtimetableの授業名は一致させる。
    11. rankingの曜日・時限とtimetableの曜日・時限は一致させる。
    12. timetableに含まれる授業同士の曜日・時限の重複を認めない。
    13. 資料上で曜日・時限が不明な授業を、推測によってtimetableに追加しない。
    14. 時間割に重複がないことと、正式な履修登録が認められることは区別する。

    ## 厳守事項

    - 2つのPDFを両方確認してから提案する。
    - 資料に記載されていない曜日・時限、開講状況、履修条件、課題負担などを捏造しない。
    - シラバスと開講時間割の記載が矛盾する場合は、その旨を明示する。
    - PDFの文字や表を正確に読み取れない場合は、推測で補わず要確認とする。
    - 時間割の重複がないことと、履修登録が正式に認められることは区別する。
    - 履修条件や開講情報を確認できない授業は、確定候補とせず「要確認」とする。
    - 候補が少ない場合でも、条件に合わない授業を無理に推薦しない。
    - JSONの構造を独自に変更しない。
    - JSONスキーマに定義されていない情報を出力する必要がある場合は、既存のreason、workload、confirmation_itemsなど適切なフィールドに記述する。

    ## 最終出力前の検証

    出力する直前に、必ず以下を内部確認してください。

    1. JSONとして正しくパースできること。
    2. すべての必須キーが存在すること。
    3. すべての値が指定されたデータ型と一致していること。
    4. 使用可能な値の制約を守っていること。
    5. 曜日・時限の重複がないこと。
    6. rankingとtimetableの内容が整合していること。
    7. シラバスと開講時間割の照合結果に矛盾がないこと。
    8. 資料に存在しない情報を補完していないこと。
    9. JSON以外の文章やMarkdownが混入していないこと。

    検証に失敗した場合は、出力前に修正してください。

    以上の条件に従い、根拠のある履修提案を行ってください。`);

    setCopied(false);
    onGeneratePromptAction();
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="prompt-generator">
      <header className="prompt-generator__header">
        <h2>AI履修プロンプト生成</h2>
        <p>
          興味や学期の過ごし方に合ったタグを選択し、
          AIに履修相談するためのプロンプトを作成します。
        </p>
        <p>
          実際に用いる際は必ずTIDの公式シラバス.pdfと時間割表をAIに渡してください。
        </p>
      </header>

      <section className="prompt-generator__panel">
        <div className="prompt-generator__course-settings">
          <span className="prompt-generator__settings-label">
            現在の履修条件
          </span>

          <div className="prompt-generator__course-settings-fields">
            <label>
              <span>学年</span>
              <select
                value={grade}
                onChange={(e) =>
                  onGradeChangeAction(Number(e.target.value) as Grade)
                }
              >
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>
                    {value}年
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>学期</span>
              <select
                value={semester}
                onChange={(e) =>
                  onSemesterChangeAction(e.target.value as Semester)
                }
              >
                <option value="前期">前期</option>
                <option value="後期">後期</option>
              </select>
            </label>

            <label>
              <span>履修コース</span>
              <select
                value={course ?? ""}
                onChange={(e) =>
                  onCourseChangeAction(e.target.value as CourseModelId)
                }
              >
                {["SEコース", "IoTコース", "DSコース", "CSコース", "CGコース", "DEコース"].map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>
        </div>
        <h3>興味・学期の過ごし方(タグ検索)</h3>
{/*
        <input
          className="prompt-generator__search"
          type="search"
          placeholder="タグを検索..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="タグを検索"
        />
        */}
        {TAG_CATEGORIES.map((category) => {
          const selected =
            category.id === "interests"
              ? selectedInterests
              : selectedStyles;

          const setSelected =
            category.id === "interests"
              ? setSelectedInterests
              : setSelectedStyles;

          const filtered = filterTags(category.tags);

          return (
            <div key={category.id} className="prompt-generator__category">
              <h4>{category.label}</h4>

              <div className="prompt-generator__tags">
                {filtered.map((tag) => {
                  const active = selected.includes(tag.id);

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`prompt-generator__tag ${
                        active ? "is-selected" : ""
                      }`}
                      aria-pressed={active}
                      onClick={() =>
                        toggleTag(tag.id, selected, setSelected)
                      }
                    >
                      {active ? "✓ " : ""}
                      {tag.label}
                    </button>
                  );
                })}

                {filtered.length === 0 && (
                  <p className="prompt-generator__empty">
                    該当するタグがありません。
                  </p>
                )}
              </div>

              <p className="prompt-generator__selected">
                選択中：{selected.length} 件
                {selected.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                  >
                    解除
                  </button>
                )}
              </p>
            </div>
          );
        })}

        <button
          type="button"
          className="prompt-generator__generate"
          onClick={generatePrompt}
        >
          プロンプトを生成
        </button>
      </section>

      <section className="prompt-generator__panel">
        <div className="prompt-generator__output-header">
          <h3>プロンプト出力</h3>

          <button
            type="button"
            className="prompt-generator__copy"
            onClick={copyPrompt}
            disabled={!prompt}
          >
            {copied ? "コピーしました ✓" : "コピー"}
          </button>
        </div>

        <textarea
          className="prompt-generator__output"
          value={prompt}
          onChange={(event) => {
            setPrompt(event.target.value);
            setCopied(false);
          }}
          placeholder="タグを選択して「プロンプトを生成」を押すと、ここに表示されます。生成後は自由に編集できます。"
          rows={16}
          aria-label="生成されたプロンプト"
        />
        <h2>お試しあれ！！(TIDPortal内ファイルモジュール 履修関連→シラバス→のファイルをAIに渡してください)</h2>
        <div className="prompt-generator__ai-buttons">
          <button
            type="button"
            onClick={() => window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer")}
          >
            ChatGPT →
          </button>

          <button
            type="button"
            onClick={() => window.open("https://gemini.google.com/", "_blank", "noopener,noreferrer")}
          >
            Gemini →
          </button>

          <button
            type="button"
            onClick={() => window.open("https://claude.ai/", "_blank", "noopener,noreferrer")}
          >
            Claude →
          </button>
        </div>
      </section>
    </section>
  );
}

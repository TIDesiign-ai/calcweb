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

    1. シラバスPDF
       - 授業の内容、到達目標、学習内容、評価方法、課題、必要な知識などを確認する。
       - ユーザーの興味・関心や目標との適合度を評価する。

    2. 開講時間割PDF
       - 授業の開講曜日、時限、学期、対象学年、履修条件など、資料に記載された情報を確認する。
       - シラバスに記載された授業と照合し、実際の開講情報を確認する。
       - 曜日・時限が重複する授業を同時に履修候補として提案しない。

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

    ## 評価基準
    - 興味・関心との適合度
    - 学期の過ごし方や目標との相性
    - スキル習得や専門性を深めるうえでの有用性
    - シラバスから判断できる課題負担や評価方法
    - 履修条件との適合性
    - 開講曜日・時限の確認状況
    - おすすめする具体的な理由

    ## 出力形式
    1. おすすめ授業ランキング
       - 順位
       - 授業名
       - 開講曜日・時限
       - おすすめ理由
       - 興味・関心との適合度
       - 課題負担や注意点
    2. 履修候補の時間割
       - おすすめ授業を曜日・時限ごとに整理する。
       - 同じ曜日・時限に重複する授業を含めない。
    3. 候補から除外した授業とその理由
       - 時間割の重複
       - 学年・学期・履修条件の不一致
       - 開講情報を確認できない
       - その他の理由
    4. 履修前に確認すべき事項
    5. 総合的なおすすめと、次に検討すべきこと

    ## 厳守事項
    - 2つのPDFを両方確認してから提案する。
    - 資料に記載されていない曜日・時限、開講状況、履修条件、課題負担などを捏造しない。
    - シラバスと開講時間割の記載が矛盾する場合は、その旨を明示する。
    - PDFの文字や表を正確に読み取れない場合は、推測で補わず要確認とする。
    - 時間割の重複がないことと、履修登録が正式に認められることは区別する。
    - 履修条件や開講情報を確認できない授業は、確定候補とせず「要確認」とする。
    - 候補が少ない場合でも、条件に合わない授業を無理に推薦しない。

    以上の条件に従い、根拠のある履修提案を行ってください。`);

    setCopied(false);
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
        <h3>興味・学期の過ごし方</h3>

        <input
          className="prompt-generator__search"
          type="search"
          placeholder="タグを検索..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="タグを検索"
        />

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

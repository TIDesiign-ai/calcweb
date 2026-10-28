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
  - 履修コース：${course}

  ## ユーザーの興味・関心
  ${interests.length ? interests.join("、") : "特に指定なし"}

  ## この学期の過ごし方
  ${styles.length ? styles.join("、") : "特に指定なし"}

  ## 依頼内容
  提示された授業データを分析し、ユーザーにおすすめの授業をランキング形式で提案してください。

  ## 評価基準
  - 興味・関心との適合度
  - 学期の過ごし方や目標との相性
  - スキル習得への有用性
  - 授業データから判断できる負荷や注意点
  - おすすめする具体的な理由

  ## 出力形式
  1. おすすめ授業ランキング
  2. 各授業のおすすめ理由
  3. 希望との適合度
  4. 履修前に確認すべき注意点
  5. 総合的なおすすめ

  授業データにない情報は捏造せず、不明な点は不明と明記してください。

  ## 授業データ
  pdf形式で与えられます。`);

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
        <h2>お試しあれ！！！(TIDPortal内ファイルモジュール 履修関連→シラバス→のファイルをAIに渡してください)</h2>
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

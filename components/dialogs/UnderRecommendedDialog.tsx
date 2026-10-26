
"use client";

import ConfirmDialogBase from "./ConfirmDialogBase";

type Props = {
  open: boolean;
  recommendedCredits: number;
  totalCredits: number;
  creditDifference: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function UnderRecommendedDialog({
  open,
  recommendedCredits,
  totalCredits,
  creditDifference,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <ConfirmDialogBase
      open={open}
      title="本当にこの履修でいいのか？"
      description={
        <>
          推奨単位数をかなり下回っています。
          今のままだと、今後の履修がきつくなる可能性があります。
        </>
      }
      details={
        <>
          <div>
            <dt>推奨単位数</dt>
            <dd>{recommendedCredits} 単位</dd>
          </div>
          <div>
            <dt>現在の履修単位</dt>
            <dd>{totalCredits} 単位</dd>
          </div>
          <div>
            <dt>推奨との差</dt>
            <dd>
              {creditDifference > 0 ? "+" : ""}
              {creditDifference} 単位
            </dd>
          </div>
        </>
      }
      confirmLabel="💀 覚悟して登録"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

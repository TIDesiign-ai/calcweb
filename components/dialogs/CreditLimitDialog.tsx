
"use client";

import ConfirmDialogBase from "./ConfirmDialogBase";

type Props = {
  open: boolean;
  totalCredits: number;
  creditLimit: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function CreditLimitDialog({
  open,
  totalCredits,
  creditLimit,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <ConfirmDialogBase
      open={open}
      title="⚠️ 履修上限オーバー！"
      description={
        <>
          履修上限を {totalCredits - creditLimit} 単位超えています。
          このままでは、AAA上で登録できない可能性があります。
        </>
      }
      details={
        <>
          <div>
            <dt>履修上限</dt>
            <dd>{creditLimit} 単位</dd>
          </div>
          <div>
            <dt>現在の履修単位</dt>
            <dd>{totalCredits} 単位</dd>
          </div>
        </>
      }
      confirmLabel="⚠️ この履修で登録する"
      onConfirm={onConfirm}
      onCancel={onCancel}
      danger
    />
  );
}

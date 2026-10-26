
"use client";

import styles from "./ConfirmDialogBase.module.css";
import type { ReactNode } from "react";

type ConfirmDialogBaseProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  details?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

export default function ConfirmDialogBase({
  open,
  title,
  description,
  details,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogBaseProps) {
  if (!open) return null;

  return (
    <div className={styles.backdrop}>
      <section
        className={`${styles.dialog} ${danger ? styles.danger : ""}`}
        role="alertdialog"
        aria-modal="true"
      >
        <h2>{title}</h2>

        <div className={styles.description}>
          {description}
        </div>

        {details && (
          <dl className={styles.details}>
            {details}
          </dl>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            戻って考える
          </button>

          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

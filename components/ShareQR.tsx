"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import styles from "./ShareQR.module.css";

const APP_URL = "https://tid-schedulemaker.lolipop-now.app";

export default function ShareQR() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.shareButton}
        onClick={() => setOpen(true)}
      >
        <span className={styles.shareIcon}>↗</span>
        トモダチにも教える！
      </button>

      {open && (
        <div
          className={styles.overlay}
          onClick={() => setOpen(false)}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setOpen(false)}
              aria-label="閉じる"
            >
              ×
            </button>

            <div className={styles.eyebrow}>
              SHARE WITH FRIENDS
            </div>

            <h2 id="share-title">
              トモダチにも教える！
            </h2>

            <p className={styles.description}>
              QRコードを読み取って、
              <br />
              この時間割アプリを共有しよう。
            </p>

            <div className={styles.qrFrame}>
              <QRCodeSVG
                value={APP_URL}
                size={208}
                level="H"
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#171717"
              />
            </div>

            <p className={styles.url}>{APP_URL}</p>

            <button
              type="button"
              className={styles.copyButton}
              onClick={() => {
                void navigator.clipboard.writeText(APP_URL);
              }}
            >
              URLをコピー
            </button>
          </section>
        </div>
      )}
    </>
  );
}

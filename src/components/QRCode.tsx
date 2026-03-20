"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCodeComponent({
  value,
  size = 200,
  className = "",
}: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!value) return;

    let cancelled = false;

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setError(false);
        }
      })
      .catch((err) => {
        console.error("QR code generation failed:", err);
        if (!cancelled) {
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-200 rounded-lg text-slate-600 text-xs text-center p-4 ${className}`}
        style={{ width: size, height: size }}
      >
        <div>
          <div className="text-2xl mb-1">⚠️</div>
          <div>QR code unavailable</div>
        </div>
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-200 rounded-lg animate-pulse ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-slate-400 text-xs">Generating...</div>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR code for: ${value}`}
      width={size}
      height={size}
      className={`rounded ${className}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}

"use client";

import React, { useRef } from "react";
import html2canvas from "html2canvas";

export default function PrintLabel() {
  const boxRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (!boxRef.current) return;

    // Convert the box div to an image
    const canvas = await html2canvas(boxRef.current);
    const dataUrl = canvas.toDataURL("image/png");

    // Convert data URL to Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "label.png", { type: "image/png" });

    // Use Web Share API (only works on mobile)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator
        .share({
          files: [file],
          title: "Print Label",
          text: "Label for Arpit",
        })
        .then(() => console.log("Shared successfully"))
        .catch((err) => console.error("Share failed:", err));
    } else {
      alert("Sharing not supported on this device");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div
        ref={boxRef}
        style={{
          width: 200,
          height: 100,
          border: "2px solid #000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          fontWeight: "bold",
          backgroundColor: "#fff",
        }}
      >
        Arpit
      </div>

      <button
        onClick={handlePrint}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          backgroundColor: "#DE0F3F",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Print Label
      </button>
    </div>
  );
}

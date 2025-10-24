"use client";

import React from "react";

export default function PrintLabel() {
  const handlePrint = () => {
    const text = "Arpit"; // Static label for testing
    const encodedText = encodeURIComponent(text);
    const intentURL = `intent://print?text=${encodedText}#Intent;scheme=bluetoothprint;package=mate.bluetoothprint;end`;
    
    // Navigate to the helper app
    window.location.href = intentURL;
  };

  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className="w-48 h-24 border-2 border-black flex items-center justify-center text-xl font-bold mb-6">
        Arpit
      </div>
      <button
        onClick={handlePrint}
        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
      >
        Print Label
      </button>
    </div>
  );
}

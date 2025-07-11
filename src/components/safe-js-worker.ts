"use client";
// Simple Web Worker for safe JavaScript execution
import { safeJsRun } from "../lib/safe-js-run";

// Worker message handler
self.onmessage = async function (e) {
  const { type, id, payload } = e.data;

  if (type === "execute") {
    const { code, input, timeout } = payload;

    try {
      const result = await safeJsRun(code, input, timeout);
      // Send result back to main thread
      self.postMessage({
        id: id,
        isError: false,
        result,
      });
    } catch (error: any) {
      // Send error back to main thread
      self.postMessage({
        id: id,
        isError: true,
        result: {
          error: error.message || "Execution failed",
          solution: "Failed to execute JavaScript code. Please try again.",
        },
      });
    }
  }
};

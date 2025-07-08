import { describe, it, expect } from "vitest";
import { safeJsRun } from "./safe-js-run";

describe("safe-js-run", () => {
  it("should execute basic code with setResult", async () => {
    const result = await safeJsRun("setResult(2 + 3);", {});
    expect("success" in result).toBe(true);
    if ("success" in result) {
      expect(result.result).toBe(5);
    }
  });

  it("should handle input data", async () => {
    const result = await safeJsRun("setResult(x + y);", { x: 10, y: 5 });
    expect("success" in result).toBe(true);
    if ("success" in result) {
      expect(result.result).toBe(15);
    }
  });

  it("should work with Math API", async () => {
    const result = await safeJsRun("setResult(Math.max(1, 2, 3));", {});
    expect("success" in result).toBe(true);
    if ("success" in result) {
      expect(result.result).toBe(3);
    }
  });

  it("should work with JSON API", async () => {
    const result = await safeJsRun(
      'const obj = {name: "test"}; setResult(JSON.stringify(obj));',
      {},
    );
    expect("success" in result).toBe(true);
    if ("success" in result) {
      expect(result.result).toBe('{"name":"test"}');
    }
  });

  it("should capture console.log output", async () => {
    const result = await safeJsRun(
      'console.log("hello", "world"); setResult(42);',
      {},
    );
    expect("success" in result).toBe(true);
    if ("success" in result) {
      expect(result.result).toBe(42);
      expect(result.logs).toEqual([["hello", "world"]]);
    }
  });

  it("should handle syntax errors", async () => {
    const result = await safeJsRun("setResult(2 +);", {});
    expect("isError" in result).toBe(true);
    if ("isError" in result) {
      expect(result.error).toContain("Unexpected token");
    }
  });

  it("should block forbidden keywords", async () => {
    const result = await safeJsRun("window.alert('hack');", {});
    expect("isError" in result).toBe(true);
    if ("isError" in result) {
      expect(result.error).toContain("Forbidden keyword: 'window'");
    }
  });

  it("should detect Function constructor", async () => {
    const result = await safeJsRun("new Function('return 1')();", {});
    expect("isError" in result).toBe(true);
    if ("isError" in result) {
      expect(result.error).toContain("Function constructor");
    }
  });

  it("should detect infinite loop patterns", async () => {
    const result = await safeJsRun("while(true) {}", {});
    expect("isError" in result).toBe(true);
    if ("isError" in result) {
      expect(result.error).toContain("Infinite while loop");
    }
  });

  it("should return undefined when no setResult is called", async () => {
    const result = await safeJsRun("const x = 5;", {});
    expect("success" in result).toBe(true);
    if ("success" in result) {
      expect(result.result).toBe(undefined);
    }
  });
});

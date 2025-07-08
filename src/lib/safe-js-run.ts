// Core JavaScript execution engine with security sandbox

import { safe } from "ts-safe";

type SafeRunOptions = {
  code: string;
  input?: Record<string, any>;
  timeout?: number;
  onLog?: (...args: any[]) => void;
};

type ExecutionResult = {
  success: boolean;
  result?: any;
  logs: any[][];
  error?: string;
  executionTime: number;
};

// Security: Block dangerous keywords that could compromise sandbox
const FORBIDDEN_KEYWORDS = [
  // DOM and browser globals
  "window",
  "document",
  "globalThis",
  "self",
  "parent",
  "top",
  "frames",
  "opener",
  // Code execution (but not function declarations)
  "eval",
  "constructor",
  "prototype",
  "__proto__",
  // Node.js environment
  "process",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
  "global",
  // Dangerous objects
  "Worker",
  "SharedWorker",
  "ServiceWorker",
  "MessageChannel",
  // File system (limited in browser but still blocked)
  "FileReader",
  "Blob",
  "File",
  "FileSystem",
  // Network bypass attempts
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
];

// Enhanced security check with pattern detection
function validateCodeSafety(code: string): string | null {
  // Check forbidden keywords
  for (const keyword of FORBIDDEN_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(code)) {
      return `Forbidden keyword: '${keyword}' - not allowed for security reasons`;
    }
  }

  // Detect obvious infinite loop patterns that would block the event loop
  const infiniteLoopPatterns = [
    {
      pattern: /while\s*\(\s*true\s*\)/gi,
      message: "Infinite while loop detected",
    },
    {
      pattern: /for\s*\(\s*;\s*;\s*\)/gi,
      message: "Infinite for loop detected",
    },
    {
      pattern: /while\s*\(\s*1\s*\)/gi,
      message: "Infinite while loop detected",
    },
    {
      pattern: /for\s*\(\s*;\s*true\s*;\s*\)/gi,
      message: "Infinite for loop detected",
    },
  ];

  for (const { pattern, message } of infiniteLoopPatterns) {
    if (pattern.test(code)) {
      return `Dangerous infinite loop pattern: ${message}`;
    }
  }

  // Detect suspicious patterns that might bypass security
  const suspiciousPatterns = [
    {
      pattern: /['"`]\s*\+\s*['"`]/g,
      message: "String concatenation to access globals",
    },
    {
      pattern: /\[['"`][a-zA-Z_$][a-zA-Z0-9_$]*['"`]\]/g,
      message: "Dynamic property access",
    },
    { pattern: /eval\s*\(/gi, message: "Dynamic code evaluation" },
    { pattern: /(new\s+)?Function\s*\(/gi, message: "Function constructor" },
    { pattern: /constructor\s*\(/gi, message: "Constructor access" },
    { pattern: /prototype\s*\[/gi, message: "Prototype manipulation" },
    {
      pattern: /(__proto__|\.constructor)/gi,
      message: "Prototype chain access",
    },
  ];

  for (const { pattern, message } of suspiciousPatterns) {
    if (pattern.test(code)) {
      return `Suspicious pattern detected: ${message}`;
    }
  }

  return null;
}

// Create a controlled execution environment with safe APIs
function createSafeEnvironment(
  input: Record<string, any>,
  logCapture: (...args: any[]) => void,
) {
  // Result storage for setResult function
  let __executionResult: any = undefined;

  const safeConsole = {
    log: logCapture,
    info: logCapture,
    warn: logCapture,
    error: logCapture,
    debug: logCapture,
    trace: logCapture,
  };

  // Safe global objects and functions
  const safeGlobals = {
    // Input data
    ...input,

    // Console for output
    console: safeConsole,

    // Result setting function
    setResult: (value: any) => {
      __executionResult = value;
    },

    // Standard JavaScript objects
    Math: Math,
    JSON: JSON,
    Date: Date,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Promise: Promise,

    // Utility functions
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,

    // Safe browser APIs (if available)
    ...(typeof window !== "undefined" && {
      fetch: window.fetch.bind(window),
      setTimeout: window.setTimeout.bind(window),
      setInterval: window.setInterval.bind(window),
      clearTimeout: window.clearTimeout.bind(window),
      clearInterval: window.clearInterval.bind(window),
      btoa: window.btoa.bind(window),
      atob: window.atob.bind(window),
    }),
  };

  return { safeGlobals, getResult: () => __executionResult };
}

// Simple code wrapper - no complex result detection needed
function wrapCode(code: string): string {
  return `"use strict";\n${code}`;
}

async function execute({
  code,
  input = {},
  timeout = 5000,
  onLog,
}: SafeRunOptions): Promise<ExecutionResult> {
  const startTime = Date.now();
  const logs: any[][] = [];

  // Capture logs
  const logCapture = (...args: any[]) => {
    logs.push(args);
    if (onLog) onLog(...args);
  };

  // Validate code safety
  const securityError = validateCodeSafety(code);
  if (securityError) {
    return {
      success: false,
      error: securityError,
      logs,
      executionTime: Date.now() - startTime,
    };
  }

  // Create safe execution environment
  const { safeGlobals, getResult } = createSafeEnvironment(input, logCapture);
  const wrappedCode = wrapCode(code);

  // Execute with timeout protection
  try {
    await Promise.race([
      // Code execution
      new Promise((resolve, reject) => {
        try {
          const func = new Function(...Object.keys(safeGlobals), wrappedCode);
          func(...Object.values(safeGlobals));
          resolve(undefined);
        } catch (error: any) {
          reject(error);
        }
      }),

      // Timeout
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Execution timeout: ${timeout}ms limit exceeded`));
        }, timeout);
      }),
    ]);

    return {
      success: true,
      result: getResult(),
      logs,
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Unknown execution error",
      logs,
      executionTime: Date.now() - startTime,
    };
  }
}

export async function safeJsRun(
  code: string,
  input: Record<string, unknown>,
  timeout: number = 5000,
) {
  return safe(async () => {
    const result = await execute({
      code,
      input,
      timeout,
      onLog: (...args) => console.log(...args),
    });

    if (!result.success) {
      throw new Error(result.error || "Code execution failed");
    }

    return {
      result: result.result,
      logs: result.logs,
      executionTime: `${result.executionTime}ms`,
      success: true,
    };
  })
    .ifFail((err) => {
      return {
        isError: true,
        error: err.message,
        solution: `JavaScript execution failed. Common issues:
    • Syntax errors: Check for missing semicolons, brackets, or quotes
    • Forbidden operations: Avoid DOM access, eval(), or global object manipulation  
    • Infinite loops: Code execution times out after ${timeout}ms
    • API errors: Check network connectivity for fetch() calls
    • Type errors: Verify data types and object properties exist
    • Reference errors: Make sure all variables and functions are defined
    • Missing result: Use setResult(value) to return a result from your code
    
    Available APIs: Math, JSON, Date, fetch, setTimeout, console.log, setResult
    Input data properties are available as variables in your code scope.
    Use setResult(value) to return results instead of relying on last expression.`,
      };
    })
    .unwrap();
}

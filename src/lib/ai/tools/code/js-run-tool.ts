import { JSONSchema7 } from "json-schema";
import { tool as createTool } from "ai";
import { jsonSchemaToZod } from "lib/json-schema-to-zod";

export const jsExecutionSchema: JSONSchema7 = {
  type: "object",
  properties: {
    code: {
      type: "string",
      description:
        "JavaScript code to execute. Use setResult(value) to return a result. Can include calculations, data processing, API calls, and logic operations. Avoid DOM manipulation, file system access, or server-side operations.",
    },
    input: {
      type: "object",
      description:
        "Input data passed as variables to your code. Each property becomes a variable you can use directly. Example: {name: 'Alice', age: 25} makes 'name' and 'age' variables available in your code.",
      properties: {},
      additionalProperties: true,
      default: {},
    },
    timeout: {
      type: "number",
      description:
        "Execution timeout in milliseconds to prevent infinite loops",
      default: 5000,
      minimum: 100,
      maximum: 30000,
    },
  },
  required: ["code"],
};

export const jsExecutionTool = createTool({
  description: `Execute JavaScript code safely in a sandboxed environment. Perfect for:
SECURITY: Runs in a restricted sandbox - no DOM access, no file system, no server-side operations.
AVAILABLE APIS: Math, JSON, Date, Array, Object, String, Number, fetch, setTimeout, console.log, setResult

RESULT OUTPUT: Use setResult(value) to return a result from your code.
- eg. setResult({name: "test"})

INPUT DATA: All input properties become variables in your code scope
- Input: {numbers: [1,2,3], multiplier: 2}
- Code: "setResult(numbers.map(n => n * multiplier))"

Example usage: 
{
  input: {numbers: [1,2,3]},
  code: "const sum = numbers.reduce((acc, curr) => acc + curr, 0);\nconsole.log(sum);\nsetResult(sum);"
}`,
  parameters: jsonSchemaToZod(jsExecutionSchema),
});

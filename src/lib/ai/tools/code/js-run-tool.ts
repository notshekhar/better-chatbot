import { JSONSchema7 } from "json-schema";
import { tool as createTool } from "ai";
import { jsonSchemaToZod } from "lib/json-schema-to-zod";

export const jsExecutionSchema: JSONSchema7 = {
  type: "object",
  properties: {
    code: {
      type: "string",
      description:
        "JavaScript code to execute. Use console.log() to output results and console.error() for errors. Can include calculations, data processing, API calls, and logic operations. Avoid DOM manipulation, file system access, or server-side operations.",
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
  description: `Execute JavaScript code safely in a sandboxed environment for generating accurate data and calculations.

PURPOSE: Use this tool to generate precise, calculated data through JavaScript computation.

SECURITY: Runs in restricted sandbox - no DOM, file system, or server access.
AVAILABLE APIS: Math, JSON, Date, Array, Object, String, Number, fetch, setTimeout, console methods

OUTPUT: Use console methods to output results:
- console.log(result) - Main results
- console.error(error) - Errors  
- console.info(info) - Information

INPUT: All input properties become variables in your code.

Example: 
{
  input: {numbers: [1,2,3]},
  code: "const sum = numbers.reduce((a, b) => a + b, 0); console.log('Total:', sum);"
}`,
  parameters: jsonSchemaToZod(jsExecutionSchema),
});

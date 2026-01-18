/**
 * Tool Definitions for Voice Agent Function Calling
 *
 * Defines the available tools/functions that voice agents can call.
 * Includes provider-specific schema formats for OpenAI, xAI, Vapi, and Gemini.
 */

/**
 * Base tool metadata shared across providers
 */
export interface ToolMetadata {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required: string[];
  };
}

/**
 * Parameter schema definition
 */
interface ParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
}

/**
 * OpenAI Realtime API tool format
 */
export interface OpenAITool {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required: string[];
  };
}

/**
 * xAI tool format (matches OpenAI structure for compatibility)
 */
export interface XAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ParameterSchema>;
      required: string[];
    };
  };
}

/**
 * Vapi tool format for CreateAssistantDTO.model.functions
 * Uses OpenAI-compatible function calling format
 */
export interface VapiTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required: string[];
  };
}

/**
 * Gemini tool format for FunctionDeclaration
 * Uses Google's FunctionDeclaration schema for Live API
 * @see https://ai.google.dev/gemini-api/docs/function-calling
 */
export interface GeminiTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required?: string[];
  };
}

/**
 * Allowlist of valid function names for security validation
 */
export const ALLOWED_FUNCTIONS = ['get_weather', 'calculate', 'get_current_time'] as const;

export type AllowedFunctionName = (typeof ALLOWED_FUNCTIONS)[number];

/**
 * Check if a function name is in the allowlist
 */
export function isAllowedFunction(name: string): name is AllowedFunctionName {
  return ALLOWED_FUNCTIONS.includes(name as AllowedFunctionName);
}

/**
 * Base tool definitions shared across providers
 */
export const TOOL_DEFINITIONS: ToolMetadata[] = [
  {
    name: 'get_weather',
    description:
      'Get the current weather for a specific location. Returns temperature, conditions, and humidity.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and country, e.g. "Tokyo, Japan" or "New York, USA"',
        },
        unit: {
          type: 'string',
          description: 'Temperature unit: celsius or fahrenheit',
          enum: ['celsius', 'fahrenheit'],
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'calculate',
    description:
      'Perform a mathematical calculation. Supports basic arithmetic operations: addition, subtraction, multiplication, division.',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The mathematical expression to evaluate, e.g. "2 + 2", "15 * 3", "100 / 4"',
        },
      },
      required: ['expression'],
    },
  },
  {
    name: 'get_current_time',
    description: 'Get the current time in a specific timezone. Returns the current date and time.',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description:
            'The timezone name, e.g. "America/New_York", "Europe/London", "Asia/Tokyo". Defaults to UTC if not specified.',
        },
      },
      required: [],
    },
  },
];

/**
 * Get tool definitions in OpenAI Realtime API format
 * OpenAI uses a flat structure with type: 'function'
 */
export function getOpenAITools(): OpenAITool[] {
  return TOOL_DEFINITIONS.map((tool) => ({
    type: 'function' as const,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}

/**
 * Get tool definitions in xAI format
 * xAI uses nested function object structure
 */
export function getXAITools(): XAITool[] {
  return TOOL_DEFINITIONS.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

/**
 * Get tool definitions in Vapi format
 * Vapi uses OpenAI-compatible flat structure for CreateAssistantDTO.model.functions
 */
export function getVapiTools(): VapiTool[] {
  return TOOL_DEFINITIONS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}

/**
 * Get a specific tool definition by name
 */
export function getToolByName(name: string): ToolMetadata | undefined {
  return TOOL_DEFINITIONS.find((tool) => tool.name === name);
}

/**
 * Get tool definitions in Gemini FunctionDeclaration format
 * Gemini uses a simple flat structure similar to Vapi but with optional required array
 * @see https://ai.google.dev/gemini-api/docs/function-calling
 */
export function getGeminiTools(): GeminiTool[] {
  return TOOL_DEFINITIONS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object' as const,
      properties: tool.parameters.properties,
      // Gemini uses optional required array (empty array if no required params)
      required: tool.parameters.required.length > 0 ? tool.parameters.required : undefined,
    },
  }));
}

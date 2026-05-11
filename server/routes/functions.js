import { Router } from 'express';
import { sanitizeLogInput } from '../utils/sanitize.js';
import {
  isPlainObject,
  validateAllowedKeys,
  validateOptionalObject,
  validateString,
} from '../utils/security.js';

const router = Router();

// Function execution timeout (2 seconds for real-time voice)
const FUNCTION_TIMEOUT_MS = 2000;

// Allowlist of valid function names for security
const ALLOWED_FUNCTIONS = ['get_weather', 'calculate', 'get_current_time'];
const CALL_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
const FUNCTION_NAME_PATTERN = /^[a-z_]+$/;
const LOCATION_PATTERN = /^[A-Za-z0-9 .,'-]+$/;
const TIMEZONE_PATTERN = /^[A-Za-z0-9_+\-/.]+$/;
const EXPRESSION_PATTERN = /^[0-9+\-*/().\s]+$/;

/**
 * Validates that a function name is in the allowlist
 * @param {string} name - Function name to validate
 * @returns {boolean}
 */
function isAllowedFunction(name) {
  return ALLOWED_FUNCTIONS.includes(name);
}

function validateArgumentsForFunction(name, args) {
  if (!isPlainObject(args)) {
    return {
      valid: false,
      error: {
        error: 'Validation error',
        message: 'arguments: must be an object',
      },
    };
  }

  if (name === 'get_weather') {
    const keys = validateAllowedKeys(args, ['location', 'unit'], 'arguments');
    if (!keys.valid) {
      return keys;
    }

    const location = validateString(args.location, {
      field: 'arguments.location',
      required: true,
      maxLength: 120,
      pattern: LOCATION_PATTERN,
    });
    if (!location.valid) {
      return location;
    }

    const unit = validateString(args.unit, {
      field: 'arguments.unit',
      maxLength: 16,
      pattern: /^(celsius|fahrenheit)$/,
      defaultValue: 'celsius',
    });
    if (!unit.valid) {
      return unit;
    }

    return {
      valid: true,
      args: {
        location: location.value,
        unit: unit.value || 'celsius',
      },
    };
  }

  if (name === 'calculate') {
    const keys = validateAllowedKeys(args, ['expression'], 'arguments');
    if (!keys.valid) {
      return keys;
    }

    const expression = validateString(args.expression, {
      field: 'arguments.expression',
      required: true,
      maxLength: 128,
      pattern: EXPRESSION_PATTERN,
    });
    if (!expression.valid) {
      return expression;
    }

    return {
      valid: true,
      args: {
        expression: expression.value,
      },
    };
  }

  if (name === 'get_current_time') {
    const keys = validateAllowedKeys(args, ['timezone'], 'arguments');
    if (!keys.valid) {
      return keys;
    }

    const timezone = validateString(args.timezone, {
      field: 'arguments.timezone',
      maxLength: 64,
      pattern: TIMEZONE_PATTERN,
      defaultValue: 'UTC',
    });
    if (!timezone.valid) {
      return timezone;
    }

    return {
      valid: true,
      args: {
        timezone: timezone.value || 'UTC',
      },
    };
  }

  return {
    valid: false,
    error: {
      error: 'Validation error',
      message: 'name: function is not allowed',
    },
  };
}

function validateExecuteRequest(body) {
  const keys = validateAllowedKeys(body || {}, ['name', 'arguments', 'callId'], 'body');
  if (!keys.valid) {
    return keys;
  }

  const name = validateString(body?.name, {
    field: 'name',
    required: true,
    maxLength: 64,
    pattern: FUNCTION_NAME_PATTERN,
  });
  if (!name.valid) {
    return name;
  }

  const callId = validateString(body?.callId, {
    field: 'callId',
    maxLength: 128,
    pattern: CALL_ID_PATTERN,
  });
  if (!callId.valid) {
    return callId;
  }

  const objectBounds = validateOptionalObject(body?.arguments, {
    field: 'arguments',
    maxDepth: 3,
    maxKeys: 8,
    maxStringLength: 256,
  });
  if (!objectBounds.valid) {
    return objectBounds;
  }

  if (objectBounds.value === undefined) {
    return {
      valid: false,
      error: {
        error: 'Validation error',
        message: 'arguments: is required',
      },
    };
  }

  if (!isAllowedFunction(name.value)) {
    return {
      valid: false,
      status: 403,
      error: {
        error: 'Validation error',
        message: `Function "${name.value}" is not allowed`,
      },
    };
  }

  const args = validateArgumentsForFunction(name.value, objectBounds.value);
  if (!args.valid) {
    return args;
  }

  return {
    valid: true,
    name: name.value,
    callId: callId.value,
    args: args.args,
  };
}

function createResultSummary(result) {
  if (isPlainObject(result)) {
    return {
      type: 'object',
      keys: Object.keys(result).sort().slice(0, 8),
    };
  }

  return { type: typeof result };
}

async function executeWithTimeout(handler, args) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const timeoutError = new Error('Function execution timed out');
      timeoutError.code = 'FUNCTION_TIMEOUT';
      reject(timeoutError);
    }, FUNCTION_TIMEOUT_MS);
  });

  try {
    return await Promise.race([Promise.resolve(handler(args)), timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Mock weather data for different locations
 * In production, this would call a real weather API
 */
const MOCK_WEATHER_DATA = {
  'tokyo': { temp_c: 15, temp_f: 59, conditions: 'Partly cloudy', humidity: 65 },
  'new york': { temp_c: 8, temp_f: 46, conditions: 'Clear', humidity: 45 },
  'london': { temp_c: 12, temp_f: 54, conditions: 'Overcast', humidity: 80 },
  'paris': { temp_c: 14, temp_f: 57, conditions: 'Sunny', humidity: 55 },
  'sydney': { temp_c: 25, temp_f: 77, conditions: 'Sunny', humidity: 60 },
  'default': { temp_c: 20, temp_f: 68, conditions: 'Fair', humidity: 50 }
};

/**
 * Get weather for a location (mock implementation)
 * @param {Object} args - Function arguments
 * @param {string} args.location - City and country
 * @param {string} [args.unit='celsius'] - Temperature unit
 * @returns {Object} Weather data formatted for speech
 */
function getWeather(args) {
  const { location, unit = 'celsius' } = args;

  if (!location) {
    throw new Error('Location is required');
  }

  // Normalize location for lookup
  const normalizedLocation = location.toLowerCase().split(',')[0].trim();
  const weather = MOCK_WEATHER_DATA[normalizedLocation] || MOCK_WEATHER_DATA['default'];

  const temp = unit === 'fahrenheit' ? weather.temp_f : weather.temp_c;
  const unitSymbol = unit === 'fahrenheit' ? 'F' : 'C';

  return {
    location: location,
    temperature: temp,
    unit: unitSymbol,
    conditions: weather.conditions,
    humidity: weather.humidity,
    formatted: `The weather in ${location} is ${weather.conditions} with a temperature of ${temp} degrees ${unitSymbol === 'C' ? 'Celsius' : 'Fahrenheit'} and ${weather.humidity}% humidity.`
  };
}

/**
 * Safely evaluate a mathematical expression
 * Only supports basic arithmetic: +, -, *, /, (, ), and numbers
 * @param {Object} args - Function arguments
 * @param {string} args.expression - Mathematical expression
 * @returns {Object} Calculation result
 */
function calculate(args) {
  const { expression } = args;

  if (!expression) {
    throw new Error('Expression is required');
  }

  // Sanitize: only allow numbers, operators, parentheses, decimals, and spaces
  const sanitized = expression.replace(/\s/g, '');
  const validPattern = /^[0-9+\-*/().]+$/;

  if (!validPattern.test(sanitized)) {
    throw new Error('Invalid expression. Only numbers and basic operators (+, -, *, /) are allowed.');
  }

  // Check for dangerous patterns
  if (/[a-zA-Z_$]/.test(sanitized)) {
    throw new Error('Invalid expression. Variables and functions are not allowed.');
  }

  try {
    // Use Function constructor for safe evaluation of numeric expressions
    // This is safe because we've validated the input contains only numbers and operators
    const result = new Function(`return (${sanitized})`)();

    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Calculation resulted in an invalid number');
    }

    // Round to reasonable precision
    const rounded = Math.round(result * 1000000) / 1000000;

    return {
      expression: expression,
      result: rounded,
      formatted: `${expression} equals ${rounded}`
    };
  } catch (evalError) {
    throw new Error(`Failed to evaluate expression: ${evalError.message}`);
  }
}

/**
 * Get current time in a timezone
 * @param {Object} args - Function arguments
 * @param {string} [args.timezone='UTC'] - Timezone name
 * @returns {Object} Current time data
 */
function getCurrentTime(args) {
  const { timezone = 'UTC' } = args;

  try {
    const now = new Date();
    const options = {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };

    const formatted = new Intl.DateTimeFormat('en-US', options).format(now);

    return {
      timezone: timezone,
      datetime: now.toISOString(),
      formatted: `The current time in ${timezone} is ${formatted}.`
    };
  } catch (tzError) {
    // If timezone is invalid, fall back to UTC
    const now = new Date();
    return {
      timezone: 'UTC',
      datetime: now.toISOString(),
      formatted: `The current time in UTC is ${now.toUTCString()}. Note: The requested timezone "${timezone}" was not recognized.`
    };
  }
}

/**
 * Function handlers map
 */
const FUNCTION_HANDLERS = {
  get_weather: getWeather,
  calculate: calculate,
  get_current_time: getCurrentTime
};

/**
 * POST /api/functions/execute
 * Executes a function by name with provided arguments.
 * Used by voice agents to perform actions during conversation.
 *
 * Request body:
 *   - name (required): Function name to execute
 *   - arguments (required): Object containing function arguments
 *   - callId (optional): Unique ID for tracking the function call
 *
 * Response:
 *   - Success: { success: true, result: Object, callId?: string }
 *   - Error: { success: false, error: string, callId?: string }
 */
router.post('/execute', async (req, res) => {
  const startTime = Date.now();
  const requestValidation = validateExecuteRequest(req.body);
  const callId = requestValidation.callId;

  if (!requestValidation.valid) {
    return res.status(requestValidation.status || 400).json({
      success: false,
      error: requestValidation.error.message,
      callId,
    });
  }

  const { name, args } = requestValidation;
  console.log(`[Functions] Executing function: %s`, sanitizeLogInput(name), {
    callId: sanitizeLogInput(callId),
  });

  // Get function handler
  const handler = FUNCTION_HANDLERS[name];
  if (!handler) {
    return res.status(500).json({
      success: false,
      error: `Function handler not found for: ${name}`,
      callId
    });
  }

  // Execute function with timeout
  try {
    const result = await executeWithTimeout(handler, args);

    const duration = Date.now() - startTime;
    console.log(`[Functions] Function %s completed in ${duration}ms`, sanitizeLogInput(name), {
      callId: sanitizeLogInput(callId),
      result: createResultSummary(result),
    });

    return res.json({
      success: true,
      result,
      callId,
      executionTime: duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const status = error.code === 'FUNCTION_TIMEOUT' ? 504 : 400;
    console.error(`[Functions] Function %s failed in ${duration}ms: %s`, sanitizeLogInput(name), sanitizeLogInput(error.message), {
      callId: sanitizeLogInput(callId),
    });

    return res.status(status).json({
      success: false,
      error: error.message,
      callId,
      executionTime: duration
    });
  }
});

/**
 * GET /api/functions/list
 * Returns the list of available functions and their descriptions.
 * Used by frontend for documentation/debugging.
 */
router.get('/list', (req, res) => {
  const functions = ALLOWED_FUNCTIONS.map(name => ({
    name,
    available: true
  }));

  res.json({ functions });
});

export default router;

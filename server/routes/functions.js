import { Router } from 'express';

const router = Router();

// Function execution timeout (2 seconds for real-time voice)
const FUNCTION_TIMEOUT_MS = 2000;

// Allowlist of valid function names for security
const ALLOWED_FUNCTIONS = ['get_weather', 'calculate', 'get_current_time'];

/**
 * Validates that a function name is in the allowlist
 * @param {string} name - Function name to validate
 * @returns {boolean}
 */
function isAllowedFunction(name) {
  return ALLOWED_FUNCTIONS.includes(name);
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
  const { name, arguments: args, callId } = req.body;

  console.log(`[Functions] Executing function: ${name}`, { callId, args });

  // Validate function name
  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Function name is required',
      callId
    });
  }

  // Security check: validate against allowlist
  if (!isAllowedFunction(name)) {
    console.warn(`[Functions] Blocked attempt to call non-allowed function: ${name}`);
    return res.status(403).json({
      success: false,
      error: `Function "${name}" is not allowed`,
      callId
    });
  }

  // Validate arguments
  if (!args || typeof args !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Function arguments must be an object',
      callId
    });
  }

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
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function execution timed out')), FUNCTION_TIMEOUT_MS);
    });

    const executionPromise = Promise.resolve(handler(args));

    const result = await Promise.race([executionPromise, timeoutPromise]);

    const duration = Date.now() - startTime;
    console.log(`[Functions] Function ${name} completed in ${duration}ms`, { callId, result });

    return res.json({
      success: true,
      result,
      callId,
      executionTime: duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Functions] Function ${name} failed in ${duration}ms:`, error.message);

    return res.status(500).json({
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

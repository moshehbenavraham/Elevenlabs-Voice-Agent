import { describe, it, expect } from 'vitest';
import {
  TOOL_DEFINITIONS,
  ALLOWED_FUNCTIONS,
  isAllowedFunction,
  getOpenAITools,
  getXAITools,
  getToolByName,
} from '../toolDefinitions';

describe('toolDefinitions', () => {
  describe('ALLOWED_FUNCTIONS', () => {
    it('contains expected function names', () => {
      expect(ALLOWED_FUNCTIONS).toContain('get_weather');
      expect(ALLOWED_FUNCTIONS).toContain('calculate');
      expect(ALLOWED_FUNCTIONS).toContain('get_current_time');
      expect(ALLOWED_FUNCTIONS).toHaveLength(3);
    });
  });

  describe('isAllowedFunction', () => {
    it('returns true for allowed function names', () => {
      expect(isAllowedFunction('get_weather')).toBe(true);
      expect(isAllowedFunction('calculate')).toBe(true);
      expect(isAllowedFunction('get_current_time')).toBe(true);
    });

    it('returns false for non-allowed function names', () => {
      expect(isAllowedFunction('hack_system')).toBe(false);
      expect(isAllowedFunction('random_function')).toBe(false);
      expect(isAllowedFunction('')).toBe(false);
    });
  });

  describe('TOOL_DEFINITIONS', () => {
    it('defines all allowed functions', () => {
      const definedNames = TOOL_DEFINITIONS.map((t) => t.name);
      expect(definedNames).toContain('get_weather');
      expect(definedNames).toContain('calculate');
      expect(definedNames).toContain('get_current_time');
    });

    it('has valid schema structure for each tool', () => {
      for (const tool of TOOL_DEFINITIONS) {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.parameters.type).toBe('object');
        expect(tool.parameters.properties).toBeDefined();
        expect(Array.isArray(tool.parameters.required)).toBe(true);
      }
    });

    describe('get_weather tool', () => {
      const weatherTool = TOOL_DEFINITIONS.find((t) => t.name === 'get_weather');

      it('has location parameter', () => {
        expect(weatherTool?.parameters.properties.location).toBeDefined();
        expect(weatherTool?.parameters.properties.location.type).toBe('string');
      });

      it('has optional unit parameter with enum', () => {
        expect(weatherTool?.parameters.properties.unit).toBeDefined();
        expect(weatherTool?.parameters.properties.unit.enum).toContain('celsius');
        expect(weatherTool?.parameters.properties.unit.enum).toContain('fahrenheit');
      });

      it('requires location', () => {
        expect(weatherTool?.parameters.required).toContain('location');
      });
    });

    describe('calculate tool', () => {
      const calcTool = TOOL_DEFINITIONS.find((t) => t.name === 'calculate');

      it('has expression parameter', () => {
        expect(calcTool?.parameters.properties.expression).toBeDefined();
        expect(calcTool?.parameters.properties.expression.type).toBe('string');
      });

      it('requires expression', () => {
        expect(calcTool?.parameters.required).toContain('expression');
      });
    });

    describe('get_current_time tool', () => {
      const timeTool = TOOL_DEFINITIONS.find((t) => t.name === 'get_current_time');

      it('has timezone parameter', () => {
        expect(timeTool?.parameters.properties.timezone).toBeDefined();
        expect(timeTool?.parameters.properties.timezone.type).toBe('string');
      });

      it('does not require timezone', () => {
        expect(timeTool?.parameters.required).not.toContain('timezone');
      });
    });
  });

  describe('getOpenAITools', () => {
    it('returns tools in OpenAI format', () => {
      const tools = getOpenAITools();

      expect(tools.length).toBe(TOOL_DEFINITIONS.length);

      for (const tool of tools) {
        expect(tool.type).toBe('function');
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.parameters).toBeDefined();
      }
    });

    it('has correct flat structure for OpenAI', () => {
      const tools = getOpenAITools();
      const weatherTool = tools.find((t) => t.name === 'get_weather');

      expect(weatherTool?.type).toBe('function');
      expect(weatherTool?.name).toBe('get_weather');
      expect(weatherTool?.description).toBeDefined();
      expect(weatherTool?.parameters.type).toBe('object');
    });
  });

  describe('getXAITools', () => {
    it('returns tools in xAI format', () => {
      const tools = getXAITools();

      expect(tools.length).toBe(TOOL_DEFINITIONS.length);

      for (const tool of tools) {
        expect(tool.type).toBe('function');
        expect(tool.function).toBeDefined();
        expect(tool.function.name).toBeDefined();
        expect(tool.function.description).toBeDefined();
        expect(tool.function.parameters).toBeDefined();
      }
    });

    it('has correct nested structure for xAI', () => {
      const tools = getXAITools();
      const weatherTool = tools.find((t) => t.function.name === 'get_weather');

      expect(weatherTool?.type).toBe('function');
      expect(weatherTool?.function.name).toBe('get_weather');
      expect(weatherTool?.function.description).toBeDefined();
      expect(weatherTool?.function.parameters.type).toBe('object');
    });
  });

  describe('getToolByName', () => {
    it('returns tool definition for valid name', () => {
      const tool = getToolByName('get_weather');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('get_weather');
    });

    it('returns undefined for invalid name', () => {
      const tool = getToolByName('nonexistent_function');
      expect(tool).toBeUndefined();
    });
  });
});

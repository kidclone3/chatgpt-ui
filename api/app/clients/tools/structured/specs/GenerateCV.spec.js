const GenerateCV = require('../GenerateCV');
const fetch = require('node-fetch');

jest.mock('node-fetch');

// Mock getEnvironmentVariable
jest.mock('@langchain/core/utils/env', () => ({
  getEnvironmentVariable: jest.fn(),
}));

const { getEnvironmentVariable } = require('@langchain/core/utils/env');

describe('GenerateCV', () => {
  const mockApiKey = 'mock_api_key';
  const mockApiUrl = 'http://example.com/api/abc';

  beforeEach(() => {
    jest.clearAllMocks();
    getEnvironmentVariable.mockImplementation((envVar) => {
      if (envVar === 'GENERATE_CV_API_KEY') return mockApiKey;
      if (envVar === 'GENERATE_CV_API_URL') return mockApiUrl;
      return undefined;
    });
    fetch.mockClear();
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      const instance = new GenerateCV({
        GENERATE_CV_API_KEY: mockApiKey,
        GENERATE_CV_API_URL: mockApiUrl,
      });
      
      expect(instance.name).toBe('generate_cv');
      expect(instance.apiKey).toBe(mockApiKey);
      expect(instance.baseUrl).toBe(mockApiUrl);
      expect(instance.description).toContain('Generate professional CV/resume documents');
    });

    it('should use environment variables when no fields provided', () => {
      const instance = new GenerateCV({
        override: true,
      });
      
      expect(instance.apiKey).toBe(mockApiKey);
      expect(instance.baseUrl).toBe(mockApiUrl);
    });

    it('should throw an error if GENERATE_CV_API_KEY is missing', () => {
      getEnvironmentVariable.mockImplementation((envVar) => {
        if (envVar === 'GENERATE_CV_API_KEY') return undefined;
        if (envVar === 'GENERATE_CV_API_URL') return mockApiUrl;
        return undefined;
      });
      
      expect(() => new GenerateCV()).toThrow(
        'Missing GENERATE_CV_API_KEY environment variable.',
      );
    });

    it('should throw an error if GENERATE_CV_API_URL is missing', () => {
      getEnvironmentVariable.mockImplementation((envVar) => {
        if (envVar === 'GENERATE_CV_API_KEY') return mockApiKey;
        if (envVar === 'GENERATE_CV_API_URL') return undefined;
        return undefined;
      });
      
      expect(() => new GenerateCV()).toThrow(
        'Missing GENERATE_CV_API_URL environment variable.',
      );
    });

    it('should not throw errors when override is true', () => {
      getEnvironmentVariable.mockReturnValue(undefined);
      
      expect(() => new GenerateCV({ override: true })).not.toThrow();
    });
  });

  describe('schema validation', () => {
    let instance;

    beforeEach(() => {
      instance = new GenerateCV({
        override: true,
        GENERATE_CV_API_KEY: mockApiKey,
        GENERATE_CV_API_URL: mockApiUrl,
      });
    });

    it('should validate required fields', () => {
      const validData = {
        name: 'John Doe',
        position: 'Software Engineer',
        info: [{ icon: 'email', data: 'john@example.com' }],
        summary: 'Experienced developer',
        skill: ['JavaScript', 'React'],
      };

      const result = instance.schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid data', () => {
      const invalidData = {
        name: '', // too short
        position: 'x'.repeat(51), // too long
        info: [], // required array is empty
        summary: '', // required field
        skill: [], // required field
      };

      const result = instance.schema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const dataWithOptionals = {
        name: 'Jane Doe',
        position: 'Designer',
        info: [{ icon: 'phone', data: '+1234567890' }],
        summary: 'Creative designer',
        skill: ['Design', 'Photoshop'],
        education: [{
          place: 'University',
          major: 'Computer Science',
          time: '2020-2024',
          extra: 'Magna Cum Laude',
        }],
        experience: [{
          place: 'Tech Corp',
          phase: [{
            time: '2024-Present',
            position: 'Developer',
            detail: ['Built apps', 'Led team'],
          }],
        }],
      };

      const result = instance.schema.safeParse(dataWithOptionals);
      expect(result.success).toBe(true);
    });
  });

  describe('_call method', () => {
    let instance;

    beforeEach(() => {
      instance = new GenerateCV({
        override: true,
        GENERATE_CV_API_KEY: mockApiKey,
        GENERATE_CV_API_URL: mockApiUrl,
      });
    });

    it('should make POST request with correct data', async () => {
      const mockResponse = { success: true, cv_url: 'http://example.com/cv.pdf' };
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const testData = {
        name: 'John Doe',
        position: 'Software Engineer',
        info: [{ icon: 'email', data: 'john@example.com' }],
        summary: 'Experienced developer',
        skill: ['JavaScript'],
      };

      const result = await instance._call(testData);
      
      expect(fetch).toHaveBeenCalledWith(
        mockApiUrl,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`,
          },
          body: JSON.stringify(testData),
        }),
      );
      
      expect(result).toBe(JSON.stringify(mockResponse));
    });

    it('should handle params field correctly', async () => {
      const mockResponse = { success: true };
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const testData = {
        name: 'John Doe',
        position: 'Software Engineer',
        info: [{ icon: 'email', data: 'john@example.com' }],
        summary: 'Experienced developer',
        skill: ['JavaScript'],
        params: { format: 'pdf', template: 'modern' },
      };

      const result = await instance._call(testData);
      
      // Check that the data doesn't include params (they are extracted)
      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody).not.toHaveProperty('params');
      
      // Verify the call was successful
      expect(result).toBe(JSON.stringify(mockResponse));
      
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`,
          }),
          body: expect.stringContaining('"name":"John Doe"'),
        }),
      );
    });

    it('should handle API errors', async () => {
      const errorResponse = { error: 'Invalid data' };
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      });

      const testData = {
        name: 'John Doe',
        position: 'Software Engineer',
        info: [{ icon: 'email', data: 'john@example.com' }],
        summary: 'Experienced developer',
        skill: ['JavaScript'],
      };

      const result = await instance._call(testData);
      
      expect(result).toContain('Error: CV generation API request failed with status 400');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        name: '', // invalid
      };

      const result = await instance._call(invalidData);
      
      expect(result).toContain('Error: Validation failed');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const testData = {
        name: 'John Doe',
        position: 'Software Engineer',
        info: [{ icon: 'email', data: 'john@example.com' }],
        summary: 'Experienced developer',
        skill: ['JavaScript'],
      };

      const result = await instance._call(testData);
      
      expect(result).toBe('Error: Network error');
    });
  });

  describe('API URL configuration', () => {
    it('should use baseUrl from constructor', async () => {
      const customUrl = 'https://custom.api.com/generate';
      const instance = new GenerateCV({
        override: true,
        GENERATE_CV_API_KEY: mockApiKey,
        GENERATE_CV_API_URL: customUrl,
      });

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const testData = {
        name: 'John Doe',
        position: 'Software Engineer',
        info: [{ icon: 'email', data: 'john@example.com' }],
        summary: 'Experienced developer',
        skill: ['JavaScript'],
      };

      await instance._call(testData);
      
      expect(fetch).toHaveBeenCalledWith(
        customUrl,
        expect.any(Object),
      );
    });
  });
});
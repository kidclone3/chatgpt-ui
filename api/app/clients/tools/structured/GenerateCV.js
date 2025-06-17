const { Tool } = require('@langchain/core/tools');
const { z } = require('zod');
const { getEnvironmentVariable } = require('@langchain/core/utils/env');
const fetch = require('node-fetch');

class GenerateCV extends Tool {
  static lc_name() {
    return 'GenerateCV';
  }

  constructor(fields = {}) {
    super(fields);
    this.name = 'generate_cv';
    this.envVar = 'GENERATE_CV_API_KEY';
    this.urlEnvVar = 'GENERATE_CV_API_URL';
    this.override = fields.override ?? false;
    this.apiKey = fields[this.envVar] ?? this.getApiKey();
    this.baseUrl = fields[this.urlEnvVar] ?? this.getApiUrl();
    
    this.description = 'Generate professional CV/resume documents by calling the CV generation API. Useful for creating formatted resumes and CVs.';
    
    this.schema = z.object({
      name: z.string().min(0).max(100).describe('Your name'),
      position: z.string().min(0).max(50).describe('Position of the user'),
      info: z.array(z.object({
        icon: z.string().describe('Icon identifier'),
        data: z.string().describe('Information data'),
      })).describe('Contact and personal information details'),
      summary: z.string().min(0).max(500).describe('Summary of the user'),
      skill: z.union([z.string(), z.array(z.string())]).describe('Skills (can be string or array)'),
      certificate: z.array(z.object({
        year: z.string().describe('Certificate year'),
        name: z.string().describe('Certificate name'),
        extra: z.union([z.string(), z.array(z.string())]).describe('Additional certificate details'),
      })).optional().describe('Certifications'),
      education: z.array(z.object({
        place: z.string().describe('Educational institution'),
        major: z.string().describe('Major/field of study'),
        time: z.string().describe('Time period'),
        extra: z.union([z.string(), z.array(z.string())]).describe('Additional education details'),
      })).optional().describe('Educational background'),
      experience: z.array(z.object({
        place: z.string().describe('Company/organization name'),
        phase: z.array(z.object({
          time: z.string().describe('Time period'),
          position: z.string().describe('Job position'),
          detail: z.union([z.string(), z.array(z.string())]).describe('Job details'),
        })).describe('Work phases at this place'),
      })).optional().describe('Work experience'),
      project: z.array(z.object({
        place: z.string().describe('Project location/organization'),
        phase: z.array(z.object({
          time: z.string().describe('Project time period'),
          position: z.string().describe('Role in project'),
          detail: z.union([z.string(), z.array(z.string())]).describe('Project details'),
        })).describe('Project phases'),
      })).optional().describe('Projects'),
      activity: z.array(z.object({
        place: z.string().describe('Activity location/organization'),
        phase: z.array(z.object({
          time: z.string().describe('Activity time period'),
          position: z.string().describe('Role in activity'),
          detail: z.union([z.string(), z.array(z.string())]).describe('Activity details'),
        })).describe('Activity phases'),
      })).optional().describe('Activities'),
      reference: z.array(z.object({
        name: z.string().describe('Reference name'),
        position: z.string().describe('Reference position'),
        phone: z.string().describe('Reference phone'),
        email: z.string().describe('Reference email'),
      })).optional().describe('References'),
      params: z.object({}).optional().describe('Additional query parameters'),
    });
  }

  getApiKey() {
    const apiKey = getEnvironmentVariable(this.envVar);
    if (!apiKey && !this.override) {
      throw new Error(`Missing ${this.envVar} environment variable.`);
    }
    return apiKey;
  }

  getApiUrl() {
    const url = getEnvironmentVariable(this.urlEnvVar);
    if (!url && !this.override) {
      throw new Error(`Missing ${this.urlEnvVar} environment variable.`);
    }
    return url || 'http://example.com/api/abc';
  }

  async _call(input) {
    try {
      const validationResult = this.schema.safeParse(input);
      if (!validationResult.success) {
        throw new Error(`Validation failed: ${JSON.stringify(validationResult.error.issues)}`);
      }

      const { params, ...cvData } = validationResult.data;
      const baseUrl = this.baseUrl;
      
      // Build URL with query parameters
      const url = new URL(baseUrl);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      // Remove params from cvData as it's not part of the API payload
      // The cvData now contains all the required fields matching the Python schema

      // Prepare request options (always POST for CV generation)
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(cvData),
      };

      const response = await fetch(url.toString(), requestOptions);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          `CV generation API request failed with status ${response.status}: ${json?.error || json?.message || JSON.stringify(json)}`
        );
      }

      return JSON.stringify(json);
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
}

module.exports = GenerateCV;
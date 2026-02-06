import { describe, expect, it } from 'vitest';
import { validateConfig } from './schema';

describe('validateConfig', () => {
  describe('valid configs', () => {
    it('should accept valid config with all fields', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              template: 'emails/welcome.tsx',
              workflowId: 'onboarding',
              subject: 'Welcome!',
            },
          },
        },
        outDir: './novu',
        apiUrl: 'https://api.novu.co',
        aliases: {
          '@emails': './src/emails',
        },
      };

      expect(() => validateConfig(config)).not.toThrow();
      const result = validateConfig(config);
      expect(result.steps.email['welcome-email'].subject).toBe('Welcome!');
    });

    it('should accept valid config with optional subject', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              template: 'emails/welcome.tsx',
              workflowId: 'onboarding',
            },
          },
        },
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should accept valid config with multiple steps', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              template: 'emails/welcome.tsx',
              workflowId: 'onboarding',
            },
            'invoice-email': {
              template: 'emails/invoice.tsx',
              workflowId: 'billing',
              subject: 'Your Invoice',
            },
          },
        },
      };

      expect(() => validateConfig(config)).not.toThrow();
    });
  });

  describe('invalid configs', () => {
    it('should reject non-object config', () => {
      expect(() => validateConfig(null)).toThrow('Invalid config: must be an object');
      expect(() => validateConfig(undefined)).toThrow('Invalid config: must be an object');
      expect(() => validateConfig('string')).toThrow('Invalid config: must be an object');
      expect(() => validateConfig(123)).toThrow('Invalid config: must be an object');
    });

    it('should reject missing steps field', () => {
      const config = {};

      expect(() => validateConfig(config)).toThrow('Invalid config: steps field is required and must be an object');
    });

    it('should reject missing steps.email field', () => {
      const config = {
        steps: {},
      };

      expect(() => validateConfig(config)).toThrow(
        'Invalid config: steps.email field is required and must be an object'
      );
    });

    it('should reject missing template in step config', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              workflowId: 'onboarding',
            },
          },
        },
      };

      expect(() => validateConfig(config)).toThrow(
        "steps.email['welcome-email'].template is required and must be a string"
      );
    });

    it('should reject missing workflowId in step config', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              template: 'emails/welcome.tsx',
            },
          },
        },
      };

      expect(() => validateConfig(config)).toThrow(
        "steps.email['welcome-email'].workflowId is required and must be a string"
      );
    });

    it('should reject invalid template type', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              template: 123,
              workflowId: 'onboarding',
            },
          },
        },
      };

      expect(() => validateConfig(config)).toThrow(
        "steps.email['welcome-email'].template is required and must be a string"
      );
    });

    it('should reject invalid workflowId type', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              template: 'emails/welcome.tsx',
              workflowId: null as string | undefined,
            },
          },
        },
      };

      expect(() => validateConfig(config)).toThrow(
        "steps.email['welcome-email'].workflowId is required and must be a string"
      );
    });

    it('should reject invalid subject type', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              template: 'emails/welcome.tsx',
              workflowId: 'onboarding',
              subject: 123,
            },
          },
        },
      };

      expect(() => validateConfig(config)).toThrow("steps.email['welcome-email'].subject must be a string");
    });

    it('should reject invalid outDir type', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              template: 'emails/welcome.tsx',
              workflowId: 'onboarding',
            },
          },
        },
        outDir: 123,
      };

      expect(() => validateConfig(config)).toThrow('outDir must be a string');
    });

    it('should reject invalid apiUrl type', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              template: 'emails/welcome.tsx',
              workflowId: 'onboarding',
            },
          },
        },
        apiUrl: true,
      };

      expect(() => validateConfig(config)).toThrow('apiUrl must be a string');
    });

    it('should reject invalid aliases type', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              template: 'emails/welcome.tsx',
              workflowId: 'onboarding',
            },
          },
        },
        aliases: 'invalid',
      };

      expect(() => validateConfig(config)).toThrow('aliases must be an object');
    });

    it('should reject alias target with non-string value', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              template: 'emails/welcome.tsx',
              workflowId: 'onboarding',
            },
          },
        },
        aliases: {
          '@emails': 123,
        },
      };

      expect(() => validateConfig(config)).toThrow("aliases['@emails'] must be a string");
    });

    it('should reject alias target with empty string value', () => {
      const config = {
        steps: {
          email: {
            'welcome-email': {
              template: 'emails/welcome.tsx',
              workflowId: 'onboarding',
            },
          },
        },
        aliases: {
          '@emails': '   ',
        },
      };

      expect(() => validateConfig(config)).toThrow("aliases['@emails'] cannot be empty");
    });

    it('should collect multiple errors', () => {
      const config = {
        steps: {
          email: {
            step1: {
              template: 'emails/step1.tsx',
            },
            step2: {
              workflowId: 'workflow2',
            },
          },
        },
      };

      expect(() => validateConfig(config)).toThrow('Configuration validation errors:');
      try {
        validateConfig(config);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message).toContain("steps.email['step1'].workflowId");
        expect(message).toContain("steps.email['step2'].template");
      }
    });
  });
});

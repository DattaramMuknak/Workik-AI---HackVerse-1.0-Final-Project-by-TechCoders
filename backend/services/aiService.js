// backend/services/aiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async generateTestSummaries(files) {
    try {
      const filesContext = files.map(file => ({
        path: file.path,
        language: file.language,
        contentPreview: file.content.substring(0, 2000) // First 2000 chars
      }));

      const prompt = `
As an expert test engineer, analyze these code files and generate comprehensive test case summaries.

Files to analyze:
${filesContext.map(file => `
File: ${file.path}
Language: ${file.language}
Code Preview:
\`\`\`${file.language}
${file.contentPreview}
\`\`\`
`).join('\n')}

Generate 5-8 test case summaries that cover:
1. Unit tests for individual functions/methods
2. Integration tests for component interactions  
3. Edge cases and error handling
4. Performance/load tests where applicable
5. Security tests if relevant

For each test case, provide:
- id: unique identifier
- title: descriptive test title
- description: what the test validates (2-3 sentences)
- testType: "unit", "integration", "e2e", "performance", "security"
- framework: recommended testing framework
- priority: "high", "medium", "low"

Return as JSON array only, no additional text:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const summaries = JSON.parse(jsonMatch[0]);
      
      // Add unique IDs if missing
      return summaries.map((summary, index) => ({
        id: summary.id || `test_${Date.now()}_${index}`,
        title: summary.title,
        description: summary.description,
        testType: summary.testType,
        framework: summary.framework,
        priority: summary.priority || 'medium'
      }));

    } catch (error) {
      console.error('Error generating test summaries:', error);
      // Return fallback summaries
      return this.getFallbackSummaries(files);
    }
  }

  async generateTestCode(files, summary) {
    try {
      const mainFile = files[0]; // Primary file for testing
      const language = mainFile.language;
      const framework = this.getTestFramework(language, summary.framework);

      const prompt = `
Generate complete, executable test code for this summary:

Title: ${summary.title}
Description: ${summary.description}
Test Type: ${summary.testType}
Framework: ${framework}

Source Code:
\`\`\`${language}
${mainFile.content}
\`\`\`

Requirements:
1. Generate complete, runnable test code
2. Use ${framework} framework
3. Include proper imports and setup
4. Add meaningful test data and assertions
5. Handle async operations if needed
6. Include error cases where applicable
7. Add descriptive test names and comments

File structure:
- Filename: ${this.getTestFileName(mainFile.path, framework)}
- Language: ${language}
- Framework: ${framework}

Return JSON with:
{
  "code": "complete test code",
  "filename": "test filename",
  "framework": "${framework}",
  "language": "${language}",
  "imports": ["list of required dependencies"],
  "setupInstructions": "how to run these tests"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error('Error generating test code:', error);
      return this.getFallbackTestCode(files[0], summary);
    }
  }

  getTestFramework(language, preferredFramework) {
    const frameworkMap = {
      javascript: preferredFramework || 'jest',
      typescript: preferredFramework || 'jest',
      python: preferredFramework || 'pytest',
      java: preferredFramework || 'junit',
      go: preferredFramework || 'testing',
      csharp: preferredFramework || 'xunit'
    };

    return frameworkMap[language] || 'jest';
  }

  getTestFileName(originalPath, framework) {
    const pathParts = originalPath.split('/');
    const filename = pathParts[pathParts.length - 1];
    const nameWithoutExt = filename.split('.')[0];
    
    const extensionMap = {
      jest: '.test.js',
      pytest: '_test.py',
      junit: 'Test.java',
      testing: '_test.go',
      xunit: 'Tests.cs'
    };

    const extension = extensionMap[framework] || '.test.js';
    return `${nameWithoutExt}${extension}`;
  }

  getFallbackSummaries(files) {
    const language = files[0]?.language || 'javascript';
    const framework = this.getTestFramework(language);

    return [
      {
        id: `fallback_unit_${Date.now()}`,
        title: `Unit Tests for ${files[0]?.path || 'Main Functions'}`,
        description: `Test individual functions and methods in the codebase for correct behavior with valid inputs and proper error handling.`,
        testType: 'unit',
        framework,
        priority: 'high'
      },
      {
        id: `fallback_integration_${Date.now()}`,
        title: 'Integration Tests',
        description: `Test the interaction between different components and modules to ensure they work together correctly.`,
        testType: 'integration',
        framework,
        priority: 'medium'
      },
      {
        id: `fallback_edge_${Date.now()}`,
        title: 'Edge Cases and Error Handling',
        description: `Test boundary conditions, invalid inputs, and error scenarios to ensure robust error handling.`,
        testType: 'unit',
        framework,
        priority: 'high'
      }
    ];
  }

  getFallbackTestCode(file, summary) {
    const language = file.language;
    const framework = this.getTestFramework(language);
    
    const templates = {
      javascript: {
        jest: `// ${summary.title}
import { ${this.extractFunctionNames(file.content).join(', ')} } from '../${file.path}';

describe('${summary.title}', () => {
  test('should handle valid inputs correctly', () => {
    // Arrange
    const input = 'test';
    
    // Act & Assert
    expect(true).toBe(true); // Replace with actual test
  });

  test('should handle edge cases', () => {
    // Test edge cases here
    expect(true).toBe(true);
  });
});`
      },
      python: {
        pytest: `# ${summary.title}
import pytest
from ${file.path.replace('.py', '').replace('/', '.')} import *

class Test${this.toPascalCase(file.path)}:
    def test_valid_inputs(self):
        """Test with valid inputs"""
        assert True  # Replace with actual test
        
    def test_edge_cases(self):
        """Test edge cases and boundary conditions"""
        assert True  # Replace with actual test`
      }
    };

    const template = templates[language]?.[framework] || templates.javascript.jest;
    
    return {
      code: template,
      filename: this.getTestFileName(file.path, framework),
      framework,
      language,
      imports: [`${framework}`],
      setupInstructions: `Run tests using: ${this.getRunCommand(framework)}`
    };
  }

  extractFunctionNames(code) {
    const functionRegex = /(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|\([^)]*\))/g;
    const matches = [];
    let match;
    
    while ((match = functionRegex.exec(code)) !== null) {
      matches.push(match[1]);
    }
    
    return matches.slice(0, 5); // Limit to first 5 functions
  }

  toPascalCase(str) {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  getRunCommand(framework) {
    const commands = {
      jest: 'npm test',
      pytest: 'pytest',
      junit: 'mvn test',
      testing: 'go test',
      xunit: 'dotnet test'
    };
    return commands[framework] || 'npm test';
  }
}

module.exports = new AIService();

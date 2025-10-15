/**
 * Specialized handlers for different question types
 * Based on the practice structure from W01D01, W01D03, W01D05, W02D01
 */

export class QuestionTypeHandlers {
  constructor() {
    this.arithmeticHandler = new ArithmeticHandler();
    this.functionHandler = new FunctionHandler();
    this.conditionalHandler = new ConditionalHandler();
    this.scopeHandler = new ScopeHandler();
    this.stringHandler = new StringHandler();
    this.syntaxHandler = new SyntaxHandler();
  }

  /**
   * Route question to appropriate handler based on type
   */
  handleQuestion(question, code, executionResults, codeAnalysis) {
    const handlers = {
      'arithmetic': this.arithmeticHandler,
      'function': this.functionHandler,
      'conditional': this.conditionalHandler,
      'scope': this.scopeHandler,
      'string': this.stringHandler,
      'syntax_fix': this.syntaxHandler,
      'expression': this.arithmeticHandler,
      'variable': this.stringHandler,
      'calculation': this.arithmeticHandler,
      'string_concatenation': this.stringHandler,
    };

    const handler = handlers[question.type] || this.arithmeticHandler;
    return handler.handle(question, code, executionResults, codeAnalysis);
  }
}

/**
 * Arithmetic and Expression Handler
 * Handles: W01D01 arithmetic expressions, calculations, type coercion
 */
class ArithmeticHandler {
  handle(question, code, executionResults, codeAnalysis) {
    const results = [];

    if (executionResults.outputs.length > 0) {
      for (const output of executionResults.outputs) {
        const validation = this.validateArithmeticOutput(output, question);
        if (validation.passed || validation.partialCredit > 0) {
          results.push({
            value: output,
            passed: validation.passed,
            confidence: validation.confidence,
            partialCredit: validation.partialCredit,
            method: 'execution',
            feedback: validation.feedback,
          });
        }
      }
    }

    const expressions = this.extractExpressions(code);
    for (const expr of expressions) {
      try {
        const result = this.evaluateExpression(expr);
        const validation = this.validateArithmeticOutput(result.toString(), question);
        if (validation.passed || validation.partialCredit > 0) {
          results.push({
            value: result.toString(),
            passed: validation.passed,
            confidence: validation.confidence,
            partialCredit: validation.partialCredit,
            method: 'expression-evaluation',
            feedback: validation.feedback,
          });
        }
      } catch (error) {

      }
    }

    for (const comment of codeAnalysis.commentLines) {
      const numbers = comment.match(/-?\d+\.?\d*/g);
      if (numbers) {
        for (const num of numbers) {
          const validation = this.validateArithmeticOutput(num, question);
          if (validation.passed || validation.partialCredit > 0) {
            results.push({
              value: num,
              passed: validation.passed,
              confidence: validation.confidence * 0.8, // Lower confidence for comments
              partialCredit: validation.partialCredit * 0.8,
              method: 'comments',
              feedback: validation.feedback,
            });
          }
        }
      }
    }

    return this.selectBestResult(results);
  }

  validateArithmeticOutput(output, question) {
    const cleanOutput = output.toString().trim();
    const expected = question.expectedValue;

    if (cleanOutput === expected.toString()) {
      return {
        passed: true,
        confidence: 1.0,
        partialCredit: 1.0,
        feedback: 'Perfect match!'
      };
    }

    const outputNum = parseFloat(cleanOutput);
    const expectedNum = parseFloat(expected);

    if (!isNaN(outputNum) && !isNaN(expectedNum)) {
      const difference = Math.abs(outputNum - expectedNum);
      const tolerance = Math.max(expectedNum * 0.01, 0.001); // 1% tolerance or 0.001 minimum

      if (difference <= tolerance) {
        return {
          passed: true,
          confidence: 1.0,
          partialCredit: 1.0,
          feedback: 'Correct numerical answer!'
        };
      } else if (difference <= expectedNum * 0.1) { // 10% tolerance for partial credit
        return {
          passed: false,
          confidence: 0.7,
          partialCredit: 0.5,
          feedback: 'Close but not exact. Partial credit given.'
        };
      }
    }

    return {
      passed: false,
      confidence: 0,
      partialCredit: 0,
      feedback: 'Incorrect answer'
    };
  }

  extractExpressions(code) {
    const expressions = [];
    const lines = code.split('\n');

    for (const line of lines) {

      const arithmeticMatches = line.match(/(\d+(?:\.\d+)?\s*[+\-*/%]\s*\d+(?:\.\d+)?(?:\s*[+\-*/%]\s*\d+(?:\.\d+)?)*)/g);
      if (arithmeticMatches) {
        expressions.push(...arithmeticMatches);
      }

      const parenMatches = line.match(/\([^)]*[\d+\-*/%][^)]*\)/g);
      if (parenMatches) {
        expressions.push(...parenMatches);
      }

      const coercionMatches = line.match(/\d+\s*\+\s*"[^"]*"|"[^"]*"\s*\+\s*\d+/g);
      if (coercionMatches) {
        expressions.push(...coercionMatches);
      }
    }

    return expressions;
  }

  evaluateExpression(expression) {
    try {

      const cleanExpr = expression.replace(/[^0-9+\-*/.() ]/g, '');
      return Function(`"use strict"; return (${cleanExpr})`)();
    } catch (error) {
      throw new Error(`Invalid expression: ${expression}`);
    }
  }

  selectBestResult(results) {
    if (results.length === 0) {
      return { found: false };
    }

    results.sort((a, b) => {
      if (a.passed !== b.passed) return b.passed - a.passed;
      return b.confidence - a.confidence;
    });

    return {
      found: true,
      ...results[0]
    };
  }
}

/**
 * Function Handler
 * Handles: W01D03 Functions - function definitions, parameters, return values
 */
class FunctionHandler {
  handle(question, code, executionResults, codeAnalysis) {
    const results = [];

    const functionTests = this.createFunctionTests(question);
    for (const test of functionTests) {
      try {
        const result = this.executeFunctionTest(code, test);
        const validation = this.validateFunctionOutput(result, test.expected);
        if (validation.passed || validation.partialCredit > 0) {
          results.push({
            value: result,
            passed: validation.passed,
            confidence: validation.confidence,
            partialCredit: validation.partialCredit,
            method: 'function-test',
            feedback: validation.feedback,
          });
        }
      } catch (error) {

      }
    }

    const functionDef = this.analyzeFunctionDefinition(code, question);
    if (functionDef.found) {
      results.push({
        value: functionDef.value,
        passed: functionDef.correct,
        confidence: functionDef.confidence,
        partialCredit: functionDef.partialCredit,
        method: 'function-analysis',
        feedback: functionDef.feedback,
      });
    }

    return this.selectBestResult(results);
  }

  createFunctionTests(question) {
    const tests = [];

    switch (question.id) {
      case 'Q1': // double function
        tests.push(
          { test: 'double(2)', expected: 4 },
          { test: 'double(5)', expected: 10 },
          { test: 'double(10)', expected: 20 }
        );
        break;
      case 'Q2': // fullName function
        tests.push(
          { test: 'fullName("John", "Doe")', expected: 'John Doe' },
          { test: 'fullName("Mark", "Smith")', expected: 'Mark Smith' }
        );
        break;
      case 'Q3': // average function
        tests.push(
          { test: 'average(20, 25)', expected: 22.5 },
          { test: 'average(15, 7)', expected: 11 }
        );
        break;

    }

    return tests;
  }

  executeFunctionTest(code, test) {
    try {

      const testCode = `
        ${code}
        ${test.test};
      `;

      const { spawnSync } = require('child_process');
      const fs = require('fs');

      fs.writeFileSync(testFile, testCode);

      const result = spawnSync('node', [testFile], { encoding: 'utf8' });

      fs.unlinkSync(testFile);

      if (result.status === 0) {
        return result.stdout.trim();
      } else {
        throw new Error(result.stderr);
      }
    } catch (error) {
      throw new Error(`Function test failed: ${error.message}`);
    }
  }

  validateFunctionOutput(output, expected) {
    const cleanOutput = output.toString().trim();
    const expectedStr = expected.toString();

    if (cleanOutput === expectedStr) {
      return {
        passed: true,
        confidence: 1.0,
        partialCredit: 1.0,
        feedback: 'Function works correctly!'
      };
    }

    const outputNum = parseFloat(cleanOutput);
    const expectedNum = parseFloat(expectedStr);

    if (!isNaN(outputNum) && !isNaN(expectedNum)) {
      const difference = Math.abs(outputNum - expectedNum);
      const tolerance = Math.max(expectedNum * 0.01, 0.001);

      if (difference <= tolerance) {
        return {
          passed: true,
          confidence: 1.0,
          partialCredit: 1.0,
          feedback: 'Function returns correct value!'
        };
      }
    }

    return {
      passed: false,
      confidence: 0,
      partialCredit: 0,
      feedback: 'Function does not return expected value'
    };
  }

  analyzeFunctionDefinition(code, question) {

    const functionName = this.extractFunctionName(question);
    const functionRegex = new RegExp(`const\\s+${functionName}\\s*=\\s*function\\s*\\([^)]*\\)\\s*\\{[^}]*\\}`, 'g');
    const match = code.match(functionRegex);

    if (match) {
      return {
        found: true,
        value: match[0],
        correct: true,
        confidence: 0.8,
        partialCredit: 0.8,
        feedback: 'Function definition found'
      };
    }

    return { found: false };
  }

  extractFunctionName(question) {

    const nameMatch = question.description.match(/(?:function|Function)\s+(\w+)/i);
    return nameMatch ? nameMatch[1] : 'unknown';
  }

  selectBestResult(results) {
    if (results.length === 0) {
      return { found: false };
    }

    results.sort((a, b) => {
      if (a.passed !== b.passed) return b.passed - a.passed;
      return b.confidence - a.confidence;
    });

    return {
      found: true,
      ...results[0]
    };
  }
}

/**
 * Conditional Logic Handler
 * Handles: W01D05 Conditionals - if/else statements, validation, error handling
 */
class ConditionalHandler {
  handle(question, code, executionResults, codeAnalysis) {
    const results = [];

    const testCases = this.createTestCases(question);
    for (const testCase of testCases) {
      try {
        const result = this.executeTestCase(code, testCase);
        const validation = this.validateConditionalOutput(result, testCase.expected);
        if (validation.passed || validation.partialCredit > 0) {
          results.push({
            value: result,
            passed: validation.passed,
            confidence: validation.confidence,
            partialCredit: validation.partialCredit,
            method: 'test-case',
            feedback: validation.feedback,
          });
        }
      } catch (error) {

      }
    }

    const logicAnalysis = this.analyzeConditionalLogic(code, question);
    if (logicAnalysis.found) {
      results.push({
        value: logicAnalysis.value,
        passed: logicAnalysis.correct,
        confidence: logicAnalysis.confidence,
        partialCredit: logicAnalysis.partialCredit,
        method: 'logic-analysis',
        feedback: logicAnalysis.feedback,
      });
    }

    return this.selectBestResult(results);
  }

  createTestCases(question) {
    const testCases = [];

    switch (question.id) {
      case 'Q5': // deposit function
        testCases.push(
          { input: 'deposit(100)', expected: 100 },
          { input: 'deposit(250)', expected: 250 },
          { input: 'deposit(-100)', expected: 'Please enter a positive number' },
          { input: 'deposit("100")', expected: 'Please enter a number' }
        );
        break;
      case 'Q6': // oddOrEven function
        testCases.push(
          { input: 'oddOrEven(1)', expected: '1 is odd' },
          { input: 'oddOrEven(2)', expected: '2 is even' },
          { input: 'oddOrEven(5)', expected: '5 is odd' },
          { input: 'oddOrEven(10)', expected: '10 is even' }
        );
        break;
      case 'Q7': // stringCase function
        testCases.push(
          { input: 'stringCase("JOHN")', expected: 'all upper case' },
          { input: 'stringCase("john")', expected: 'all lower case' },
          { input: 'stringCase("joHN")', expected: 'mix case' }
        );
        break;
      case 'Q8': // isLeapYear function
        testCases.push(
          { input: 'isLeapYear(2000)', expected: true },
          { input: 'isLeapYear(2004)', expected: true },
          { input: 'isLeapYear(2020)', expected: true },
          { input: 'isLeapYear(2021)', expected: false },
          { input: 'isLeapYear(2200)', expected: false }
        );
        break;
    }

    return testCases;
  }

  executeTestCase(code, testCase) {
    try {
      const testCode = `
        ${code}

      `;

      const { spawnSync } = require('child_process');
      const fs = require('fs');

      fs.writeFileSync(testFile, testCode);

      const result = spawnSync('node', [testFile], { encoding: 'utf8' });
      fs.unlinkSync(testFile);

      if (result.status === 0) {
        return result.stdout.trim();
      } else {
        throw new Error(result.stderr);
      }
    } catch (error) {
      throw new Error(`Test case execution failed: ${error.message}`);
    }
  }

  validateConditionalOutput(output, expected) {
    const cleanOutput = output.toString().trim();
    const expectedStr = expected.toString();

    if (cleanOutput === expectedStr) {
      return {
        passed: true,
        confidence: 1.0,
        partialCredit: 1.0,
        feedback: 'Conditional logic works correctly!'
      };
    }

    if (typeof expected === 'boolean') {
      const outputBool = cleanOutput.toLowerCase() === 'true';
      if (outputBool === expected) {
        return {
          passed: true,
          confidence: 1.0,
          partialCredit: 1.0,
          feedback: 'Boolean logic works correctly!'
        };
      }
    }

    if (typeof expected === 'string' && typeof cleanOutput === 'string') {
      const similarity = this.calculateStringSimilarity(cleanOutput, expectedStr);
      if (similarity >= 0.8) {
        return {
          passed: true,
          confidence: similarity,
          partialCredit: similarity,
          feedback: 'Close match for conditional logic!'
        };
      } else if (similarity >= 0.5) {
        return {
          passed: false,
          confidence: similarity,
          partialCredit: similarity * 0.7,
          feedback: 'Partial match for conditional logic'
        };
      }
    }

    return {
      passed: false,
      confidence: 0,
      partialCredit: 0,
      feedback: 'Conditional logic does not work as expected'
    };
  }

  analyzeConditionalLogic(code, question) {

    const hasIf = code.includes('if(') || code.includes('if ');
    const hasElse = code.includes('else');
    const hasReturn = code.includes('return');

    if (hasIf && hasReturn) {
      return {
        found: true,
        value: 'Conditional logic detected',
        correct: true,
        confidence: 0.7,
        partialCredit: 0.7,
        feedback: 'Basic conditional structure found'
      };
    }

    return { found: false };
  }

  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  selectBestResult(results) {
    if (results.length === 0) {
      return { found: false };
    }

    results.sort((a, b) => {
      if (a.passed !== b.passed) return b.passed - a.passed;
      return b.confidence - a.confidence;
    });

    return {
      found: true,
      ...results[0]
    };
  }
}

/**
 * Scope and Closure Handler
 * Handles: W02D01 Scopes - global variables, closures, state management
 */
class ScopeHandler {
  handle(question, code, executionResults, codeAnalysis) {
    const results = [];

    const stateTests = this.createStateTests(question);
    for (const test of stateTests) {
      try {
        const result = this.executeStateTest(code, test);
        const validation = this.validateStateOutput(result, test.expected);
        if (validation.passed || validation.partialCredit > 0) {
          results.push({
            value: result,
            passed: validation.passed,
            confidence: validation.confidence,
            partialCredit: validation.partialCredit,
            method: 'state-test',
            feedback: validation.feedback,
          });
        }
      } catch (error) {

      }
    }

    const scopeAnalysis = this.analyzeScope(code, question);
    if (scopeAnalysis.found) {
      results.push({
        value: scopeAnalysis.value,
        passed: scopeAnalysis.correct,
        confidence: scopeAnalysis.confidence,
        partialCredit: scopeAnalysis.partialCredit,
        method: 'scope-analysis',
        feedback: scopeAnalysis.feedback,
      });
    }

    return this.selectBestResult(results);
  }

  createStateTests(question) {
    const tests = [];

    switch (question.id) {
      case 'Q3': // countDown function
        tests.push(
          { sequence: ['countDown()', 'countDown()', 'countDown()', 'countDown()', 'countDown()', 'countDown()'],
            expected: [4, 3, 2, 1, 0, 'count down is over'] }
        );
        break;
      case 'Q4': // countUp function
        tests.push(
          { sequence: ['countUp()', 'countUp()', 'countUp()', 'countUp()', 'countUp()'],
            expected: [4, 5, 6, 7, 8] }
        );
        break;
      case 'Q5': // resetCount function
        tests.push(
          { sequence: ['resetCount(0)', 'countUp()', 'resetCount(10)', 'countUp()'],
            expected: ['the count has been reset', 1, 'the count has been reset', 11] }
        );
        break;
      case 'Q6': // addToList function
        tests.push(
          { sequence: ['addToList("Eat")', 'addToList("Play")', 'addToList("Sleep")', 'addToList("repeat")'],
            expected: ['Eat', 'Eat Play', 'Eat Play Sleep', 'Eat Play Sleep repeat'] }
        );
        break;
      case 'Q8': // deposit function
        tests.push(
          { sequence: ['deposit(100)', 'deposit(50)'],
            expected: [100, 150] }
        );
        break;
      case 'Q9': // withdraw function
        tests.push(
          { sequence: ['deposit(100)', 'deposit(50)', 'withdraw(70)', 'deposit(50)', 'withdraw(100)', 'withdraw(100)'],
            expected: [100, 150, 80, 130, 30, 'insufficient funds, current balance: 30'] }
        );
        break;
    }

    return tests;
  }

  executeStateTest(code, test) {
    try {
      const testCode = `
        ${code}
      `;

      const { spawnSync } = require('child_process');
      const fs = require('fs');

      fs.writeFileSync(testFile, testCode);

      const result = spawnSync('node', [testFile], { encoding: 'utf8' });
      fs.unlinkSync(testFile);

      if (result.status === 0) {
        return result.stdout.trim().split('\n').map(line => line.trim());
      } else {
        throw new Error(result.stderr);
      }
    } catch (error) {
      throw new Error(`State test execution failed: ${error.message}`);
    }
  }

  validateStateOutput(outputs, expected) {
    if (outputs.length !== expected.length) {
      return {
        passed: false,
        confidence: 0,
        partialCredit: 0,
        feedback: 'Incorrect number of outputs'
      };
    }

    let correctCount = 0;
    for (let i = 0; i < outputs.length; i++) {
      if (this.compareValues(outputs[i], expected[i])) {
        correctCount++;
      }
    }

    const percentage = correctCount / expected.length;

    if (percentage === 1.0) {
      return {
        passed: true,
        confidence: 1.0,
        partialCredit: 1.0,
        feedback: 'All state transitions correct!'
      };
    } else if (percentage >= 0.7) {
      return {
        passed: false,
        confidence: percentage,
        partialCredit: percentage * 0.8,
        feedback: `Most state transitions correct (${Math.round(percentage * 100)}%)`
      };
    } else {
      return {
        passed: false,
        confidence: percentage,
        partialCredit: percentage * 0.5,
        feedback: `Some state transitions correct (${Math.round(percentage * 100)}%)`
      };
    }
  }

  compareValues(actual, expected) {
    const actualStr = actual.toString().trim();
    const expectedStr = expected.toString().trim();

    if (actualStr === expectedStr) {
      return true;
    }

    const actualNum = parseFloat(actualStr);
    const expectedNum = parseFloat(expectedStr);

    if (!isNaN(actualNum) && !isNaN(expectedNum)) {
      const difference = Math.abs(actualNum - expectedNum);
      const tolerance = Math.max(expectedNum * 0.01, 0.001);
      return difference <= tolerance;
    }

    return false;
  }

  analyzeScope(code, question) {

    const hasGlobalVar = /(?:let|const|var)\s+\w+\s*=/.test(code);

    const hasClosure = /function\s*\([^)]*\)\s*\{[^}]*return\s+function/.test(code);

    const hasStateManagement = /(?:let|const|var)\s+\w+\s*=/.test(code) && /return/.test(code);

    if (hasGlobalVar || hasClosure || hasStateManagement) {
      return {
        found: true,
        value: 'Scope management detected',
        correct: true,
        confidence: 0.8,
        partialCredit: 0.8,
        feedback: 'Scope and state management patterns found'
      };
    }

    return { found: false };
  }

  selectBestResult(results) {
    if (results.length === 0) {
      return { found: false };
    }

    results.sort((a, b) => {
      if (a.passed !== b.passed) return b.passed - a.passed;
      return b.confidence - a.confidence;
    });

    return {
      found: true,
      ...results[0]
    };
  }
}

/**
 * String Handler
 * Handles: String operations, concatenation, case conversion
 */
class StringHandler {
  handle(question, code, executionResults, codeAnalysis) {
    const results = [];

    const stringTests = this.createStringTests(question);
    for (const test of stringTests) {
      try {
        const result = this.executeStringTest(code, test);
        const validation = this.validateStringOutput(result, test.expected);
        if (validation.passed || validation.partialCredit > 0) {
          results.push({
            value: result,
            passed: validation.passed,
            confidence: validation.confidence,
            partialCredit: validation.partialCredit,
            method: 'string-test',
            feedback: validation.feedback,
          });
        }
      } catch (error) {

      }
    }

    const stringAnalysis = this.analyzeStringOperations(code, question);
    if (stringAnalysis.found) {
      results.push({
        value: stringAnalysis.value,
        passed: stringAnalysis.correct,
        confidence: stringAnalysis.confidence,
        partialCredit: stringAnalysis.partialCredit,
        method: 'string-analysis',
        feedback: stringAnalysis.feedback,
      });
    }

    return this.selectBestResult(results);
  }

  createStringTests(question) {
    const tests = [];

    switch (question.id) {
      case 'Q1': // toLowerOrUpperCase function
        tests.push(
          { input: 'toLowerOrUpperCase("HELLO WORLD", "lower")', expected: 'hello world' },
          { input: 'toLowerOrUpperCase("my name is john", "upper")', expected: 'MY NAME IS JOHN' },
          { input: 'toLowerOrUpperCase("my name is john", "mixed")', expected: 'String case must be lower or upper' }
        );
        break;
      case 'Q2': // howLong function
        tests.push(
          { input: 'howLong("and")', expected: 'short' },
          { input: 'howLong("function")', expected: 'medium' },
          { input: 'howLong("corresponding")', expected: 'long' },
          { input: 'howLong("Supercalifragilisticexpialidocious")', expected: 'very long' }
        );
        break;
      case 'Q3': // startsWith function
        tests.push(
          { input: 'startsWith("Hello", "h")', expected: true },
          { input: 'startsWith("hello", "h")', expected: true },
          { input: 'startsWith("hello", "a")', expected: false },
          { input: 'startsWith("World", "h")', expected: false }
        );
        break;
      case 'Q4': // endsWith function
        tests.push(
          { input: 'endsWith("Hello", "o")', expected: true },
          { input: 'endsWith("Hello", "O")', expected: true },
          { input: 'endsWith("hellO", "o")', expected: true },
          { input: 'endsWith("World", "h")', expected: false }
        );
        break;
    }

    return tests;
  }

  executeStringTest(code, test) {
    try {
      const testCode = `
        ${code}

      `;

      const { spawnSync } = require('child_process');
      const fs = require('fs');

      fs.writeFileSync(testFile, testCode);

      const result = spawnSync('node', [testFile], { encoding: 'utf8' });
      fs.unlinkSync(testFile);

      if (result.status === 0) {
        return result.stdout.trim();
      } else {
        throw new Error(result.stderr);
      }
    } catch (error) {
      throw new Error(`String test execution failed: ${error.message}`);
    }
  }

  validateStringOutput(output, expected) {
    const cleanOutput = output.toString().trim();
    const expectedStr = expected.toString();

    if (cleanOutput === expectedStr) {
      return {
        passed: true,
        confidence: 1.0,
        partialCredit: 1.0,
        feedback: 'String operation works correctly!'
      };
    }

    if (typeof expected === 'boolean') {
      const outputBool = cleanOutput.toLowerCase() === 'true';
      if (outputBool === expected) {
        return {
          passed: true,
          confidence: 1.0,
          partialCredit: 1.0,
          feedback: 'Boolean string operation works correctly!'
        };
      }
    }

    const similarity = this.calculateStringSimilarity(cleanOutput, expectedStr);
    if (similarity >= 0.8) {
      return {
        passed: true,
        confidence: similarity,
        partialCredit: similarity,
        feedback: 'Close string match!'
      };
    } else if (similarity >= 0.5) {
      return {
        passed: false,
        confidence: similarity,
        partialCredit: similarity * 0.7,
        feedback: 'Partial string match'
      };
    }

    return {
      passed: false,
      confidence: 0,
      partialCredit: 0,
      feedback: 'String operation does not work as expected'
    };
  }

  analyzeStringOperations(code, question) {

    const hasStringMethods = /\.(toLowerCase|toUpperCase|length|startsWith|endsWith|charAt)/.test(code);

    const hasConcatenation = /"[^"]*"\s*\+\s*"[^"]*"|"[^"]*"\s*\+\s*\w+|\w+\s*\+\s*"[^"]*"/.test(code);

    const hasStringOps = hasStringMethods || hasConcatenation;

    if (hasStringOps) {
      return {
        found: true,
        value: 'String operations detected',
        correct: true,
        confidence: 0.8,
        partialCredit: 0.8,
        feedback: 'String manipulation patterns found'
      };
    }

    return { found: false };
  }

  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  selectBestResult(results) {
    if (results.length === 0) {
      return { found: false };
    }

    results.sort((a, b) => {
      if (a.passed !== b.passed) return b.passed - a.passed;
      return b.confidence - a.confidence;
    });

    return {
      found: true,
      ...results[0]
    };
  }
}

/**
 * Syntax Handler
 * Handles: Syntax error detection and correction
 */
class SyntaxHandler {
  handle(question, code, executionResults, codeAnalysis) {
    const results = [];

    const syntaxErrors = this.detectSyntaxErrors(code);
    if (syntaxErrors.length > 0) {
      results.push({
        value: syntaxErrors.join(', '),
        passed: false,
        confidence: 0.9,
        partialCredit: 0,
        method: 'syntax-detection',
        feedback: 'Syntax errors detected'
      });
    }

    const corrections = this.analyzeSyntaxCorrections(code, question);
    if (corrections.found) {
      results.push({
        value: corrections.value,
        passed: corrections.correct,
        confidence: corrections.confidence,
        partialCredit: corrections.partialCredit,
        method: 'syntax-correction',
        feedback: corrections.feedback,
      });
    }

    return this.selectBestResult(results);
  }

  detectSyntaxErrors(code) {
    const errors = [];

    if (code.includes('const @')) {
      errors.push('Invalid variable name with @ symbol');
    }
    if (code.includes("const '")) {
      errors.push('Invalid variable name with quotes');
    }
    if (code.includes('const const')) {
      errors.push('Reserved word used as variable name');
    }
    if (code.includes('const variable 1')) {
      errors.push('Invalid variable name with space');
    }

    return errors;
  }

  analyzeSyntaxCorrections(code, question) {

    const correctedPatterns = [
      /const\s+name\s*=\s*['"][^'"]*['"]/,
      /const\s+age\s*=\s*\d+/,
      /const\s+constantValue\s*=\s*['"][^'"]*['"]/,
      /const\s+variable1\s*=\s*['"][^'"]*['"]/
    ];

    for (const pattern of correctedPatterns) {
      if (pattern.test(code)) {
        return {
          found: true,
          value: 'Syntax correction detected',
          correct: true,
          confidence: 0.9,
          partialCredit: 0.9,
          feedback: 'Corrected syntax found'
        };
      }
    }

    return { found: false };
  }

  selectBestResult(results) {
    if (results.length === 0) {
      return { found: false };
    }

    results.sort((a, b) => {
      if (a.passed !== b.passed) return b.passed - a.passed;
      return b.confidence - a.confidence;
    });

    return {
      found: true,
      ...results[0]
    };
  }
}

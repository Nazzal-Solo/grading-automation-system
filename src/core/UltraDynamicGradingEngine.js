import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class UltraDynamicGradingEngine {
  constructor(config) {
    this.config = config;
    this.results = [];
    this.questionTypeHandlers = this.initializeQuestionHandlers();
  }
  initializeQuestionHandlers() {
    return {
      variable: new VariableHandler(),
      syntax_fix: new SyntaxFixHandler(),
      arithmetic: new ArithmeticHandler(),
      expression: new ArithmeticHandler(),
      calculation: new CalculationHandler(),
      algebra: new AlgebraHandler(),
      string_operation: new StringOperationHandler(),
      string_concatenation: new StringConcatenationHandler(),
      function_definition: new FunctionDefinitionHandler(),
      object_iteration_function: new FunctionDefinitionHandler(),
      function_composition: new FunctionCompositionHandler(),
      hof_function: new FunctionDefinitionHandler(),
      closure_function: new FunctionDefinitionHandler(),
      array_function: new FunctionDefinitionHandler(), // Array functions
      object_function: new FunctionDefinitionHandler(), // Object functions
      iteration_function: new FunctionDefinitionHandler(), // Iteration functions
      recursive_function: new FunctionDefinitionHandler(), // Recursive functions

      object_manipulation: new ObjectManipulationHandler(),
      factory_function: new FunctionDefinitionHandler(), // Factory functions
      class_definition: new ClassDefinitionHandler(),
      class_method: new ClassMethodHandler(),
      class_inheritance: new ClassInheritanceHandler(),
      class_constructor: new ClassConstructorHandler(),
      static_method: new StaticMethodHandler(),
      encapsulation: new EncapsulationHandler(),

      scope_prediction: new ScopePredictionHandler(),

      real_world: new RealWorldHandler(),
      geometry: new GeometryHandler(),
      conversion: new ConversionHandler(),

      html_css: new HTMLCSSHandler(),

      html_js_dom: new HTMLJSHandler(),

      file_system: new FileSystemHandler(),

      default: new DefaultHandler(),
    };
  }

  /**
   * Main grading method - ultra flexible and dynamic
   */
  gradeSubmission(studentId, lectureId, filePath) {
    try {

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fullCode = fs.readFileSync(filePath, "utf8");
      const lectureConfig = this.getLectureConfig(lectureId);

      if (!lectureConfig) {
        throw new Error(`Lecture config not found: ${lectureId}`);
      }

      const questions = lectureConfig.questions;
      const gradingResults = this.gradeQuestionsUltraDynamic(
        questions,
        fullCode,
        lectureId,
        filePath
      );

      const result = {
        studentId,
        lectureId,
        filePath,
        timestamp: new Date().toISOString(),
        score: gradingResults.score,
        totalWeight: gradingResults.totalWeight,
        percentage: gradingResults.percentage,
        results: gradingResults.results,
        gradingMethod: "ultra_dynamic",
        metadata: {
          codeLength: fullCode.length,
          linesOfCode: fullCode.split("\n").length,
          questionCount: questions.length,
          passedQuestions: gradingResults.results.filter((r) => r.passed)
            .length,
        },
      };

      this.results.push(result);
      return result;
    } catch (error) {
      return {
        studentId,
        lectureId,
        filePath,
        timestamp: new Date().toISOString(),
        score: 0,
        totalWeight: 0,
        percentage: 0,
        results: [],
        error: error.message,
        gradingMethod: "ultra_dynamic",
      };
    }
  }

  /**
   * Ultra dynamic question grading with maximum flexibility
   */
  gradeQuestionsUltraDynamic(questions, fullCode, lectureId, filePath) {
    const results = [];
    let score = 0;
    let totalWeight = 0;

      `📝 Grading ${questions.length} questions with ultra dynamic detection...`
    );

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const weight = Number.isFinite(question?.weight)
        ? question.weight
        : Number.isFinite(question?.points)
        ? question.points
        : 1;
      totalWeight += weight;

        `\n🔍 Question ${i + 1}: ${question.type} - ${question.description}`
      );

      const handler =
        this.questionTypeHandlers[question.type] ||
        this.questionTypeHandlers.default;

        `   🔍 Handler for ${question.type}: ${handler.constructor.name}`
      );

      if (
        (question.type === "html_css" || question.type === "html_js_dom") &&
        typeof handler.prepareFileContext === "function"
      ) {
        try {
          handler.prepareFileContext(filePath, fullCode);
        } catch (e) {
        }
      }

      if (
        question.type === "file_system" &&
        typeof handler.prepareFileContext === "function"
      ) {
        let projectDir = path.dirname(filePath);

        if (
          lectureId === "W12D01_React_Intro" ||
          lectureId === "W12D03_React_Hooks" ||
          lectureId === "W12D05_React_Context" ||
          lectureId === "W13D03_Redux"
        ) {
          if (projectDir.endsWith("src")) {
            projectDir = path.dirname(projectDir);
          }
          const reactProjectFolders = [
            "app-name",
            "React-StarterCode",
            "test",
            "react_blog",
            "react-name",
            "app", // Added for Yazan
            "my-context-app", // Added for Eid
            "context-practice", // Added for Al_Hadba
            "app-context", // Added for Saeed
            "react", // Added for Najjar
            "counter", // Added for Najjar Redux
            "redux", // Added for Al_Hadba Redux
          ];
          for (const folder of reactProjectFolders) {
            if (projectDir.includes(folder)) {
              const parts = projectDir.split(path.sep);
              const folderIndex = parts.indexOf(folder);
              if (folderIndex !== -1) {
                projectDir = parts.slice(0, folderIndex + 1).join(path.sep);
                break;
              }
            }
          }
        }

        handler.prepareFileContext(projectDir);
      }
      const answerResult = handler.findAnswer(question, fullCode, i, lectureId);

      results.push({
        questionIndex: i,
        questionId: question.id,
        question: question.description,
        output: answerResult.output,
        passed: answerResult.passed,
        expected: question.expectedValue || question.expectedType,
        method: answerResult.method,
        confidence: answerResult.confidence,
        weight: weight,
        category: question.category,
        type: question.type,
        partialCredit: answerResult.partialCredit,
        feedback: answerResult.feedback,
        detectionDetails: answerResult.detectionDetails,
        alternatives: answerResult.alternatives || [],
      });

      if (answerResult.passed) {
        score += weight * (answerResult.partialCredit || 1);
      }

        `   ${answerResult.passed ? "✅" : "❌"} ${answerResult.method} (${
          answerResult.confidence
        }% confidence)`
      );
    }

    return {
      score,
      totalWeight,
      percentage: totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0,
      results,
    };
  }

  /**
   * Get lecture configuration
   */
  getLectureConfig(lectureId) {
    try {
      const projectRoot = path.join(__dirname, "..", "..");

      const specificLectureId = lectureId.toLowerCase();
      const specificEnhancedConfigPath = path.join(
        projectRoot,
        "config",
        `${specificLectureId}-enhanced.json`
      );

      if (fs.existsSync(specificEnhancedConfigPath)) {
          `📋 Loading enhanced config from: ${specificEnhancedConfigPath}`
        );
        const config = JSON.parse(
          fs.readFileSync(specificEnhancedConfigPath, "utf8")
        );
        if (config.lectures) {
          const lecture = config.lectures.find((l) => l.id === lectureId);
          if (lecture) {
            return lecture;
          }
        }
          `📋 Using config directly: ${config.lectureId || "no lectureId"}`
        );
        return config;
      }

      const baseLectureId = lectureId.split("_")[0].toLowerCase();
      const enhancedConfigPath = path.join(
        projectRoot,
        "config",
        `${baseLectureId}-enhanced.json`
      );

      if (fs.existsSync(enhancedConfigPath)) {
        const config = JSON.parse(fs.readFileSync(enhancedConfigPath, "utf8"));
        if (config.lectures) {
          const lecture = config.lectures.find((l) => l.id === lectureId);
          if (lecture) {
            return lecture;
          }
        }
        return config;
      }

      const mainConfigPath = path.join(projectRoot, "config", "lectures.json");
      if (fs.existsSync(mainConfigPath)) {
        const config = JSON.parse(fs.readFileSync(mainConfigPath, "utf8"));
        if (config.lectures) {
          const lecture = config.lectures.find((l) => l.id === lectureId);
          if (lecture) {
            return lecture;
          }
        }
      }

      return null;
    } catch (error) {
        `Error loading lecture config for ${lectureId}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Clean and normalize code for analysis
   */
  cleanCode(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
      .replace(/\/\/.*$/gm, "") // Remove line comments
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  /**
   * Extract all variable declarations from code
   */
  extractVariables(code) {
    const variables = {};
    const varRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g;
    let match;

    while ((match = varRegex.exec(code)) !== null) {
      const varName = match[1];
      const varValue = match[2].trim();
      variables[varName] = varValue;
    }

    return variables;
  }

  /**
   * Extract all function definitions from code
   */
  extractFunctions(code) {
    const functions = {};

    const funcDeclRegex =
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{[^}]*\}/g;
    let match;
    while ((match = funcDeclRegex.exec(code)) !== null) {
      functions[match[1]] = match[0];
    }

    const arrowFuncRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>\s*[^{]*\{[^}]*\}/g;
    while ((match = arrowFuncRegex.exec(code)) !== null) {
      functions[match[1]] = match[0];
    }

    return functions;
  }

  /**
   * Execute code safely and get results
   */
  executeCode(code) {
    try {
      const safeCode = `
        (function() {
          const results = {};
          try {
            ${code}
            return results;
          } catch (error) {
            return { error: error.message };
          }
        })();
      `;

      return eval(safeCode);
    } catch (error) {
      return { error: error.message };
    }
  }
}

/**
 * Base Handler Class
 */
class BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {
    throw new Error("findAnswer method must be implemented by subclass");
  }

  /**
   * Extract value from various formats
   */
  extractValue(value) {
    if (typeof value === "string") {
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        return value.slice(1, -1);
      }
      if (!isNaN(value) && !isNaN(parseFloat(value))) {
        return parseFloat(value);
      }
    }
    return value;
  }

  /**
   * Check if two values are equivalent
   */
  valuesEqual(actual, expected) {
    const actualValue = this.extractValue(actual);
    const expectedValue = this.extractValue(expected);

    if (typeof actualValue === "number" && typeof expectedValue === "number") {
      return Math.abs(actualValue - expectedValue) < 0.001;
    }

    return (
      String(actualValue).toLowerCase() === String(expectedValue).toLowerCase()
    );
  }
}

/**
 * Variable Handler - Handles variable definition questions
 */
class VariableHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {
    const variables = this.extractAllVariables(code);
    const expectedType = question.expectedType;


    for (const [varName, varValue] of Object.entries(variables)) {
      const cleanedValue = this.extractValue(varValue);
      const valueType = typeof cleanedValue;

        `   🔍 Checking ${varName} = ${varValue} (type: ${valueType})`
      );

      if (this.isCorrectType(cleanedValue, expectedType)) {
        return {
          output: `${varName} = ${cleanedValue}`,
          passed: true,
          method: "variable_detection",
          confidence: 95,
          partialCredit: 1,
          feedback: `Found correct ${expectedType} variable: ${varName}`,
          detectionDetails: {
            variableName: varName,
            variableValue: cleanedValue,
            variableType: valueType,
          },
        };
      }
    }

    return {
      output: "No matching variable found",
      passed: false,
      method: "variable_detection",
      confidence: 0,
      feedback: `Could not find a ${expectedType} variable in the code`,
      detectionDetails: { foundVariables: Object.keys(variables) },
    };
  }

  extractAllVariables(code) {
    const variables = {};

    const patterns = [
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g,
      /\/\/\s*(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g,
      /\/\*[\s\S]*?(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?[\s\S]*?\*\//g,
      /console\.log\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g,
      /return\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const varName = match[1];
        const varValue = match[2] ? match[2].trim() : "found";
        variables[varName] = varValue;
      }
    });

    const commentPattern =
      /\/\/\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=:]\s*([^\n]+)/g;
    let match;
    while ((match = commentPattern.exec(code)) !== null) {
      const varName = match[1];
      const varValue = match[2].trim();
      variables[varName] = varValue;
    }

    return variables;
  }

  isCorrectType(value, expectedType) {
    switch (expectedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      default:
        return true; // Accept any type if not specified
    }
  }
}

/**
 * Arithmetic Handler - Handles arithmetic and calculation questions
 */
class ArithmeticHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {
    const expectedValue = question.expectedValue;

    const methods = [
      () => this.findDirectExpression(code, expectedValue),
      () => this.findVariableWithResult(code, expectedValue),
      () => this.findCommentedResult(code, expectedValue),
      () => this.findConsoleLog(code, expectedValue),
    ];

    for (const method of methods) {
      const result = method();
      if (result.passed) {
        return result;
      }
    }

    return {
      output: "No matching arithmetic result found",
      passed: false,
      method: "arithmetic_detection",
      confidence: 0,
      feedback: `Could not find arithmetic result: ${expectedValue}`,
    };
  }

  findDirectExpression(code, expectedValue) {
    const expressions = this.extractExpressions(code);

    for (const expr of expressions) {
      try {
        const cleanExpr = expr.replace(/[^\d+\-*\/%\s().]/g, "");
        if (cleanExpr.length < 2) continue;

        const result = eval(cleanExpr);
        if (this.valuesEqual(result, expectedValue)) {
          return {
            output: `${expr} = ${result}`,
            passed: true,
            method: "direct_expression",
            confidence: 90,
            feedback: `Found matching expression: ${expr}`,
          };
        }
      } catch (error) {
        const numbers = expr.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          const numericResult = numbers
            .map((n) => parseInt(n))
            .reduce((a, b) => a + b, 0);
          if (this.valuesEqual(numericResult, expectedValue)) {
            return {
              output: `${expr} ≈ ${numericResult}`,
              passed: true,
              method: "numeric_extraction",
              confidence: 70,
              feedback: `Found numeric match: ${expr}`,
            };
          }
        }
      }
    }

    return { passed: false };
  }

  findVariableWithResult(code, expectedValue) {
    const variables = this.extractAllVariables(code);

    for (const [varName, varValue] of Object.entries(variables)) {
      try {
        const cleanValue = varValue.replace(/[^\d+\-*\/%\s().]/g, "");
        if (cleanValue.length < 2) continue;

        const result = eval(cleanValue);
        if (this.valuesEqual(result, expectedValue)) {
          return {
            output: `${varName} = ${result}`,
            passed: true,
            method: "variable_expression",
            confidence: 85,
            feedback: `Found variable with correct result: ${varName}`,
          };
        }
      } catch (error) {
        const numbers = varValue.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          const numericResult = numbers
            .map((n) => parseInt(n))
            .reduce((a, b) => a + b, 0);
          if (this.valuesEqual(numericResult, expectedValue)) {
            return {
              output: `${varName} ≈ ${numericResult}`,
              passed: true,
              method: "variable_numeric",
              confidence: 75,
              feedback: `Found variable with numeric match: ${varName}`,
            };
          }
        }
      }
    }

    return { passed: false };
  }

  findCommentedResult(code, expectedValue) {
    const commentRegex = /\/\/\s*([^=\n]+)\s*=\s*([^\n]+)/g;
    let match;

    while ((match = commentRegex.exec(code)) !== null) {
      const expression = match[1].trim();
      const result = match[2].trim();

      if (this.valuesEqual(result, expectedValue)) {
        return {
          output: `// ${expression} = ${result}`,
          passed: true,
          method: "commented_result",
          confidence: 80,
          feedback: `Found result in comment: ${expression} = ${result}`,
        };
      }
    }

    return { passed: false };
  }

  findConsoleLog(code, expectedValue) {
    const consoleRegex = /console\.log\s*\(\s*([^)]+)\s*\)/g;
    let match;

    while ((match = consoleRegex.exec(code)) !== null) {
      try {
        const result = eval(match[1]);
        if (this.valuesEqual(result, expectedValue)) {
          return {
            passed: true,
            method: "console_output",
            confidence: 75,
          };
        }
      } catch (error) {
      }
    }

    return { passed: false };
  }

  extractExpressions(code) {
    const expressions = [];

    const patterns = [
      /([0-9+\-*\/%\s().]+)/g,
      /(?:const|let|var)\s+\w+\s*=\s*([^;]+)/g,
      /\/\/\s*([^=\n]+)\s*[=:]\s*([^\n]+)/g,
      /console\.log\s*\(\s*([^)]+)\s*\)/g,
      /return\s+([^;]+)/g,
      /(["'][^"']*["']\s*\+\s*["'][^"']*["'])/g,
      /(\d+\s*\+\s*["'][^"']*["'])/g,
      /(["'][^"']*["']\s*\+\s*\d+)/g,
      /([a-zA-Z_$][a-zA-Z0-9_$]*\s*[+\-*\/]\s*[a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /\([^)]*[+\-*\/][^)]*\)/g,
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const expr = match[1] || match[2];
        if (expr && expr.trim().length > 1) {
          expressions.push(expr.trim());
        }
      }
    });

    return expressions;
  }

  extractAllVariables(code) {
    const variables = {};
    const varRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g;
    let match;

    while ((match = varRegex.exec(code)) !== null) {
      variables[match[1]] = match[2].trim();
    }

    return variables;
  }
}

/**
 * Function Definition Handler
 */
class FunctionDefinitionHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {
    const expectedFunctionName = question.functionName;
    const expectedParameters = question.parameters || [];

      `   🔍 Looking for function: ${expectedFunctionName}(${expectedParameters.join(
        ", "
      )})`
    );

    const functions = this.extractAllFunctions(code);

    if (functions[expectedFunctionName]) {
      const funcCode = functions[expectedFunctionName];
      const hasCorrectParams = this.checkParameters(
        funcCode,
        expectedParameters
      );

      return {
        output: `function ${expectedFunctionName} found`,
        passed: true,
        method: "function_detection",
        confidence: hasCorrectParams ? 95 : 70,
        partialCredit: hasCorrectParams ? 1 : 0.7,
        feedback: `Found function ${expectedFunctionName}${
          hasCorrectParams
            ? " with correct parameters"
            : " with different parameters"
        }`,
        detectionDetails: {
          functionName: expectedFunctionName,
          functionCode: funcCode,
          parameterMatch: hasCorrectParams,
        },
      };
    }

    const lowerExpectedName = expectedFunctionName.toLowerCase();
    for (const [funcName, funcCode] of Object.entries(functions)) {
      if (funcName.toLowerCase() === lowerExpectedName) {
        const hasCorrectParams = this.checkParameters(
          funcCode,
          expectedParameters
        );
        return {
          output: `function ${funcName} found (case variation)`,
          passed: true,
          method: "function_detection",
          confidence: hasCorrectParams ? 90 : 65,
          partialCredit: hasCorrectParams ? 0.9 : 0.6,
          feedback: `Found function ${funcName} (case variation)${
            hasCorrectParams
              ? " with correct parameters"
              : " with different parameters"
          }`,
          detectionDetails: {
            functionName: funcName,
            functionCode: funcCode,
            parameterMatch: hasCorrectParams,
          },
        };
      }
    }

    const similarFunctions = this.findSimilarFunctions(
      functions,
      expectedFunctionName
    );
    if (similarFunctions.length > 0) {
      return {
        output: `Similar function found: ${similarFunctions[0]}`,
        passed: true,
        method: "similar_function",
        confidence: 60,
        partialCredit: 0.8,
        feedback: `Found similar function: ${similarFunctions[0]}`,
        alternatives: similarFunctions,
      };
    }

    return {
      output: `Function ${expectedFunctionName} not found`,
      passed: false,
      method: "function_detection",
      confidence: 0,
      feedback: `Could not find function ${expectedFunctionName}`,
    };
  }

  extractAllFunctions(code) {
    const functions = {};

    const funcDeclRegex =
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs;
    let match;
    while ((match = funcDeclRegex.exec(code)) !== null) {
      functions[match[1]] = match[0];
    }

    const arrowFuncRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs;
    while ((match = arrowFuncRegex.exec(code)) !== null) {
      functions[match[1]] = match[0];
    }

    const arrowFuncSimpleRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>\s*[^{;\n]+/g;
    while ((match = arrowFuncSimpleRegex.exec(code)) !== null) {
      functions[match[1]] = match[0];
    }

    const funcExprRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function\s*\([^)]*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs;
    while ((match = funcExprRegex.exec(code)) !== null) {
      functions[match[1]] = match[0];
    }

    const additionalFuncRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/g;
    while ((match = additionalFuncRegex.exec(code)) !== null) {
      if (!functions[match[1]]) {
        const funcStart = match.index;
        const funcName = match[1];

        const openBraceIndex = code.indexOf("{", match.index + match[0].length);
        if (openBraceIndex !== -1) {
          let braceCount = 1;
          let i = openBraceIndex + 1;

          while (i < code.length && braceCount > 0) {
            if (code[i] === "{") braceCount++;
            else if (code[i] === "}") braceCount--;
            i++;
          }

          if (braceCount === 0) {
            const funcEnd = i;
            const funcCode = code.substring(funcStart, funcEnd);
            functions[funcName] = funcCode;
          }
        }
      }
    }

    return functions;
  }

  checkParameters(funcCode, expectedParameters) {
    if (!funcCode || typeof funcCode !== "string") return false;

    const paramRegex = /\(([^)]*)\)/;
    const match = funcCode.match(paramRegex);

    if (!match) return false;

    const actualParams = match[1]
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p);
    return actualParams.length === expectedParameters.length;
  }

  findSimilarFunctions(functions, expectedName) {
    const similar = [];
    const expectedLower = expectedName.toLowerCase();

    for (const funcName of Object.keys(functions)) {
      const funcLower = funcName.toLowerCase();
      if (
        funcLower.includes(expectedLower) ||
        expectedLower.includes(funcLower)
      ) {
        similar.push(funcName);
      }
    }

    return similar;
  }
}

/**
 * String Operation Handler
 */
class StringOperationHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {
    const expectedValue = question.expectedValue;
    const expectedType = question.expectedType;

      `   🔍 Looking for string operation result: ${expectedValue} (${expectedType})`
    );

    const methods = [
      () => this.findStringExpression(code, expectedValue),
      () => this.findStringVariable(code, expectedValue),
      () => this.findCommentedStringResult(code, expectedValue),
    ];

    for (const method of methods) {
      const result = method();
      if (result.passed) {
        return result;
      }
    }

    return {
      output: "No matching string operation found",
      passed: false,
      method: "string_operation_detection",
      confidence: 0,
      feedback: `Could not find string operation result: ${expectedValue}`,
    };
  }

  findStringExpression(code, expectedValue) {
    const stringExprPatterns = [
      /["'][^"']*["']\s*[+\-*/]\s*["']?[^"']*["']?/g, // Basic string operations
      /["'][^"']*["']\s*\+\s*["'][^"']*["']/g, // String concatenation
      /\d+\s*\+\s*["'][^"']*["']/g, // Number + string
      /["'][^"']*["']\s*\+\s*\d+/g, // String + number
      /["'][^"']*["']\s*-\s*\d+/g, // String - number
      /\d+\s*-\s*["'][^"']*["']/g, // Number - string
      /["'][^"']*["']\s*-\s*["'][^"']*["']/g, // String - string
      /["'][^"']*["']\s*\+\s*["'][^"']*["']\s*\+\s*["'][^"']*["']/g, // Triple concatenation
      /\d+\s*\+\s*\d+\s*\+\s*["'][^"']*["']/g, // Number + number + string
      /["'][^"']*["']\s*\+\s*\d+\s*\+\s*\d+/g, // String + number + number
    ];

    for (const pattern of stringExprPatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        try {
          const expr = match[0].trim();
          const result = eval(expr);
          if (this.valuesEqual(result, expectedValue)) {
            return {
              output: `${expr} = ${result}`,
              passed: true,
              method: "string_expression",
              confidence: 90,
              feedback: `Found matching string expression: ${expr}`,
            };
          }
        } catch (error) {
        }
      }
    }

    return { passed: false };
  }

  findStringVariable(code, expectedValue) {
    const variables = this.extractAllVariables(code);

    for (const [varName, varValue] of Object.entries(variables)) {
      try {
        const result = eval(varValue);
        if (this.valuesEqual(result, expectedValue)) {
          return {
            output: `${varName} = ${result}`,
            passed: true,
            method: "string_variable",
            confidence: 85,
            feedback: `Found variable with correct string result: ${varName}`,
          };
        }
      } catch (error) {
      }
    }

    return { passed: false };
  }

  findCommentedStringResult(code, expectedValue) {
    const commentRegex = /\/\/\s*([^=\n]+)\s*=\s*["']([^"']+)["']/g;
    let match;

    while ((match = commentRegex.exec(code)) !== null) {
      const result = match[2];
      if (this.valuesEqual(result, expectedValue)) {
        return {
          output: `// ${match[1]} = "${result}"`,
          passed: true,
          method: "commented_string",
          confidence: 80,
          feedback: `Found string result in comment: ${result}`,
        };
      }
    }

    return { passed: false };
  }

  extractAllVariables(code) {
    const variables = {};
    const varRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g;
    let match;

    while ((match = varRegex.exec(code)) !== null) {
      variables[match[1]] = match[2].trim();
    }

    return variables;
  }
}

/**
 * Syntax Fix Handler
 */
class SyntaxFixHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {

    const correctedPatterns = this.findCorrectedSyntax(code);

    if (correctedPatterns.length > 0) {
      return {
        output: `Fixed syntax: ${correctedPatterns[0]}`,
        passed: true,
        method: "syntax_fix_detection",
        confidence: 90,
        feedback: `Found corrected syntax: ${correctedPatterns[0]}`,
        alternatives: correctedPatterns,
      };
    }

    return {
      output: "No syntax fix found",
      passed: false,
      method: "syntax_fix_detection",
      confidence: 0,
      feedback: "Could not find corrected syntax",
    };
  }

  findCorrectedSyntax(code) {
    const corrected = [];

    const varRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g;
    let match;

    while ((match = varRegex.exec(code)) !== null) {
      const varName = match[1];
      const varValue = match[2];

      if (this.isValidVariableName(varName) && this.isValidValue(varValue)) {
        corrected.push(`${varName} = ${varValue}`);
      }
    }

    return corrected;
  }

  isValidVariableName(name) {
    return (
      /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) &&
      !["const", "let", "var", "function"].includes(name)
    );
  }

  isValidValue(value) {
    return value && value.trim().length > 0;
  }
}

/**
 * String Concatenation Handler
 */
class StringConcatenationHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {

    const concatenations = this.findStringConcatenations(code);

    if (concatenations.length > 0) {
      return {
        output: `Found concatenation: ${concatenations[0]}`,
        passed: true,
        method: "string_concatenation_detection",
        confidence: 85,
        feedback: `Found string concatenation: ${concatenations[0]}`,
        alternatives: concatenations,
      };
    }

    return {
      output: "No string concatenation found",
      passed: false,
      method: "string_concatenation_detection",
      confidence: 0,
      feedback: "Could not find string concatenation",
    };
  }

  findStringConcatenations(code) {
    const concatenations = [];

    const concatRegex = /["'][^"']*["']\s*\+\s*["'][^"']*["']/g;
    let match;

    while ((match = concatRegex.exec(code)) !== null) {
      concatenations.push(match[0]);
    }

    const varConcatRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]*\+[^;]*);?/g;
    while ((match = varConcatRegex.exec(code)) !== null) {
      concatenations.push(`${match[1]} = ${match[2]}`);
    }

    return concatenations;
  }
}

/**
 * Algebra Handler
 */
class AlgebraHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {
    const expectedValue = question.expectedValue;

    const algebraicSolutions = this.findAlgebraicSolutions(code, expectedValue);

    if (algebraicSolutions.length > 0) {
      return {
        output: `Found solution: ${algebraicSolutions[0]}`,
        passed: true,
        method: "algebra_detection",
        confidence: 90,
        feedback: `Found algebraic solution: ${algebraicSolutions[0]}`,
        alternatives: algebraicSolutions,
      };
    }

    return {
      output: "No algebraic solution found",
      passed: false,
      method: "algebra_detection",
      confidence: 0,
      feedback: "Could not find algebraic solution",
    };
  }

  findAlgebraicSolutions(code, expectedValue) {
    const solutions = [];

    const varRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g;
    let match;

    while ((match = varRegex.exec(code)) !== null) {
      try {
        const result = eval(match[2]);
        if (this.valuesEqual(result, expectedValue)) {
          solutions.push(`${match[1]} = ${result}`);
        }
      } catch (error) {
      }
    }

    const algebraicPatterns = [
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g, // Variable reassignment
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\+\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g, // Variable equations
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*-\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g, // Variable equations
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\*\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g, // Variable equations
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\/\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g, // Variable equations
    ];

    for (const pattern of algebraicPatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        try {
          const expr = match[0].trim();
          const rightSide = match[match.length - 1];
          const result = eval(rightSide);
          if (this.valuesEqual(result, expectedValue)) {
            solutions.push(`${expr} = ${result}`);
          }
        } catch (error) {
        }
      }
    }

    return solutions;
  }
}

/**
 * Real World Handler
 */
class RealWorldHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {

    const calculations = this.findRealWorldCalculations(code);

    if (calculations.length > 0) {
      return {
        output: `Found calculation: ${calculations[0]}`,
        passed: true,
        method: "real_world_detection",
        confidence: 80,
        feedback: `Found real-world calculation: ${calculations[0]}`,
        alternatives: calculations,
      };
    }

    return {
      output: "No real-world calculation found",
      passed: false,
      method: "real_world_detection",
      confidence: 0,
      feedback: "Could not find real-world calculation",
    };
  }

  findRealWorldCalculations(code) {
    const calculations = [];

    const mathRegex = /([0-9+\-*\/%\s()]+)/g;
    let match;

    while ((match = mathRegex.exec(code)) !== null) {
      const expr = match[1].trim();
      if (expr.length > 3 && /^[0-9+\-*\/%\s()]+$/.test(expr)) {
        try {
          const result = eval(expr);
          calculations.push(`${expr} = ${result}`);
        } catch (error) {
        }
      }
    }

    return calculations;
  }
}

/**
 * Geometry Handler
 */
class GeometryHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {

    const geometricCalculations = this.findGeometricCalculations(code);

    if (geometricCalculations.length > 0) {
      return {
        output: `Found calculation: ${geometricCalculations[0]}`,
        passed: true,
        method: "geometry_detection",
        confidence: 85,
        feedback: `Found geometric calculation: ${geometricCalculations[0]}`,
        alternatives: geometricCalculations,
      };
    }

    return {
      output: "No geometric calculation found",
      passed: false,
      method: "geometry_detection",
      confidence: 0,
      feedback: "Could not find geometric calculation",
    };
  }

  findGeometricCalculations(code) {
    const calculations = [];

    const geometryKeywords = [
      "area",
      "perimeter",
      "circumference",
      "radius",
      "diameter",
      "length",
      "width",
    ];

    const varRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g;
    let match;

    while ((match = varRegex.exec(code)) !== null) {
      const varName = match[1].toLowerCase();
      const varValue = match[2];

      if (geometryKeywords.some((keyword) => varName.includes(keyword))) {
        try {
          const result = eval(varValue);
          calculations.push(`${match[1]} = ${result}`);
        } catch (error) {
        }
      }
    }

    return calculations;
  }
}

/**
 * Conversion Handler
 */
class ConversionHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {
    const expectedValue = question.expectedValue;

    const conversions = this.findConversionCalculations(code, expectedValue);

    if (conversions.length > 0) {
      return {
        output: `Found conversion: ${conversions[0]}`,
        passed: true,
        method: "conversion_detection",
        confidence: 90,
        feedback: `Found conversion calculation: ${conversions[0]}`,
        alternatives: conversions,
      };
    }

    return {
      output: "No conversion calculation found",
      passed: false,
      method: "conversion_detection",
      confidence: 0,
      feedback: "Could not find conversion calculation",
    };
  }

  findConversionCalculations(code, expectedValue) {
    const conversions = [];

    const conversionPatterns = [
      /([0-9]+)\s*[*]\s*9\s*\/\s*5\s*\+\s*32/g, // Celsius to Fahrenheit
      /([0-9]+)\s*[*]\s*9\s*\/\s*5\s*\+\s*32/g, // Celsius to Fahrenheit (alternative)
      /\(([0-9]+)\s*-\s*32\)\s*[*]\s*5\s*\/\s*9/g, // Fahrenheit to Celsius

      /([0-9]+)\s*[*]\s*24\s*[*]\s*60\s*[*]\s*60/g, // Days to seconds
      /([0-9]+)\s*[*]\s*60\s*[*]\s*60/g, // Hours to seconds
      /([0-9]+)\s*[*]\s*60/g, // Minutes to seconds
      /([0-9]+)\s*\/\s*60/g, // Seconds to minutes
      /([0-9]+)\s*\/\s*60\s*\/\s*60/g, // Seconds to hours
      /([0-9]+)\s*\/\s*60\s*\/\s*60\s*\/\s*24/g, // Seconds to days

      /([0-9]+)\s*[*]\s*1000/g, // Kilometers to meters
      /([0-9]+)\s*\/\s*1000/g, // Meters to kilometers
      /([0-9]+)\s*[*]\s*100/g, // Meters to centimeters
      /([0-9]+)\s*\/\s*100/g, // Centimeters to meters

      /([0-9]+)\s*[*]\s*1000/g, // Kilograms to grams
      /([0-9]+)\s*\/\s*1000/g, // Grams to kilograms

      /([0-9]+)\s*[*]\s*([0-9]+)/g, // Length * Width
      /([0-9]+)\s*[*]\s*([0-9]+)\s*[*]\s*2/g, // Perimeter calculation
      /([0-9]+)\s*[*]\s*([0-9]+)\s*[*]\s*([0-9]+)/g, // Volume calculation
    ];

    for (const pattern of conversionPatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        try {
          const expr = match[0].trim();
          const result = eval(expr);
          if (this.valuesEqual(result, expectedValue)) {
            conversions.push(`${expr} = ${result}`);
          }
        } catch (error) {
        }
      }
    }

    return conversions;
  }
}

/**
 * Function Composition Handler
 */
class FunctionCompositionHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {

    const compositions = this.findFunctionCompositions(code);

    if (compositions.length > 0) {
      return {
        output: `Found composition: ${compositions[0]}`,
        passed: true,
        method: "function_composition_detection",
        confidence: 85,
        feedback: `Found function composition: ${compositions[0]}`,
        alternatives: compositions,
      };
    }

    return {
      output: "No function composition found",
      passed: false,
      method: "function_composition_detection",
      confidence: 0,
      feedback: "Could not find function composition",
    };
  }

  findFunctionCompositions(code) {
    const compositions = [];

    const nestedCallRegex =
      /[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)[^)]*\)/g;
    let match;

    while ((match = nestedCallRegex.exec(code)) !== null) {
      compositions.push(match[0]);
    }

    return compositions;
  }
}

/**
 * Calculation Handler - Handles calculation questions
 */
class CalculationHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {
    const expectedValue = question.expectedValue;

    const methods = [
      () => this.findCalculationExpression(code, expectedValue),
      () => this.findCalculationVariable(code, expectedValue),
      () => this.findCalculationComment(code, expectedValue),
    ];

    for (const method of methods) {
      const result = method();
      if (result.passed) {
        return result;
      }
    }

    return {
      output: "No matching calculation found",
      passed: false,
      method: "calculation_detection",
      confidence: 0,
      feedback: `Could not find calculation result: ${expectedValue}`,
    };
  }

  findCalculationExpression(code, expectedValue) {
    const expressions = this.extractExpressions(code);

    for (const expr of expressions) {
      try {
        const cleanExpr = expr.replace(/[^\d+\-*\/%\s().]/g, "");
        if (cleanExpr.length < 2) continue;

        const result = eval(cleanExpr);
        if (this.valuesEqual(result, expectedValue)) {
          return {
            output: `${expr} = ${result}`,
            passed: true,
            method: "calculation_expression",
            confidence: 90,
            feedback: `Found matching calculation: ${expr}`,
          };
        }
      } catch (error) {
      }
    }

    const complexPatterns = [
      /(\d+\s*[*\/]\s*\d+\s*[*\/]\s*\d+)/g, // Multiple operations
      /(\d+\s*\+\s*\d+\s*\+\s*\d+)/g, // Multiple additions
      /(\d+\s*-\s*\d+\s*-\s*\d+)/g, // Multiple subtractions
      /(\d+\s*[*\/]\s*\d+\s*\+\s*\d+)/g, // Mixed operations
      /(\d+\s*\+\s*\d+\s*[*\/]\s*\d+)/g, // Mixed operations
      /(\d+\s*[*\/]\s*\d+\s*-\s*\d+)/g, // Mixed operations
      /(\d+\s*-\s*\d+\s*[*\/]\s*\d+)/g, // Mixed operations
      /(\d+\s*[*\/]\s*\d+\s*[*\/]\s*\d+\s*[*\/]\s*\d+)/g, // Four operations
      /(\d+\s*\+\s*\d+\s*\+\s*\d+\s*\+\s*\d+)/g, // Four additions
      /(\d+\s*[*\/]\s*\d+\s*\+\s*\d+\s*-\s*\d+)/g, // Complex mixed
    ];

    for (const pattern of complexPatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        try {
          const expr = match[1].trim();
          const result = eval(expr);
          if (this.valuesEqual(result, expectedValue)) {
            return {
              output: `${expr} = ${result}`,
              passed: true,
              method: "calculation_enhanced",
              confidence: 85,
              feedback: `Found matching complex calculation: ${expr}`,
            };
          }
        } catch (error) {
        }
      }
    }

    return { passed: false };
  }

  findCalculationVariable(code, expectedValue) {
    const variables = this.extractAllVariables(code);

    for (const [varName, varValue] of Object.entries(variables)) {
      try {
        const cleanValue = varValue.replace(/[^\d+\-*\/%\s().]/g, "");
        if (cleanValue.length < 2) continue;

        const result = eval(cleanValue);
        if (this.valuesEqual(result, expectedValue)) {
          return {
            output: `${varName} = ${result}`,
            passed: true,
            method: "calculation_variable",
            confidence: 85,
            feedback: `Found variable with calculation result: ${varName}`,
          };
        }
      } catch (error) {
      }
    }

    return { passed: false };
  }

  findCalculationComment(code, expectedValue) {
    const commentRegex = /\/\/\s*([^=\n]+)\s*=\s*([^\n]+)/g;
    let match;

    while ((match = commentRegex.exec(code)) !== null) {
      const expression = match[1].trim();
      const result = match[2].trim();

      if (this.valuesEqual(result, expectedValue)) {
        return {
          output: `// ${expression} = ${result}`,
          passed: true,
          method: "calculation_comment",
          confidence: 80,
          feedback: `Found calculation result in comment: ${expression} = ${result}`,
        };
      }
    }

    return { passed: false };
  }

  extractExpressions(code) {
    const expressions = [];
    const patterns = [
      /([0-9+\-*\/%\s()]+)/g,
      /(?:const|let|var)\s+\w+\s*=\s*([^;]+)/g,
      /\/\/\s*([^=\n]+)\s*=\s*([^\n]+)/g,
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const expr = match[1] || match[2];
        if (expr && expr.trim().length > 1) {
          expressions.push(expr.trim());
        }
      }
    });

    return expressions;
  }

  extractAllVariables(code) {
    const variables = {};
    const varRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g;
    let match;

    while ((match = varRegex.exec(code)) !== null) {
      variables[match[1]] = match[2].trim();
    }

    return variables;
  }
}

/**
 * Object Manipulation Handler - Handles object manipulation questions
 */
class ObjectManipulationHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {
      `   🔍 Using object manipulation detection for: ${question.type}`
    );

    const objectPatterns = [
      /const\s+\w+\s*=\s*\{[^}]*\}/g, // Object literals
      /\.\w+\s*=/g, // Object property assignments
      /\[\w+\]\s*=/g, // Bracket notation assignments
      /Object\.\w+/g, // Object methods
      /for\s*\(\s*const\s+\w+\s+in\s+\w+\s*\)/g, // For-in loops
    ];

    const foundPatterns = [];
    objectPatterns.forEach((pattern) => {
      const matches = code.match(pattern);
      if (matches) {
        foundPatterns.push(...matches.slice(0, 3));
      }
    });

    if (foundPatterns.length > 0) {
      return {
        output: `Found object manipulation: ${foundPatterns[0]}`,
        passed: true,
        method: "object_manipulation",
        confidence: 85,
        feedback: `Found object manipulation patterns: ${foundPatterns
          .slice(0, 2)
          .join(", ")}`,
        alternatives: foundPatterns,
      };
    }

    return {
      output: "No object manipulation found",
      passed: false,
      method: "object_manipulation",
      confidence: 0,
      feedback: "Could not find object manipulation patterns",
    };
  }
}

/**
 * Class Definition Handler - Handles class definition questions
 */
class ClassDefinitionHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {

    const classPatterns = [
      /class\s+\w+\s*\{[^}]*\}/gs, // Class declarations
      /class\s+\w+\s+extends\s+\w+\s*\{[^}]*\}/gs, // Class inheritance
      /constructor\s*\([^)]*\)\s*\{[^}]*\}/gs, // Constructors
    ];

    const foundClasses = [];
    classPatterns.forEach((pattern) => {
      const matches = code.match(pattern);
      if (matches) {
        foundClasses.push(...matches.slice(0, 2));
      }
    });

    if (foundClasses.length > 0) {
      return {
        output: `Found class definition: ${foundClasses[0].substring(
          0,
          50
        )}...`,
        passed: true,
        method: "class_definition",
        confidence: 90,
        feedback: `Found class definition patterns`,
        alternatives: foundClasses,
      };
    }

    return {
      output: "No class definition found",
      passed: false,
      method: "class_definition",
      confidence: 0,
      feedback: "Could not find class definition",
    };
  }
}

/**
 * Class Method Handler - Handles class method questions
 */
class ClassMethodHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {

    const methodPatterns = [
      /\w+\s*\([^)]*\)\s*\{[^}]*\}/gs, // Method definitions
      /static\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/gs, // Static methods
      /get\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/gs, // Getter methods
      /set\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/gs, // Setter methods
    ];

    const foundMethods = [];
    methodPatterns.forEach((pattern) => {
      const matches = code.match(pattern);
      if (matches) {
        foundMethods.push(...matches.slice(0, 3));
      }
    });

    if (foundMethods.length > 0) {
      return {
        output: `Found class method: ${foundMethods[0].substring(0, 50)}...`,
        passed: true,
        method: "class_method",
        confidence: 85,
        feedback: `Found class method patterns`,
        alternatives: foundMethods,
      };
    }

    return {
      output: "No class method found",
      passed: false,
      method: "class_method",
      confidence: 0,
      feedback: "Could not find class method",
    };
  }
}

/**
 * Class Inheritance Handler - Handles class inheritance questions
 */
class ClassInheritanceHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {
      `   🔍 Using class inheritance detection for: ${question.type}`
    );

    const inheritancePatterns = [
      /class\s+\w+\s+extends\s+\w+/g, // Class inheritance
      /super\s*\([^)]*\)/g, // Super calls
      /super\.\w+/g, // Super method calls
    ];

    const foundInheritance = [];
    inheritancePatterns.forEach((pattern) => {
      const matches = code.match(pattern);
      if (matches) {
        foundInheritance.push(...matches.slice(0, 2));
      }
    });

    if (foundInheritance.length > 0) {
      return {
        output: `Found inheritance: ${foundInheritance[0]}`,
        passed: true,
        method: "class_inheritance",
        confidence: 90,
        feedback: `Found class inheritance patterns`,
        alternatives: foundInheritance,
      };
    }

    return {
      output: "No class inheritance found",
      passed: false,
      method: "class_inheritance",
      confidence: 0,
      feedback: "Could not find class inheritance",
    };
  }
}

/**
 * Class Constructor Handler - Handles class constructor questions
 */
class ClassConstructorHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {
      `   🔍 Using class constructor detection for: ${question.type}`
    );

    const constructorPatterns = [
      /constructor\s*\([^)]*\)\s*\{[^}]*\}/gs, // Constructor definitions
      /this\.\w+\s*=\s*[^;]+/g, // Property assignments in constructor
    ];

    const foundConstructors = [];
    constructorPatterns.forEach((pattern) => {
      const matches = code.match(pattern);
      if (matches) {
        foundConstructors.push(...matches.slice(0, 2));
      }
    });

    if (foundConstructors.length > 0) {
      return {
        output: `Found constructor: ${foundConstructors[0].substring(
          0,
          50
        )}...`,
        passed: true,
        method: "class_constructor",
        confidence: 90,
        feedback: `Found constructor patterns`,
        alternatives: foundConstructors,
      };
    }

    return {
      output: "No constructor found",
      passed: false,
      method: "class_constructor",
      confidence: 0,
      feedback: "Could not find constructor",
    };
  }
}

/**
 * Static Method Handler - Handles static method questions
 */
class StaticMethodHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {

    const staticPatterns = [
      /static\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/gs, // Static method definitions
      /ClassName\.\w+\s*\(/g, // Static method calls
    ];

    const foundStatic = [];
    staticPatterns.forEach((pattern) => {
      const matches = code.match(pattern);
      if (matches) {
        foundStatic.push(...matches.slice(0, 2));
      }
    });

    if (foundStatic.length > 0) {
      return {
        output: `Found static method: ${foundStatic[0].substring(0, 50)}...`,
        passed: true,
        method: "static_method",
        confidence: 90,
        feedback: `Found static method patterns`,
        alternatives: foundStatic,
      };
    }

    return {
      output: "No static method found",
      passed: false,
      method: "static_method",
      confidence: 0,
      feedback: "Could not find static method",
    };
  }
}

/**
 * Encapsulation Handler - Handles encapsulation questions
 */
class EncapsulationHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {

    const encapsulationPatterns = [
      /#\w+/g, // Private fields
      /private\s+\w+/g, // Private declarations
      /get\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/gs, // Getter methods
      /set\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/gs, // Setter methods
    ];

    const foundEncapsulation = [];
    encapsulationPatterns.forEach((pattern) => {
      const matches = code.match(pattern);
      if (matches) {
        foundEncapsulation.push(...matches.slice(0, 3));
      }
    });

    if (foundEncapsulation.length > 0) {
      return {
        output: `Found encapsulation: ${foundEncapsulation[0]}`,
        passed: true,
        method: "encapsulation",
        confidence: 85,
        feedback: `Found encapsulation patterns`,
        alternatives: foundEncapsulation,
      };
    }

    return {
      output: "No encapsulation found",
      passed: false,
      method: "encapsulation",
      confidence: 0,
      feedback: "Could not find encapsulation patterns",
    };
  }
}

/**
 * Scope Prediction Handler - Handles scope prediction questions
 */
class ScopePredictionHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {

    const variables = this.extractAllVariables(code);
    const expressions = this.extractExpressions(code);

    if (question.testCases && question.testCases.length > 0) {
      for (const testCase of question.testCases) {
        if (testCase.expression) {
          const result = this.findExpressionResult(code, testCase.expression);
          if (result) {
            return {
              output: `${testCase.expression} = ${result}`,
              passed: true,
              method: "scope_prediction",
              confidence: 90,
              feedback: `Found expression result: ${testCase.expression} = ${result}`,
            };
          }
        }
      }
    }

    for (const [varName, varValue] of Object.entries(variables)) {
      try {
        const result = eval(varValue);
        return {
          output: `${varName} = ${result}`,
          passed: true,
          method: "variable_detection",
          confidence: 70,
          feedback: `Found variable: ${varName} = ${result}`,
        };
      } catch (error) {
      }
    }

    return {
      output: "No scope prediction found",
      passed: false,
      method: "scope_prediction",
      confidence: 0,
      feedback: "Could not find scope prediction",
    };
  }

  findExpressionResult(code, expression) {
    const patterns = [
      new RegExp(`//\\s*${expression}\\s*[=:]\\s*([^\\n]+)`, "i"),
      new RegExp(`console\\.log\\s*\\(\\s*${expression}\\s*\\)`, "i"),
      new RegExp(`${expression}\\s*=\\s*([^;\\n]+)`, "i"),
    ];

    for (const pattern of patterns) {
      const match = code.match(pattern);
      if (match) {
        try {
          if (match[1]) {
            return eval(match[1].trim());
          } else {
            return "found";
          }
        } catch (error) {
          continue;
        }
      }
    }
    return null;
  }

  extractAllVariables(code) {
    const variables = {};
    const varRegex =
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);?/g;
    let match;

    while ((match = varRegex.exec(code)) !== null) {
      variables[match[1]] = match[2].trim();
    }

    return variables;
  }

  extractExpressions(code) {
    const expressions = [];
    const patterns = [
      /([0-9+\-*\/%\s().]+)/g, // Direct arithmetic expressions
      /(?:const|let|var)\s+\w+\s*=\s*([^;]+)/g, // Expressions in variables
      /\/\/\s*([^=\n]+)\s*[=:]\s*([^\n]+)/g, // Expressions in comments
      /console\.log\s*\(\s*([^)]+)\s*\)/g, // Console.log expressions
      /return\s+([^;]+)/g, // Return statements
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const expr = match[1] || match[2];
        if (expr && expr.trim().length > 1) {
          expressions.push(expr.trim());
        }
      }
    });

    return expressions;
  }
}

/**
 * HTML/CSS Handler - Handles HTML and CSS validation questions
 */
class HTMLCSSHandler extends BaseHandler {
  constructor() {
    super();
    this.htmlContent = "";
    this.cssContent = "";
    this.filePath = "";
  }

  /**
   * Prepare handler with file path and HTML content so we can resolve linked CSS properly
   */
  prepareFileContext(filePath, htmlContent) {
    if (filePath && typeof filePath === "string") {
      this.filePath = filePath;
      if (htmlContent && htmlContent.includes("<html")) {
        this.htmlContent = htmlContent;
      } else {
        this.htmlContent = this.loadHtmlContent(filePath);
      }
      this.cssContent = this.loadCssContent(filePath);
    }
  }

  findAnswer(question, code, questionIndex, lectureId) {

    if (!this.filePath) {
      if (typeof code === "string" && fs.existsSync(code)) {
        this.filePath = code;
        this.htmlContent = this.loadHtmlContent(code);
        this.cssContent = this.loadCssContent(code);
      } else {
        this.htmlContent = typeof code === "string" ? code : "";
        this.cssContent = this.extractInlineStyles(this.htmlContent);
      }
    }

    if (!question.checks || question.checks.length === 0) {
      return {
        output: "No checks defined for HTML/CSS question",
        passed: false,
        method: "html_css_detection",
        confidence: 0,
        feedback: "No validation checks defined",
      };
    }

    const results = [];
    let allPassed = true;
    let anyPassed = false;

    for (const check of question.checks) {
      const result = this.evalCheck(check);
      results.push(result);

      if (result.passed) {
        anyPassed = true;
      } else if (!check.optional) {
        allPassed = false;
      }
    }

    const anyPassChecks = question.checks.filter((check) => check.anyPass);
    if (anyPassChecks.length > 0) {
      for (const check of anyPassChecks) {
        if (check.anyPass.some((subCheck) => this.evalCheck(subCheck).passed)) {
          anyPassed = true;
          break;
        }
      }
    }

    const passed = allPassed || anyPassed;
    const failedChecks = results.filter((r) => !r.passed && !r.optional);
    const firstFailure =
      failedChecks.length > 0
        ? failedChecks[0].description
        : "All checks passed";

    return {
      output: passed ? "HTML/CSS validation passed" : `Failed: ${firstFailure}`,
      passed: passed,
      method: "html_css_detection",
      confidence: passed ? 90 : 0,
      feedback: passed
        ? "All HTML/CSS checks passed"
        : `Failed: ${firstFailure}`,
      detectionDetails: {
        htmlLength: this.htmlContent.length,
        cssLength: this.cssContent.length,
        checksPassed: results.filter((r) => r.passed).length,
        totalChecks: results.length,
        results: results,
      },
    };
  }

  loadHtmlContent(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf8");
      }
    } catch (error) {
        `Could not load HTML content from ${filePath}:`,
        error.message
      );
    }
    return "";
  }

  loadCssContent(filePath) {
    try {
      const linkedCss = this.findLinkedCssFiles(filePath);
      let cssContent = linkedCss;

      const dir = path.dirname(filePath);
      const styleCssPath = path.join(dir, "style.css");
      if (fs.existsSync(styleCssPath)) {
        cssContent += "\n" + fs.readFileSync(styleCssPath, "utf8");
      }

      const inlineStyles = this.extractInlineStyles(this.htmlContent);
      cssContent += "\n" + inlineStyles;

      return cssContent;
    } catch (error) {
      return "";
    }
  }

  findLinkedCssFiles(filePath) {
    let cssContent = "";
    const linkRegex = /<link[^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi;
    const matches = this.htmlContent.match(linkRegex);

    if (matches) {
      for (const match of matches) {
        const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/i);
        if (hrefMatch) {
          const href = hrefMatch[1];
          const cssPath = this.resolveCssPath(filePath, href);
          if (fs.existsSync(cssPath)) {
            try {
              cssContent += "\n" + fs.readFileSync(cssPath, "utf8");
            } catch (error) {
                `Could not read CSS file ${cssPath}:`,
                error.message
              );
            }
          }
        }
      }
    }

    return cssContent;
  }

  resolveCssPath(htmlPath, href) {
    const dir = path.dirname(htmlPath);
    return path.join(dir, href);
  }

  extractInlineStyles(html) {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const matches = html.match(styleRegex);
    let styles = "";

    if (matches) {
      for (const match of matches) {
        const contentMatch = match.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (contentMatch) {
          styles += "\n" + contentMatch[1];
        }
      }
    }

    return styles;
  }

  evalCheck(check) {
    const result = {
      passed: false,
      description: check.description || "Check",
      optional: check.optional || false,
    };

    try {
      if (check.htmlContains) {
        result.passed = this.existsHtml(check.htmlContains);
      } else if (check.cssContains) {
        result.passed = this.existsCss(check.cssContains);
      } else if (check.cssAnyOf) {
        result.passed = check.cssAnyOf.some((prop) => this.existsCss(prop));
      } else if (check.cssAll) {
        result.passed = check.cssAll.every((prop) => this.existsCss(prop));
      } else if (check.htmlRegex) {
        result.passed = this.regexFind(
          this.htmlContent,
          check.htmlRegex,
          check.flags || "gi"
        );
      } else if (check.cssRegex) {
        result.passed = this.regexFind(
          this.cssContent,
          check.cssRegex,
          check.flags || "gi"
        );
      } else if (check.minCount) {
        const count = this.countOccurrences(
          this.htmlContent,
          check.minCount.pattern
        );
        result.passed = count >= check.minCount.min;
      } else if (check.mustHaveHref) {
        result.passed = this.findLinkHref(check.mustHaveHref);
      } else if (check.mustHaveSrc) {
        result.passed = this.htmlContent
          .toLowerCase()
          .includes(`src="${check.mustHaveSrc}"`);
      } else if (check.fileExistsFromHtmlHref) {
        result.passed = this.fileExistsFromHref();
      } else if (check.colorsDifferent) {
        result.passed = this.colorsDifferent(check.colorsDifferent);
      }
    } catch (error) {
      result.passed = false;
    }

    return result;
  }

  clean(str) {
    return str.replace(/\s+/g, " ").trim().toLowerCase();
  }

  existsCss(propOrSnippet) {
    const cleanCss = this.clean(this.cssContent);
    const cleanProp = this.clean(propOrSnippet);
    return cleanCss.includes(cleanProp);
  }

  existsHtml(snippet) {
    const cleanHtml = this.clean(this.htmlContent);
    const cleanSnippet = this.clean(snippet);
    return cleanHtml.includes(cleanSnippet);
  }

  regexFind(source, pattern, flags = "gi") {
    try {
      const regex = new RegExp(pattern, flags);
      return regex.test(source);
    } catch (error) {
      return false;
    }
  }

  findLinkHref(rel) {
    const linkRegex = new RegExp(
      `<link[^>]*rel\\s*=\\s*["']${rel}["'][^>]*>`,
      "gi"
    );
    return linkRegex.test(this.htmlContent);
  }

  fileExistsFromHref() {
    const linkRegex = /<link[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
    const matches = this.htmlContent.match(linkRegex);

    if (matches) {
      for (const match of matches) {
        const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/i);
        if (hrefMatch) {
          const href = hrefMatch[1];
          const cssPath = this.resolveCssPath(this.filePath, href);
          if (fs.existsSync(cssPath)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  countOccurrences(source, pattern) {
    const regex = new RegExp(pattern, "gi");
    const matches = source.match(regex);
    return matches ? matches.length : 0;
  }

  colorsDifferent(colors) {
    const colorValues = [];

    const colorRegex = /(?:color|background-color|background)\s*:\s*([^;]+)/gi;
    let match;
    while ((match = colorRegex.exec(this.cssContent)) !== null) {
      colorValues.push(this.clean(match[1]));
    }

    const uniqueColors = [...new Set(colorValues)];
    return uniqueColors.length >= 2;
  }
}

/**
 * HTML + JS (DOM) Handler - Validates HTML structure and linked/inlined JS
 */
class HTMLJSHandler extends BaseHandler {
  constructor() {
    super();
    this.htmlContent = "";
    this.jsContent = "";
    this.jsContentStripped = "";
    this.filePath = "";
  }

  stripJsComments(source) {
    if (!source) return "";
    return source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
  }

  prepareFileContext(filePath, htmlContent) {
    if (filePath && typeof filePath === "string") {
      this.filePath = filePath;
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".html" || ext === ".htm") {
        this.htmlContent =
          htmlContent && htmlContent.includes("<html")
            ? htmlContent
            : this.loadHtmlContent(filePath);
        this.jsContent = this.loadJsContent(filePath);
        this.jsContentStripped = this.stripJsComments(this.jsContent);
      } else if (ext === ".js") {
        try {
          this.jsContent = fs.readFileSync(filePath, "utf8");
        } catch (e) {
          this.jsContent = "";
        }
        this.jsContentStripped = this.stripJsComments(this.jsContent);
        const dir = path.dirname(filePath);
        const indexHtml = path.join(dir, "index.html");
        if (fs.existsSync(indexHtml)) {
          this.htmlContent = this.loadHtmlContent(indexHtml);
          this.jsContent += "\n" + this.loadJsContent(indexHtml);
          this.jsContentStripped = this.stripJsComments(this.jsContent);
        } else {
          try {
            const files = fs.readdirSync(dir);
            const htmlFile = files.find((f) =>
              f.toLowerCase().endsWith(".html")
            );
            if (htmlFile) {
              const htmlPath = path.join(dir, htmlFile);
              this.htmlContent = this.loadHtmlContent(htmlPath);
              this.jsContent += "\n" + this.loadJsContent(htmlPath);
              this.jsContentStripped = this.stripJsComments(this.jsContent);
            }
          } catch {}
        }
      } else {
        this.htmlContent = this.loadHtmlContent(filePath);
        this.jsContent = this.loadJsContent(filePath);
        this.jsContentStripped = this.stripJsComments(this.jsContent);
      }
    }
  }

  findAnswer(question, code, questionIndex, lectureId) {

    if (!this.filePath) {
      if (typeof code === "string" && fs.existsSync(code)) {
        this.filePath = code;
        this.htmlContent = this.loadHtmlContent(code);
        this.jsContent = this.loadJsContent(code);
        this.jsContentStripped = this.stripJsComments(this.jsContent);
      } else {
        this.htmlContent = typeof code === "string" ? code : "";
        this.jsContent = this.extractInlineScripts(this.htmlContent);
        this.jsContentStripped = this.stripJsComments(this.jsContent);
      }
    }

    if (!question.checks || question.checks.length === 0) {
      return {
        output: "No checks defined for HTML/JS question",
        passed: false,
        method: "html_js_dom_detection",
        confidence: 0,
        feedback: "No validation checks defined",
      };
    }

    const results = [];
    let allStandardPassed = true;

    for (const check of question.checks) {
      if (check.anyPass) continue; // handled separately below
      const result = this.evalCheck(check);
      results.push(result);
      if (!result.passed && !check.optional) {
        allStandardPassed = false;
      }
    }

    const anyPassChecks = question.checks.filter((c) => c.anyPass);
    let allAnyGroupsPassed = true;
    for (const group of anyPassChecks) {
      let groupPassed = false;
      for (const sub of group.anyPass) {
        const subResult = this.evalCheck(sub);
        results.push(subResult);
        if (subResult.passed) {
          groupPassed = true;
          break;
        }
      }
      if (!groupPassed && !group.optional) {
        allAnyGroupsPassed = false;
      }
    }

    const passed = allStandardPassed && allAnyGroupsPassed;
    const failedChecks = results.filter((r) => !r.passed && !r.optional);
    const firstFailure =
      failedChecks.length > 0
        ? failedChecks[0].description
        : "All checks passed";

    return {
      output: passed ? "HTML/JS validation passed" : `Failed: ${firstFailure}`,
      passed,
      method: "html_js_dom_detection",
      confidence: passed ? 90 : 0,
      feedback: passed
        ? "All HTML/JS checks passed"
        : `Failed: ${firstFailure}`,
      detectionDetails: {
        htmlLength: this.htmlContent.length,
        jsLength: this.jsContent.length,
        checksPassed: results.filter((r) => r.passed).length,
        totalChecks: results.length,
        results,
      },
    };
  }

  loadHtmlContent(filePath) {
    try {
      if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf8");
    } catch (e) {
    }
    return "";
  }

  loadJsContent(filePath) {
    let js = this.extractInlineScripts(this.htmlContent);
    const scriptRegex =
      /<script[^>]*src\s*=\s*["']([^"']+)["'][^>]*><\/script>/gi;
    let match;
    const dir = path.dirname(filePath);
    while ((match = scriptRegex.exec(this.htmlContent)) !== null) {
      const src = match[1];
      const scriptPath = path.join(dir, src);
      if (fs.existsSync(scriptPath)) {
        try {
          js += "\n" + fs.readFileSync(scriptPath, "utf8");
        } catch (e) {
        }
      }
    }
    return js;
  }

  extractInlineScripts(html) {
    const scriptInlineRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let scripts = "";
    let m;
    while ((m = scriptInlineRegex.exec(html)) !== null) {
      scripts += "\n" + (m[1] || "");
    }
    return scripts;
  }

  evalCheck(check) {
    const result = {
      passed: false,
      description: check.description || "Check",
      optional: check.optional || false,
    };

    try {
      if (check.htmlContains) {
        result.passed = this.existsHtml(check.htmlContains);
      } else if (check.htmlRegex) {
        result.passed = this.regexFind(
          this.htmlContent,
          check.htmlRegex,
          check.flags || "gi"
        );
      } else if (check.jsContains) {
        result.passed = this.existsJs(check.jsContains);
      } else if (check.jsRegex) {
        result.passed = this.regexFind(
          this.jsContentStripped,
          check.jsRegex,
          check.flags || "gi"
        );
      } else if (check.functionExists) {
        result.passed = this.functionExists(check.functionExists);
      } else if (check.variableRegex) {
        result.passed = this.regexFind(
          this.jsContentStripped,
          check.variableRegex,
          check.flags || "gi"
        );
      } else if (check.fileExistsFromHtmlScript) {
        result.passed = this.fileExistsFromScript();
      }
    } catch (e) {
      result.passed = false;
    }

    return result;
  }

  clean(str) {
    return String(str).replace(/\s+/g, " ").trim().toLowerCase();
  }
  existsHtml(snippet) {
    return this.clean(this.htmlContent).includes(this.clean(snippet));
  }
  existsJs(snippet) {
    return this.clean(this.jsContentStripped).includes(this.clean(snippet));
  }
  regexFind(source, pattern, flags = "gi") {
    try {
      const rx = new RegExp(pattern, flags);
      return rx.test(source);
    } catch {
      return false;
    }
  }
  functionExists(nameOrAlternatives) {
    const names = Array.isArray(nameOrAlternatives)
      ? nameOrAlternatives
      : typeof nameOrAlternatives === "string"
      ? nameOrAlternatives.split("|")
      : [String(nameOrAlternatives || "")];
    return names.some((candidate) => {
      if (
        typeof candidate === "string" &&
        candidate.length > 2 &&
        candidate.startsWith("/") &&
        candidate.lastIndexOf("/") > 0
      ) {
        try {
          const lastSlash = candidate.lastIndexOf("/");
          const pattern = candidate.slice(1, lastSlash);
          const flags = candidate.slice(lastSlash + 1);
          const rx = new RegExp(pattern, flags || "i");
          return rx.test(this.jsContentStripped);
        } catch {}
      }
      const safe = String(candidate).replace(/[$^.*+?()|[\]{}]/g, "\\$&");
      const patterns = [
        new RegExp(`function\\s+${safe}\\s*\\(`, "i"),
        new RegExp(
          `(?:const|let|var)\\s+${safe}\\s*=\\s*\\([^)]*\\)\\s*=>`,
          "i"
        ),
        new RegExp(`(?:const|let|var)\\s+${safe}\\s*=\\s*function\\s*\\(`, "i"),
      ];
      return patterns.some((rx) => rx.test(this.jsContentStripped));
    });
  }

  fileExistsFromScript() {
    const scriptRegex =
      /<script[^>]*src\s*=\s*["']([^"']+)["'][^>]*><\/script>/gi;
    let m;
    const dir = path.dirname(this.filePath || "");
    while ((m = scriptRegex.exec(this.htmlContent)) !== null) {
      const src = m[1];
      const scriptPath = path.join(dir, src);
      if (fs.existsSync(scriptPath)) return true;
    }
    return false;
  }
}

/**
 * File System Handler - Handles Node.js project structure and file operations
 */
class FileSystemHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {

    if (!this.projectDir) {
      this.prepareFileContext(code);
    }

    const checks = question.checks || [];
    const results = [];
    let passedChecks = 0;

    for (const check of checks) {
      const result = this.evalCheck(check);
      results.push({
        passed: result,
        description: check.description,
        optional: check.optional || false,
      });

      if (result) {
        passedChecks++;
      }
    }

    const totalRequiredChecks = results.filter((r) => !r.optional).length;
    const passedRequiredChecks = results.filter(
      (r) => !r.optional && r.passed
    ).length;

    const passed = passedRequiredChecks === totalRequiredChecks;
    const confidence =
      totalRequiredChecks > 0
        ? (passedRequiredChecks / totalRequiredChecks) * 100
        : 90;

    return {
      output: passed
        ? "File system validation passed"
        : `Failed: ${results
            .filter((r) => !r.passed && !r.optional)
            .map((r) => r.description)
            .join(", ")}`,
      passed,
      method: "file_system_detection",
      confidence,
      feedback: passed
        ? "All file system checks passed"
        : `Failed checks: ${results
            .filter((r) => !r.passed && !r.optional)
            .map((r) => r.description)
            .join(", ")}`,
      detectionDetails: {
        checksPassed: passedChecks,
        totalChecks: checks.length,
        results,
      },
    };
  }

  prepareFileContext(code) {
    if (typeof code === "string") {
      if (
        code.includes("W09D01") ||
        code.includes("W09D03_APIs") ||
        code.includes("W09D05_Asynchronous_Programming") ||
        code.includes("W10D01_Express_Middlewares") ||
        code.includes("W10D03_MongoDB_Mongoose") ||
        code.includes("W10D05_Advanced_Mongoose") ||
        code.includes("W12D01_React_Intro") ||
        code.includes("W12D03_React_Hooks") ||
        code.includes("W12D05_React_Context") ||
        code.includes("W13D03_Redux") ||
        code.includes("W16D01_Postgress_Intro") ||
        code.includes("W16D03_Postgress_Relational_Database") ||
        code.includes("W04D05") ||
        code.includes("W05D03") ||
        code.includes("W06D05") ||
        code.includes("app-name") ||
        code.includes("React-StarterCode") ||
        code.includes("test") ||
        code.includes("react_blog") ||
        code.includes("react-name") ||
        code.includes("app") ||
        code.includes("my-context-app") ||
        code.includes("context-practice") ||
        code.includes("app-context") ||
        code.includes("react") ||
        code.includes("counter") ||
        code.includes("redux") ||
        (code.includes("downloads") && code.includes("W13D03_Redux")) ||
        (code.includes("downloads") && code.includes("app-name")) ||
        (code.includes("downloads") && code.includes("counter")) ||
        (code.includes("downloads") && code.includes("redux")) ||
        (code.includes("downloads") &&
          code.includes("W16D01_Postgress_Intro")) ||
        (code.includes("downloads") &&
          code.includes("W16D03_Postgress_Relational_Database"))
      ) {
        this.projectDir = code;
        this.filePath = null;
      } else {
        this.filePath = code;
        this.projectDir = path.dirname(code);
      }
        `   📁 FileSystemHandler: filePath=${this.filePath}, projectDir=${this.projectDir}`
      );
    } else {
      this.filePath = null;
      this.projectDir = null;
    }
  }

  evalCheck(check) {
    if (check.fileExists) {
      return this.fileExists(check.fileExists);
    }

    if (check.fileContains) {
      return this.fileContains(check.fileContains);
    }

    if (check.directoryExists) {
      return this.directoryExists(check.directoryExists);
    }

    return false;
  }

  fileExists(fileName) {
    if (!this.projectDir) return false;

    const filePath = path.join(this.projectDir, fileName);
    return fs.existsSync(filePath);
  }

  fileContains(pattern) {
    if (!this.projectDir) {
        `   🔍 FileSystemHandler.fileContains: No projectDir set for pattern "${pattern}"`
      );
      return false;
    }

      `   🔍 FileSystemHandler.fileContains: Searching for "${pattern}" in projectDir: ${this.projectDir}`
    );

    try {
      const searchFiles = (dir) => {
        const files = fs.readdirSync(dir);
        const results = [];

        for (const fileName of files) {
          const filePath = path.join(dir, fileName);
          if (fs.statSync(filePath).isFile()) {
            results.push(filePath);
          } else if (fs.statSync(filePath).isDirectory()) {
            results.push(...searchFiles(filePath));
          }
        }
        return results;
      };

      const allFiles = searchFiles(this.projectDir);

      for (const filePath of allFiles) {
        try {
          const content = fs.readFileSync(filePath, "utf8");

          if (
            pattern.includes(".*") ||
            pattern.includes("\\(") ||
            pattern.includes("\\)")
          ) {
            const regex = new RegExp(pattern, "i");
            if (regex.test(content)) {
              return true;
            }
          } else {
            if (content.includes(pattern)) {
              return true;
            }
          }
        } catch (e) {
        }
      }
    } catch (e) {
    }

    return false;
  }

  directoryExists(dirName) {
    if (!this.projectDir) return false;

    const dirPath = path.join(this.projectDir, dirName);
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  }
}

/**
 * Default Handler - Fallback for unknown question types
 */
class DefaultHandler extends BaseHandler {
  findAnswer(question, code, questionIndex, lectureId) {

    const relevantCode = this.findRelevantCode(code, question);

    if (relevantCode.length > 0) {
      return {
        output: `Found relevant code: ${relevantCode[0]}`,
        passed: true,
        method: "default_detection",
        confidence: 50,
        partialCredit: 0.5,
        feedback: `Found potentially relevant code: ${relevantCode[0]}`,
        alternatives: relevantCode,
      };
    }

    return {
      output: "No relevant code found",
      passed: false,
      method: "default_detection",
      confidence: 0,
      feedback: "Could not find relevant code for this question type",
    };
  }

  findRelevantCode(code, question) {
    const relevant = [];
    const questionText = question.description.toLowerCase();

    const keywords = questionText.split(" ").filter((word) => word.length > 3);

    for (const keyword of keywords) {
      const regex = new RegExp(`[^\\s]*${keyword}[^\\s]*`, "gi");
      const matches = code.match(regex);
      if (matches) {
        relevant.push(...matches.slice(0, 3)); // Limit to first 3 matches
      }
    }

    return relevant;
  }
}

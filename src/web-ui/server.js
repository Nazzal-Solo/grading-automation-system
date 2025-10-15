#!/usr/bin/env node

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GitHubDownloader } from "../core/GitHubDownloader.js";
import { CohortManager } from "../core/CohortManager.js";
import { FileFilter } from "../utils/FileFilter.js";
import { UltraDynamicGradingEngine } from "../core/UltraDynamicGradingEngine.js";
import { GradesOptimizer } from "../utils/GradesOptimizer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WebUIServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.config = this.loadConfig();
    this.downloader = new GitHubDownloader(this.config);
    this.cohortManager = new CohortManager();
    this.fileFilter = new FileFilter();
    this.resultsFile = "results/grades.json";
    this.ultraDynamicGradingEngine = new UltraDynamicGradingEngine(this.config);
    this.gradesOptimizer = new GradesOptimizer();
    this.autoCleanupEnabled = true;

    this.setupMiddleware();
    this.setupRoutes();
    this.initializeResultsStorage();
  }

  loadConfig() {
    const studentsPath = path.join("config", "students.json");
    const lecturesPath = path.join("config", "lectures.json");

    if (!fs.existsSync(studentsPath) || !fs.existsSync(lecturesPath)) {
      process.exit(1);
    }

    const studentsData = JSON.parse(fs.readFileSync(studentsPath, "utf8"));

    const mainLectures =
      JSON.parse(fs.readFileSync(lecturesPath, "utf8")).lectures || [];

    const enhancedLectures = this.loadEnhancedLectures();

    const allLectures = [...mainLectures, ...enhancedLectures];

    return {
      students: studentsData.students,
      lectures: allLectures,
      globalToken: studentsData.globalToken,
    };
  }

  loadEnhancedLectures() {
    const configDir = path.join("config");
    const enhancedLectures = [];

    try {
      const files = fs.readdirSync(configDir);
      const enhancedFiles = files.filter((file) =>
        file.endsWith("-enhanced.json")
      );

      for (const file of enhancedFiles) {
        try {
          const filePath = path.join(configDir, file);
          const config = JSON.parse(fs.readFileSync(filePath, "utf8"));

          if (config.lectures && Array.isArray(config.lectures)) {
            enhancedLectures.push(...config.lectures);
          } else if (config.lectureId) {
            enhancedLectures.push({
              id: config.lectureId,
              name: config.title || config.lectureId,
              description: config.description || "",
              week: config.week || 0,
              day: config.day || 0,
              questions: config.questions || [],
              gradingCriteria: config.gradingCriteria || {},
            });
          }
        } catch (error) {}
      }
    } catch (error) {}

    return enhancedLectures;
  }

  autoCleanupAfterGrading() {
    if (!this.autoCleanupEnabled) {
      return { success: true, message: "Auto-cleanup disabled" };
    }

    try {
      const downloadsResult = this.gradesOptimizer.cleanupDownloads();
      const gradesResult = this.gradesOptimizer.optimizeGrades();

      return {
        success: true,
        downloadsCleaned: downloadsResult.success,
        gradesOptimized: gradesResult.success,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  initializeResultsStorage() {
    if (!fs.existsSync("results")) {
      fs.mkdirSync("results", { recursive: true });
    }

    if (!fs.existsSync(this.resultsFile)) {
      const initialData = {
        results: [],
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(this.resultsFile, JSON.stringify(initialData, null, 2));
    }
  }

  loadResults() {
    try {
      if (!fs.existsSync(this.resultsFile)) {
        return { results: [], lastUpdated: new Date().toISOString() };
      }
      return JSON.parse(fs.readFileSync(this.resultsFile, "utf8"));
    } catch (error) {
      return { results: [], lastUpdated: new Date().toISOString() };
    }
  }

  saveResults(resultsData) {
    try {
      resultsData.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.resultsFile, JSON.stringify(resultsData, null, 2));
    } catch (error) {}
  }

  removeStudentResults(studentId) {
    try {
      const resultsData = this.loadResults();
      const originalCount = resultsData.results.length;

      resultsData.results = resultsData.results.filter(
        (result) => result.studentId !== studentId
      );

      const removedCount = originalCount - resultsData.results.length;
      this.saveResults(resultsData);

      const archiveDir = "results/archive";
      if (fs.existsSync(archiveDir)) {
        const archiveFiles = fs.readdirSync(archiveDir);
        let archiveRemovedCount = 0;

        archiveFiles.forEach((file) => {
          if (file.includes(studentId)) {
            try {
              fs.unlinkSync(path.join(archiveDir, file));
              archiveRemovedCount++;
            } catch (error) {}
          }
        });
      }

      return { removedCount, archiveRemovedCount };
    } catch (error) {
      return { removedCount: 0, archiveRemovedCount: 0 };
    }
  }

  autoCleanupGrades() {
    try {
      const options = {
        truncateErrors: true,
        maxErrorLength: 200,
        removeStudentCode: true,
        limitCodeAnalysis: true,
        removeOldResults: true,
        createBackup: false,
      };

      const cleanupStats = this.gradesCleanup.cleanupGradesFile(options);

      if (cleanupStats.sizeSaved > 0) {
      }
    } catch (error) {}
  }

  addOrUpdateResult(newResult) {
    const resultsData = this.loadResults();

    let resultsArray;
    if (resultsData.results && Array.isArray(resultsData.results)) {
      resultsArray = resultsData.results;
    } else if (resultsData.grades && Array.isArray(resultsData.grades)) {
      resultsArray = resultsData.grades;
      resultsData.results = resultsArray;
    } else {
      resultsArray = [];
      resultsData.results = resultsArray;
    }

    const resultKey = `${newResult.studentId}-${newResult.lectureId}`;

    const existingIndex = resultsArray.findIndex(
      (result) => `${result.studentId}-${result.lectureId}` === resultKey
    );

    if (existingIndex !== -1) {
      resultsArray[existingIndex] = {
        ...newResult,
        timestamp: new Date().toISOString(),
        updated: true,
      };
    } else {
      resultsArray.push({
        ...newResult,
        timestamp: new Date().toISOString(),
        updated: false,
      });
    }

    this.saveResults(resultsData);
    return resultsArray;
  }

  getResults() {
    const resultsData = this.loadResults();

    let resultsArray;
    if (resultsData.results && Array.isArray(resultsData.results)) {
      resultsArray = resultsData.results;
    } else if (resultsData.grades && Array.isArray(resultsData.grades)) {
      resultsArray = resultsData.grades;
    } else {
      return [];
    }

    return resultsArray.map((result) => {
      try {
        let score = 0;
        let total = 100;
        let percentage = 0;

        if (result.grading) {
          score = result.grading.score || 0;
          total = result.grading.totalWeight || 100;
          percentage = result.grading.percentage || 0;
        } else if (result.analytics) {
          if (result.analytics.grading) {
            score = result.analytics.grading.averageScore || 0;
            percentage = result.analytics.grading.averageScore || 0;
          } else if (result.analytics.overall) {
            score = result.analytics.overall.score || 0;
            total = result.analytics.overall.total || 100;
            percentage = result.analytics.overall.percentage || 0;
          }
        } else if (result.result) {
          score = result.result.score || 0;
          total = result.result.totalWeight || 100;
          percentage = result.result.percentage || 0;
        } else if (result.percentage !== undefined) {
          score = result.score || 0;
          total = result.totalWeight || 100;
          percentage = result.percentage || 0;
        }

        const student = this.config.students.find(
          (s) => s.id === result.studentId
        );
        const cohortNumber = student
          ? student.cohortNumber || student.cohort?.replace("C", "") || "15"
          : "15";

        return {
          studentId: result.studentId,
          lectureId: result.lectureId,
          score: score,
          total: total,
          percentage: percentage,
          timestamp: result.timestamp,
          updated: result.updated || false,
          status: result.status || null,
          message: result.message || null,
          cohortNumber: cohortNumber,
        };
      } catch (error) {
        return {
          studentId: result.studentId || "unknown",
          lectureId: result.lectureId || "unknown",
          score: 0,
          total: 100,
          percentage: 0,
          timestamp: result.timestamp || new Date().toISOString(),
          updated: false,
          cohortNumber: "15",
        };
      }
    });
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "public")));
  }

  setupRoutes() {
    this.app.use((req, res, next) => {
      next();
    });

    this.app.get("/api/students", (req, res) => {
      try {
        const { cohort, status, search } = req.query;
        const filters = {};

        if (cohort) filters.cohortNumber = parseInt(cohort);
        if (status) filters.status = status;
        if (search) filters.search = search;

        const students = this.cohortManager.filterStudents(filters);
        res.json(students);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/lectures", (req, res) => {
      res.json(this.config.lectures);
    });

    this.app.get("/api/curriculum", (req, res) => {
      try {
        const curriculum = {
          stages: [
            {
              id: "stage1",
              name: "Stage 1",
              lectures: [
                "W01D01_Intro_To_JS",
                "W01D03_Functions",
                "W01D05_Conditionals",
                "W02D01_Scopes",
                "W02D03_Arrays",
                "W02D05_Objects",
                "W03D01_Iteration_P1",
                "W03D03_Iteration_P2",
                "W03D05_Recursion",
                "W04D01_CB_HOF",
                "W04D03_OOP",
                "W04D05_HTML",
                "W04D05_CSS_Intro",
                "W05D01_CSS_Layouts",
                "W05D03_DOM",
                "W06D05_jQuery",
              ],
            },
            {
              id: "stage2",
              name: "Stage 2",
              lectures: [
                "W09D01_Backend_Development",
                "W09D03_APIs",
                "W09D05_Asynchronous_Programming",
                "W10D01_Express_Middlewares",
                "W10D03_MongoDB_Mongoose",
                "W10D05_Advanced_Mongoose",
                "W12D01_React_Intro",
                "W12D03_React_Hooks",
                "W12D05_React_Context",
                "W13D03_Redux",
                "W16D01_Postgress_Intro",
                "W16D03_Postgress_Relational_Database",
              ],
            },
          ],
        };
        res.json(curriculum);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/reload-config", (req, res) => {
      try {
        this.config = this.loadConfig();
        res.json({
          success: true,
          message: "Configuration reloaded successfully",
        });
      } catch (error) {
        res
          .status(500)
          .json({ error: "Failed to reload configuration: " + error.message });
      }
    });

    this.app.get("/api/student/:id", (req, res) => {
      const student = this.config.students.find((s) => s.id === req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    });

    this.app.get("/api/student/:id/lectures", (req, res) => {
      const student = this.config.students.find((s) => s.id === req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student.lectures);
    });

    this.app.post("/api/grade", async (req, res) => {
      try {
        const { studentId, lectureId } = req.body;

        if (!studentId || !lectureId) {
          return res
            .status(400)
            .json({ error: "Student ID and Lecture ID are required" });
        }

        const student = this.config.students.find((s) => s.id === studentId);

        if (!student) {
          return res.status(404).json({ error: "Student not found" });
        }

        if (!student.lectures) {
          student.lectures = [];
        }

        let lecture = student.lectures.find((l) => l.lectureId === lectureId);
        if (!lecture) {
          lecture = {
            lectureId: lectureId,
            repoName: lectureId, // Use lecture ID as repo name
            filePath: "main.js", // Default file path
            status: "active",
          };
          student.lectures.push(lecture);

          const studentIndex = this.config.students.findIndex(
            (s) => s.id === studentId
          );
          if (studentIndex !== -1) {
            this.config.students[studentIndex] = student;
          }
        }

        const filePath = path.join(
          "downloads",
          studentId,
          lectureId,
          lecture.filePath
        );

        const imageExtensions = [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".bmp",
          ".svg",
          ".ico",
          ".webp",
        ];
        const fileExtension = path.extname(lecture.filePath).toLowerCase();
        if (imageExtensions.includes(fileExtension)) {
          return res.json({
            studentId,
            lectureId,
            timestamp: new Date().toISOString(),
            execution: {
              success: false,
              hasError: true,
              errorType: "skipped",
              error: "Image file skipped - not a JavaScript file",
            },
            grading: {
              score: 0,
              totalWeight: 0,
              percentage: 0,
              passedQuestions: 0,
              totalQuestions: 0,
            },
            finalScore: {
              baseScore: 0,
              qualityAdjustment: 0,
              finalScore: 0,
            },
            feedback: {
              overallSummary: "Image file skipped - not a JavaScript file",
              questionBreakdown: [],
              qualityRecommendations: [],
            },
          });
        }

        const cohortNumber =
          student.cohortNumber || student.cohort?.replace("C", "") || "15";
        const hasPrefix = student.github.username.startsWith(
          `C${cohortNumber}-`
        );
        const finalUsername = hasPrefix
          ? student.github.username
          : `C${cohortNumber}-${student.github.username}`;

        if (!fs.existsSync(filePath)) {
          try {
            await this.downloader.downloadRepository(
              finalUsername,
              this.config.globalToken, // Use global token
              lecture.repoName,
              studentId,
              lectureId
            );

            if (!fs.existsSync(filePath)) {
              return res.status(404).json({
                error: `Repository not found: ${finalUsername}/${lecture.repoName}. Please ensure the repository exists and the student has the correct GitHub username.`,
              });
            }
          } catch (downloadError) {
            return res.status(404).json({
              error: `Failed to download repository: ${finalUsername}/${lecture.repoName}. Error: ${downloadError.message}`,
            });
          }
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          this.fileFilter.printStatistics(filePath);

          this.fileFilter.printCleanupStats(filePath, true); // dry run
        }

        let result;
        try {
          if (
            lectureId === "W04D05_CSS_Intro" ||
            lectureId === "W04D05_HTML" ||
            lectureId === "W05D03_DOM" ||
            lectureId === "W06D05_jQuery" ||
            lectureId === "W09D01_Backend_Development" ||
            lectureId === "W09D03_APIs" ||
            lectureId === "W09D05_Asynchronous_Programming" ||
            lectureId === "W10D01_Express_Middlewares" ||
            lectureId === "W10D03_MongoDB_Mongoose" ||
            lectureId === "W10D05_Advanced_Mongoose" ||
            lectureId === "W12D01_React_Intro" ||
            lectureId === "W12D03_React_Hooks" ||
            lectureId === "W12D05_React_Context" ||
            lectureId === "W13D03_Redux" ||
            lectureId === "W16D01_Postgress_Intro" ||
            lectureId === "W16D03_Postgress_Relational_Database"
          ) {
            const downloadPath = path.join("downloads", studentId, lectureId);

            let actualDownloadPath = downloadPath;
            if (!fs.existsSync(downloadPath)) {
              const variations = [
                `${lectureId}-`,
                `${lectureId}_`,
                `${lectureId}.`,
                `${lectureId}-main`,
                `${lectureId}-master`,
              ];

              for (const variation of variations) {
                const variationPath = path.join(
                  "downloads",
                  studentId,
                  variation
                );
                if (fs.existsSync(variationPath)) {
                  actualDownloadPath = variationPath;
                  break;
                }
              }
            }

            let actualFilePath;
            if (
              fs.existsSync(downloadPath) &&
              fs.statSync(downloadPath).isDirectory()
            ) {
              if (lectureId === "W09D01_Backend_Development") {
                const packageJson = path.join(
                  actualDownloadPath,
                  "package.json"
                );
                if (fs.existsSync(packageJson)) {
                  actualFilePath = packageJson;
                } else {
                  const serverJs = path.join(actualDownloadPath, "server.js");
                  if (fs.existsSync(serverJs)) {
                    actualFilePath = serverJs;
                  } else {
                    const indexJs = path.join(actualDownloadPath, "index.js");
                    if (fs.existsSync(indexJs)) {
                      actualFilePath = indexJs;
                    } else {
                      const files = fs.readdirSync(actualDownloadPath);
                      const jsFile = files.find((f) => f.endsWith(".js"));
                      if (jsFile) {
                        actualFilePath = path.join(actualDownloadPath, jsFile);
                      }
                    }
                  }
                }
              } else if (lectureId === "W09D03_APIs") {
                const appJs = path.join(actualDownloadPath, "app.js");
                if (fs.existsSync(appJs)) {
                  actualFilePath = appJs;
                } else {
                  const files = fs.readdirSync(actualDownloadPath);
                  const jsFile = files.find((f) => f.endsWith(".js"));
                  if (jsFile) {
                    actualFilePath = path.join(actualDownloadPath, jsFile);
                  }
                }
              } else if (lectureId === "W09D05_Asynchronous_Programming") {
                const mainJs = path.join(actualDownloadPath, "main.js");
                const appJs = path.join(actualDownloadPath, "app.js");
                if (fs.existsSync(mainJs)) {
                  actualFilePath = mainJs;
                } else if (fs.existsSync(appJs)) {
                  actualFilePath = appJs;
                } else {
                  const files = fs.readdirSync(actualDownloadPath);
                  const jsFile = files.find((f) => f.endsWith(".js"));
                  if (jsFile) {
                    actualFilePath = path.join(actualDownloadPath, jsFile);
                  }
                }
              } else if (lectureId === "W10D01_Express_Middlewares") {
                const appJs = path.join(actualDownloadPath, "app.js");
                const serverJs = path.join(actualDownloadPath, "server.js");
                const mainJs = path.join(actualDownloadPath, "main.js");
                if (fs.existsSync(appJs)) {
                  actualFilePath = appJs;
                } else if (fs.existsSync(serverJs)) {
                  actualFilePath = serverJs;
                } else if (fs.existsSync(mainJs)) {
                  actualFilePath = mainJs;
                } else {
                  const files = fs.readdirSync(actualDownloadPath);
                  const jsFile = files.find((f) => f.endsWith(".js"));
                  if (jsFile) {
                    actualFilePath = path.join(actualDownloadPath, jsFile);
                  }
                }
              } else if (lectureId === "W10D05_Advanced_Mongoose") {
                const indexJs = path.join(actualDownloadPath, "index.js");
                const serverJs = path.join(actualDownloadPath, "server.js");
                const appJs = path.join(actualDownloadPath, "app.js");
                if (fs.existsSync(indexJs)) {
                  actualFilePath = indexJs;
                } else if (fs.existsSync(serverJs)) {
                  actualFilePath = serverJs;
                } else if (fs.existsSync(appJs)) {
                  actualFilePath = appJs;
                } else {
                  const files = fs.readdirSync(actualDownloadPath);
                  const jsFile = files.find((f) => f.endsWith(".js"));
                  if (jsFile) {
                    actualFilePath = path.join(actualDownloadPath, jsFile);
                  }
                }
              } else if (lectureId === "W12D01_React_Intro") {
                const possiblePaths = [
                  path.join(actualDownloadPath, "src", "App.jsx"),
                  path.join(actualDownloadPath, "src", "App.js"),
                  path.join(actualDownloadPath, "src", "main.jsx"),
                  path.join(actualDownloadPath, "src", "main.js"),
                  path.join(actualDownloadPath, "app-name", "src", "App.jsx"),
                  path.join(actualDownloadPath, "app-name", "src", "App.js"),
                  path.join(
                    downloadPath,
                    "React-StarterCode",
                    "src",
                    "App.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "React-StarterCode",
                    "src",
                    "App.js"
                  ),
                  path.join(
                    downloadPath,
                    "React-StarterCode",
                    "React-StarterCode",
                    "src",
                    "App.jsx"
                  ),
                  path.join(
                    downloadPath,
                    "React-StarterCode",
                    "React-StarterCode",
                    "src",
                    "App.js"
                  ),
                  path.join(actualDownloadPath, "test", "src", "App.jsx"),
                  path.join(actualDownloadPath, "test", "src", "App.js"),
                ];

                for (const possiblePath of possiblePaths) {
                  if (fs.existsSync(possiblePath)) {
                    actualFilePath = possiblePath;
                    break;
                  }
                }

                if (!actualFilePath) {
                  const searchDirs = [
                    downloadPath,
                    path.join(actualDownloadPath, "src"),
                    path.join(actualDownloadPath, "app-name"),
                    path.join(actualDownloadPath, "app-name", "src"),
                    path.join(actualDownloadPath, "React-StarterCode"),
                    path.join(actualDownloadPath, "React-StarterCode", "src"),
                    path.join(
                      downloadPath,
                      "React-StarterCode",
                      "React-StarterCode"
                    ),
                    path.join(
                      downloadPath,
                      "React-StarterCode",
                      "React-StarterCode",
                      "src"
                    ),
                    path.join(actualDownloadPath, "test"),
                    path.join(actualDownloadPath, "test", "src"),
                  ];

                  for (const searchDir of searchDirs) {
                    if (fs.existsSync(searchDir)) {
                      const files = fs.readdirSync(searchDir);
                      const jsxFile = files.find((f) => f.endsWith(".jsx"));
                      const jsFile = files.find((f) => f.endsWith(".js"));
                      if (jsxFile) {
                        actualFilePath = path.join(searchDir, jsxFile);
                        break;
                      } else if (jsFile) {
                        actualFilePath = path.join(searchDir, jsFile);
                        break;
                      }
                    }
                  }
                }
              } else if (lectureId === "W12D03_React_Hooks") {
                const possiblePaths = [
                  path.join(actualDownloadPath, "src", "App.jsx"),
                  path.join(actualDownloadPath, "src", "App.js"),
                  path.join(actualDownloadPath, "src", "main.jsx"),
                  path.join(actualDownloadPath, "src", "main.js"),
                  path.join(actualDownloadPath, "react_blog", "src", "App.jsx"),
                  path.join(actualDownloadPath, "react_blog", "src", "App.js"),
                  path.join(actualDownloadPath, "react-name", "src", "App.jsx"),
                  path.join(actualDownloadPath, "react-name", "src", "App.js"),
                  path.join(actualDownloadPath, "app-name", "src", "App.jsx"),
                  path.join(actualDownloadPath, "app-name", "src", "App.js"),
                  path.join(
                    downloadPath,
                    "React-StarterCode",
                    "src",
                    "App.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "React-StarterCode",
                    "src",
                    "App.js"
                  ),
                  path.join(
                    downloadPath,
                    "React-StarterCode",
                    "React-StarterCode",
                    "src",
                    "App.jsx"
                  ),
                  path.join(
                    downloadPath,
                    "React-StarterCode",
                    "React-StarterCode",
                    "src",
                    "App.js"
                  ),
                  path.join(actualDownloadPath, "test", "src", "App.jsx"),
                  path.join(actualDownloadPath, "test", "src", "App.js"),
                ];

                for (const possiblePath of possiblePaths) {
                  if (fs.existsSync(possiblePath)) {
                    actualFilePath = possiblePath;
                    break;
                  }
                }

                if (!actualFilePath) {
                  const searchDirs = [
                    downloadPath,
                    path.join(actualDownloadPath, "src"),
                    path.join(actualDownloadPath, "react_blog"),
                    path.join(actualDownloadPath, "react_blog", "src"),
                    path.join(actualDownloadPath, "react-name"),
                    path.join(actualDownloadPath, "react-name", "src"),
                    path.join(actualDownloadPath, "app-name"),
                    path.join(actualDownloadPath, "app-name", "src"),
                    path.join(actualDownloadPath, "React-StarterCode"),
                    path.join(actualDownloadPath, "React-StarterCode", "src"),
                    path.join(
                      downloadPath,
                      "React-StarterCode",
                      "React-StarterCode"
                    ),
                    path.join(
                      downloadPath,
                      "React-StarterCode",
                      "React-StarterCode",
                      "src"
                    ),
                    path.join(actualDownloadPath, "test"),
                    path.join(actualDownloadPath, "test", "src"),
                  ];

                  for (const searchDir of searchDirs) {
                    if (fs.existsSync(searchDir)) {
                      const files = fs.readdirSync(searchDir);
                      const jsxFile = files.find((f) => f.endsWith(".jsx"));
                      const jsFile = files.find((f) => f.endsWith(".js"));
                      if (jsxFile) {
                        actualFilePath = path.join(searchDir, jsxFile);
                        break;
                      } else if (jsFile) {
                        actualFilePath = path.join(searchDir, jsFile);
                        break;
                      }
                    }
                  }
                }
              } else if (lectureId === "W12D05_React_Context") {
                const possiblePaths = [
                  path.join(actualDownloadPath, "src", "App.jsx"),
                  path.join(actualDownloadPath, "src", "App.js"),
                  path.join(actualDownloadPath, "src", "main.jsx"),
                  path.join(actualDownloadPath, "src", "main.js"),
                  path.join(actualDownloadPath, "app", "src", "App.jsx"),
                  path.join(actualDownloadPath, "app", "src", "App.js"),
                  path.join(actualDownloadPath, "app", "src", "main.jsx"),
                  path.join(actualDownloadPath, "app", "src", "main.js"),
                  path.join(
                    actualDownloadPath,
                    "my-context-app",
                    "src",
                    "App.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "my-context-app",
                    "src",
                    "App.js"
                  ),
                  path.join(
                    actualDownloadPath,
                    "my-context-app",
                    "src",
                    "main.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "my-context-app",
                    "src",
                    "main.js"
                  ),
                  path.join(
                    actualDownloadPath,
                    "context-practice",
                    "src",
                    "App.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "context-practice",
                    "src",
                    "App.js"
                  ),
                  path.join(
                    actualDownloadPath,
                    "context-practice",
                    "src",
                    "main.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "context-practice",
                    "src",
                    "main.js"
                  ),
                  path.join(
                    actualDownloadPath,
                    "app-context",
                    "src",
                    "App.jsx"
                  ),
                  path.join(actualDownloadPath, "app-context", "src", "App.js"),
                  path.join(
                    actualDownloadPath,
                    "app-context",
                    "src",
                    "main.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "app-context",
                    "src",
                    "main.js"
                  ),
                  path.join(actualDownloadPath, "react", "src", "App.jsx"),
                  path.join(actualDownloadPath, "react", "src", "App.js"),
                  path.join(actualDownloadPath, "react", "src", "main.jsx"),
                  path.join(actualDownloadPath, "react", "src", "main.js"),
                  path.join(actualDownloadPath, "react_blog", "src", "App.jsx"),
                  path.join(actualDownloadPath, "react_blog", "src", "App.js"),
                  path.join(actualDownloadPath, "react-name", "src", "App.jsx"),
                  path.join(actualDownloadPath, "react-name", "src", "App.js"),
                  path.join(actualDownloadPath, "app-name", "src", "App.jsx"),
                  path.join(actualDownloadPath, "app-name", "src", "App.js"),
                  path.join(
                    actualDownloadPath,
                    "React-StarterCode",
                    "src",
                    "App.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "React-StarterCode",
                    "src",
                    "App.js"
                  ),
                  path.join(
                    actualDownloadPath,
                    "React-StarterCode",
                    "React-StarterCode",
                    "src",
                    "App.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "React-StarterCode",
                    "React-StarterCode",
                    "src",
                    "App.js"
                  ),
                  path.join(actualDownloadPath, "test", "src", "App.jsx"),
                  path.join(actualDownloadPath, "test", "src", "App.js"),
                ];

                for (const possiblePath of possiblePaths) {
                  if (fs.existsSync(possiblePath)) {
                    actualFilePath = possiblePath;
                    break;
                  }
                }

                if (!actualFilePath) {
                  const searchDirs = [
                    downloadPath,
                    path.join(actualDownloadPath, "src"),
                    path.join(actualDownloadPath, "react_blog"),
                    path.join(actualDownloadPath, "react_blog", "src"),
                    path.join(actualDownloadPath, "react-name"),
                    path.join(actualDownloadPath, "react-name", "src"),
                    path.join(actualDownloadPath, "app-name"),
                    path.join(actualDownloadPath, "app-name", "src"),
                    path.join(actualDownloadPath, "React-StarterCode"),
                    path.join(actualDownloadPath, "React-StarterCode", "src"),
                    path.join(
                      downloadPath,
                      "React-StarterCode",
                      "React-StarterCode"
                    ),
                    path.join(
                      downloadPath,
                      "React-StarterCode",
                      "React-StarterCode",
                      "src"
                    ),
                    path.join(actualDownloadPath, "test"),
                    path.join(actualDownloadPath, "test", "src"),
                  ];

                  for (const searchDir of searchDirs) {
                    if (fs.existsSync(searchDir)) {
                      const files = fs.readdirSync(searchDir);
                      const jsxFile = files.find((f) => f.endsWith(".jsx"));
                      const jsFile = files.find((f) => f.endsWith(".js"));
                      if (jsxFile) {
                        actualFilePath = path.join(searchDir, jsxFile);
                        break;
                      } else if (jsFile) {
                        actualFilePath = path.join(searchDir, jsFile);
                        break;
                      }
                    }
                  }
                }
              } else if (lectureId === "W13D03_Redux") {
                const possiblePaths = [
                  path.join(actualDownloadPath, "src", "App.jsx"),
                  path.join(actualDownloadPath, "src", "App.js"),
                  path.join(actualDownloadPath, "src", "main.jsx"),
                  path.join(actualDownloadPath, "src", "main.js"),
                  path.join(actualDownloadPath, "app", "src", "App.jsx"),
                  path.join(actualDownloadPath, "app", "src", "App.js"),
                  path.join(actualDownloadPath, "app", "src", "main.jsx"),
                  path.join(actualDownloadPath, "app", "src", "main.js"),
                  path.join(
                    actualDownloadPath,
                    "my-context-app",
                    "src",
                    "App.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "my-context-app",
                    "src",
                    "App.js"
                  ),
                  path.join(
                    actualDownloadPath,
                    "my-context-app",
                    "src",
                    "main.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "my-context-app",
                    "src",
                    "main.js"
                  ),
                  path.join(
                    actualDownloadPath,
                    "context-practice",
                    "src",
                    "App.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "context-practice",
                    "src",
                    "App.js"
                  ),
                  path.join(
                    actualDownloadPath,
                    "context-practice",
                    "src",
                    "main.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "context-practice",
                    "src",
                    "main.js"
                  ),
                  path.join(
                    actualDownloadPath,
                    "app-context",
                    "src",
                    "App.jsx"
                  ),
                  path.join(actualDownloadPath, "app-context", "src", "App.js"),
                  path.join(
                    actualDownloadPath,
                    "app-context",
                    "src",
                    "main.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "app-context",
                    "src",
                    "main.js"
                  ),
                  path.join(actualDownloadPath, "react", "src", "App.jsx"),
                  path.join(actualDownloadPath, "react", "src", "App.js"),
                  path.join(actualDownloadPath, "react", "src", "main.jsx"),
                  path.join(actualDownloadPath, "react", "src", "main.js"),
                  path.join(actualDownloadPath, "react_blog", "src", "App.jsx"),
                  path.join(actualDownloadPath, "react_blog", "src", "App.js"),
                  path.join(actualDownloadPath, "react-name", "src", "App.jsx"),
                  path.join(actualDownloadPath, "react-name", "src", "App.js"),
                  path.join(actualDownloadPath, "app-name", "src", "App.jsx"),
                  path.join(actualDownloadPath, "app-name", "src", "App.js"),
                  path.join(
                    actualDownloadPath,
                    "React-StarterCode",
                    "src",
                    "App.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "React-StarterCode",
                    "src",
                    "App.js"
                  ),
                  path.join(
                    actualDownloadPath,
                    "React-StarterCode",
                    "React-StarterCode",
                    "src",
                    "App.jsx"
                  ),
                  path.join(
                    actualDownloadPath,
                    "React-StarterCode",
                    "React-StarterCode",
                    "src",
                    "App.js"
                  ),
                  path.join(actualDownloadPath, "test", "src", "App.jsx"),
                  path.join(actualDownloadPath, "test", "src", "App.js"),
                ];

                for (const possiblePath of possiblePaths) {
                  if (fs.existsSync(possiblePath)) {
                    actualFilePath = possiblePath;
                    break;
                  }
                }

                if (!actualFilePath) {
                  const searchDirs = [
                    actualDownloadPath,
                    path.join(actualDownloadPath, "src"),
                    path.join(actualDownloadPath, "app"),
                    path.join(actualDownloadPath, "app", "src"),
                    path.join(actualDownloadPath, "my-context-app"),
                    path.join(actualDownloadPath, "my-context-app", "src"),
                    path.join(actualDownloadPath, "context-practice"),
                    path.join(actualDownloadPath, "context-practice", "src"),
                    path.join(actualDownloadPath, "app-context"),
                    path.join(actualDownloadPath, "app-context", "src"),
                    path.join(actualDownloadPath, "react"),
                    path.join(actualDownloadPath, "react", "src"),
                    path.join(actualDownloadPath, "react_blog"),
                    path.join(actualDownloadPath, "react_blog", "src"),
                    path.join(actualDownloadPath, "react-name"),
                    path.join(actualDownloadPath, "react-name", "src"),
                    path.join(actualDownloadPath, "app-name"),
                    path.join(actualDownloadPath, "app-name", "src"),
                    path.join(actualDownloadPath, "React-StarterCode"),
                    path.join(actualDownloadPath, "React-StarterCode", "src"),
                    path.join(
                      actualDownloadPath,
                      "React-StarterCode",
                      "React-StarterCode"
                    ),
                    path.join(
                      actualDownloadPath,
                      "React-StarterCode",
                      "React-StarterCode",
                      "src"
                    ),
                    path.join(actualDownloadPath, "test"),
                    path.join(actualDownloadPath, "test", "src"),
                  ];

                  for (const searchDir of searchDirs) {
                    if (fs.existsSync(searchDir)) {
                      const files = fs.readdirSync(searchDir);
                      const jsxFile = files.find((f) => f.endsWith(".jsx"));
                      const jsFile = files.find((f) => f.endsWith(".js"));
                      if (jsxFile) {
                        actualFilePath = path.join(searchDir, jsxFile);
                        break;
                      } else if (jsFile) {
                        actualFilePath = path.join(searchDir, jsFile);
                        break;
                      }
                    }
                  }
                }
              } else if (
                lectureId === "W16D01_Postgress_Intro" ||
                lectureId === "W16D03_Postgress_Relational_Database"
              ) {
                const possiblePaths = [
                  path.join(actualDownloadPath, "server.js"),
                  path.join(actualDownloadPath, "index.js"),
                  path.join(actualDownloadPath, "app.js"),
                  path.join(actualDownloadPath, "main.js"),
                  path.join(actualDownloadPath, "db.js"),
                  path.join(actualDownloadPath, "SQL", "server.js"),
                  path.join(actualDownloadPath, "SQL", "index.js"),
                  path.join(actualDownloadPath, "SQL", "app.js"),
                  path.join(actualDownloadPath, "SQL", "main.js"),
                  path.join(actualDownloadPath, "SQL", "db.js"),
                  path.join(actualDownloadPath, "sql", "server.js"),
                  path.join(actualDownloadPath, "sql", "index.js"),
                  path.join(actualDownloadPath, "sql", "app.js"),
                  path.join(actualDownloadPath, "sql", "main.js"),
                  path.join(actualDownloadPath, "sql", "db.js"),
                  path.join(actualDownloadPath, "app", "server.js"),
                  path.join(actualDownloadPath, "app", "index.js"),
                  path.join(actualDownloadPath, "src", "server.js"),
                  path.join(actualDownloadPath, "src", "index.js"),
                  path.join(actualDownloadPath, "server", "server.js"),
                  path.join(actualDownloadPath, "server", "index.js"),
                  path.join(actualDownloadPath, "api", "server.js"),
                  path.join(actualDownloadPath, "api", "index.js"),
                  path.join(actualDownloadPath, "backend", "server.js"),
                  path.join(actualDownloadPath, "backend", "index.js"),
                  path.join(actualDownloadPath, "postgres", "server.js"),
                  path.join(actualDownloadPath, "postgres", "index.js"),
                  path.join(actualDownloadPath, "postgresql", "server.js"),
                  path.join(actualDownloadPath, "postgresql", "index.js"),
                  path.join(actualDownloadPath, "database", "server.js"),
                  path.join(actualDownloadPath, "database", "index.js"),
                  path.join(actualDownloadPath, "db", "server.js"),
                  path.join(actualDownloadPath, "db", "index.js"),
                  path.join(actualDownloadPath, "data", "server.js"),
                  path.join(actualDownloadPath, "data", "index.js"),
                ];

                for (const possiblePath of possiblePaths) {
                  if (fs.existsSync(possiblePath)) {
                    actualFilePath = possiblePath;
                    break;
                  }
                }

                if (!actualFilePath) {
                  const searchDirs = [
                    actualDownloadPath,
                    path.join(actualDownloadPath, "SQL"),
                    path.join(actualDownloadPath, "sql"),
                    path.join(actualDownloadPath, "app"),
                    path.join(actualDownloadPath, "src"),
                    path.join(actualDownloadPath, "server"),
                    path.join(actualDownloadPath, "api"),
                    path.join(actualDownloadPath, "backend"),
                    path.join(actualDownloadPath, "postgres"),
                    path.join(actualDownloadPath, "postgresql"),
                    path.join(actualDownloadPath, "database"),
                    path.join(actualDownloadPath, "db"),
                    path.join(actualDownloadPath, "data"),
                  ];

                  for (const searchDir of searchDirs) {
                    if (fs.existsSync(searchDir)) {
                      const files = fs.readdirSync(searchDir);
                      const jsFile = files.find(
                        (f) =>
                          f.endsWith(".js") &&
                          !f.includes("config") &&
                          !f.includes("vite") &&
                          !f.includes("eslint")
                      );
                      if (jsFile) {
                        actualFilePath = path.join(searchDir, jsFile);
                        break;
                      }
                    }
                  }
                }
              } else {
                const indexHtml = path.join(actualDownloadPath, "index.html");
                if (fs.existsSync(indexHtml)) {
                  actualFilePath = indexHtml;
                } else {
                  const files = fs.readdirSync(actualDownloadPath);
                  const htmlFile = files.find((f) => f.endsWith(".html"));
                  if (htmlFile) {
                    actualFilePath = path.join(actualDownloadPath, htmlFile);
                  }
                }

                if (!actualFilePath) {
                  const indexFile = path.join(actualDownloadPath, "index.js");
                  if (fs.existsSync(indexFile)) {
                    actualFilePath = indexFile;
                  } else {
                    const files2 = fs.readdirSync(downloadPath);
                    const jsFile = files2.find((f) => f.endsWith(".js"));
                    if (jsFile) {
                      actualFilePath = path.join(actualDownloadPath, jsFile);
                    }
                  }
                }

                if (!actualFilePath && lectureId === "W05D01_CSS_Layouts") {
                  const files = fs.readdirSync(actualDownloadPath);
                  const cssFile = files.find((f) => f.endsWith(".css"));
                  if (cssFile) {
                    actualFilePath = path.join(actualDownloadPath, cssFile);
                  }
                }
              }
            }

            if (!actualFilePath) {
              if (lectureId === "W12D01_React_Intro") {
                const nestedFolders = ["app-name", "React-StarterCode", "test"];
                for (const folder of nestedFolders) {
                  const nestedPath = path.join(actualDownloadPath, folder);
                  if (fs.existsSync(nestedPath)) {
                    const nestedFiles = fs.readdirSync(nestedPath);
                    const jsxFile = nestedFiles.find((f) => f.endsWith(".jsx"));
                    const jsFile = nestedFiles.find((f) => f.endsWith(".js"));
                    if (jsxFile) {
                      actualFilePath = path.join(nestedPath, jsxFile);
                      break;
                    } else if (jsFile) {
                      actualFilePath = path.join(nestedPath, jsFile);
                      break;
                    }
                  }
                }
              }

              if (!actualFilePath) {
                return res.status(404).json({
                  error: `No suitable files found in ${downloadPath}`,
                });
              }
            }

            result = this.ultraDynamicGradingEngine.gradeSubmission(
              studentId,
              lectureId,
              actualFilePath
            );
          } else {
            const enhancedGradingSystem =
              this.getEnhancedGradingSystem(lectureId);

            if (enhancedGradingSystem) {
              result = enhancedGradingSystem.gradeSubmission(
                studentId,
                lectureId,
                path.resolve(filePath)
              );
            } else {
              result = this.gradingEngine.gradeSubmissionNoCode(
                studentId,
                lectureId,
                filePath
              );
            }
          }
        } catch (gradingError) {
          return res.status(500).json({
            error: `Grading failed: ${gradingError.message}`,
            details: gradingError.stack,
          });
        }

        this.addOrUpdateResult(result);

        this.autoCleanupAfterGrading();

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/grade-enhanced", async (req, res) => {
      try {
        const { studentId, lectureId } = req.body;

        if (!studentId || !lectureId) {
          return res
            .status(400)
            .json({ error: "Student ID and Lecture ID are required" });
        }

        const student = this.config.students.find((s) => s.id === studentId);

        if (!student) {
          return res.status(404).json({ error: "Student not found" });
        }

        if (!student.lectures) {
          student.lectures = [];
        }

        let lecture = student.lectures.find((l) => l.lectureId === lectureId);
        if (!lecture) {
          lecture = {
            lectureId: lectureId,
            repoName: lectureId, // Use lecture ID as repo name
            filePath: "main.js", // Default file path
            status: "active",
          };
          student.lectures.push(lecture);

          const studentIndex = this.config.students.findIndex(
            (s) => s.id === studentId
          );
          if (studentIndex !== -1) {
            this.config.students[studentIndex] = student;
          }
        }

        const filePath = path.join(
          "downloads",
          studentId,
          lectureId,
          lecture.filePath
        );

        const cohortNumber =
          student.cohortNumber || student.cohort?.replace("C", "") || "15";
        const hasPrefix = student.github.username.startsWith(
          `C${cohortNumber}-`
        );
        const finalUsername = hasPrefix
          ? student.github.username
          : `C${cohortNumber}-${student.github.username}`;

        if (!fs.existsSync(filePath)) {
          try {
            await this.downloader.downloadRepository(
              finalUsername,
              this.config.globalToken, // Use global token
              lecture.repoName,
              studentId,
              lectureId
            );

            if (!fs.existsSync(filePath)) {
              return res.status(404).json({
                error: `Repository not found: ${finalUsername}/${lecture.repoName}. Please ensure the repository exists and the student has the correct GitHub username.`,
              });
            }
          } catch (downloadError) {
            return res.status(404).json({
              error: `Failed to download repository: ${finalUsername}/${lecture.repoName}. Error: ${downloadError.message}`,
            });
          }
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          this.fileFilter.printStatistics(filePath);

          this.fileFilter.printCleanupStats(filePath, true); // dry run
        }

        let result;
        try {
          const enhancedGradingSystem =
            this.getEnhancedGradingSystem(lectureId);

          if (enhancedGradingSystem) {
            result = enhancedGradingSystem.gradeSubmission(
              studentId,
              lectureId,
              path.resolve(filePath)
            );
          } else {
            result = await this.ultimateGradingEngine.gradeSubmission(
              studentId,
              lectureId,
              filePath
            );
          }
        } catch (gradingError) {
          return res.status(500).json({
            error: `Enhanced grading failed: ${gradingError.message}`,
            details: gradingError.stack,
          });
        }

        this.addOrUpdateResult(result);

        this.autoCleanupAfterGrading();

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/download", async (req, res) => {
      try {
        const { studentId, lectureId } = req.body;

        if (!studentId || !lectureId) {
          return res
            .status(400)
            .json({ error: "Student ID and Lecture ID are required" });
        }

        const student = this.config.students.find((s) => s.id === studentId);
        const lecture = student?.lectures.find(
          (l) => l.lectureId === lectureId
        );

        if (!student || !lecture) {
          return res
            .status(404)
            .json({ error: "Student or lecture not found" });
        }

        await this.downloader.downloadRepository(
          student.github.username,
          this.config.globalToken,
          lecture.repoName,
          studentId,
          lectureId
        );

        res.json({
          success: true,
          message: "Repository downloaded successfully",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/results", (req, res) => {
      try {
        const { cohort } = req.query;
        let results = this.getResults();

        if (cohort) {
          const cohortNumber = parseInt(cohort);
          const cohortStudents =
            this.cohortManager.getStudentsByCohort(cohortNumber);
          const cohortStudentIds = cohortStudents.map((s) => s.id);
          results = results.filter((r) =>
            cohortStudentIds.includes(r.studentId)
          );
        }

        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/results/detailed", (req, res) => {
      try {
        const resultsData = this.loadResults();
        const results = Array.isArray(resultsData.results)
          ? resultsData.results
          : [];

        const resultsWithCohort = results.map((result) => {
          const student = this.config.students.find(
            (s) => s.id === result.studentId
          );
          return {
            ...result,
            cohortNumber: student
              ? student.cohortNumber || student.cohort?.replace("C", "") || "15"
              : "15",
          };
        });

        res.json(resultsWithCohort);
      } catch (error) {
        res.json([]);
      }
    });

    this.app.get("/api/results/:filename", (req, res) => {
      try {
        const filename = req.params.filename;
        const filePath = path.join("results", filename);

        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: "Result file not found" });
        }

        const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
        res.json(content);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/cleanup", (req, res) => {
      try {
        const { studentId, lectureId } = req.body;

        if (studentId && lectureId) {
          const studentDir = path.join("downloads", studentId, lectureId);
          if (fs.existsSync(studentDir)) {
            fs.rmSync(studentDir, { recursive: true, force: true });
            res.json({
              success: true,
              message: `Cleaned up ${studentId}'s files`,
            });
          } else {
            res.json({ success: true, message: "No files to clean up" });
          }
        } else {
          const downloadsDir = "downloads";
          if (fs.existsSync(downloadsDir)) {
            fs.rmSync(downloadsDir, { recursive: true, force: true });
            res.json({ success: true, message: "All files cleaned up" });
          } else {
            res.json({ success: true, message: "No files to clean up" });
          }
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/cleanup/grades", (req, res) => {
      try {
        const result = this.gradesOptimizer.optimizeGrades();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post("/api/cleanup/downloads", (req, res) => {
      try {
        const result = this.gradesOptimizer.cleanupDownloads();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post("/api/cleanup/full", (req, res) => {
      try {
        const result = this.gradesOptimizer.fullCleanup();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get("/api/cleanup/auto-status", (req, res) => {
      try {
        res.json({
          success: true,
          autoCleanupEnabled: this.autoCleanupEnabled,
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post("/api/cleanup/auto-toggle", (req, res) => {
      try {
        const { enabled } = req.body;
        this.autoCleanupEnabled =
          enabled !== undefined ? enabled : !this.autoCleanupEnabled;

        res.json({
          success: true,
          autoCleanupEnabled: this.autoCleanupEnabled,
          message: `Auto-cleanup ${
            this.autoCleanupEnabled ? "enabled" : "disabled"
          }`,
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get("/api/cleanup/sizes", (req, res) => {
      try {
        const sizes = this.gradesOptimizer.getFileSizes();
        res.json({
          success: true,
          sizes: {
            grades: sizes.grades
              ? (sizes.grades / 1024 / 1024).toFixed(2) + "MB"
              : "N/A",
            downloads: sizes.downloads
              ? (sizes.downloads / 1024 / 1024).toFixed(2) + "MB"
              : "N/A",
          },
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get("/api/cohorts", (req, res) => {
      try {
        const cohorts = this.cohortManager.getAllCohorts();
        res.json({ cohorts: cohorts });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/cohorts/active", (req, res) => {
      try {
        const activeCohort = this.cohortManager.getActiveCohort();
        res.json(activeCohort);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/cohorts/:number", (req, res) => {
      try {
        const cohortNumber = parseInt(req.params.number);
        const cohort = this.cohortManager.getCohortByNumber(cohortNumber);
        if (!cohort) {
          return res.status(404).json({ error: "Cohort not found" });
        }
        res.json(cohort);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.put("/api/cohorts/:number", (req, res) => {
      try {
        const cohortNumber = parseInt(req.params.number);
        const { status, startDate, endDate, duration } = req.body;

        const cohort = this.cohortManager.getCohortByNumber(cohortNumber);
        if (!cohort) {
          return res.status(404).json({ error: "Cohort not found" });
        }

        if (status) cohort.status = status;
        if (startDate) cohort.startDate = startDate;
        if (endDate) cohort.endDate = endDate;
        if (duration) cohort.duration = duration;

        this.cohortManager.saveCohorts();

        res.json({
          success: true,
          cohort,
          message: "Cohort updated successfully",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete("/api/cohorts/:number", (req, res) => {
      try {
        const cohortNumber = parseInt(req.params.number);
        const cohort = this.cohortManager.getCohortByNumber(cohortNumber);
        if (!cohort) {
          return res.status(404).json({ error: "Cohort not found" });
        }

        this.cohortManager.cohorts.cohorts =
          this.cohortManager.cohorts.cohorts.filter(
            (c) => c.number !== cohortNumber
          );

        this.cohortManager.saveCohorts();

        res.json({ success: true, message: "Cohort deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/cohorts/:number/students", (req, res) => {
      try {
        const cohortNumber = parseInt(req.params.number);
        const students = this.cohortManager.getStudentsByCohort(cohortNumber);
        res.json(students);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/cohorts/:number/stats", (req, res) => {
      try {
        const cohortNumber = parseInt(req.params.number);
        const stats = this.cohortManager.getCohortStats(cohortNumber);
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/cohorts", (req, res) => {
      try {
        const cohortData = req.body;
        const newCohort = this.cohortManager.addCohort(cohortData);
        res.json({
          success: true,
          cohort: newCohort,
          message: "Cohort added successfully",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/cohorts/next", (req, res) => {
      try {
        const newCohort = this.cohortManager.createNextCohort();
        res.json({
          success: true,
          cohort: newCohort,
          message: "Next cohort created successfully",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.put("/api/cohorts/:number", (req, res) => {
      try {
        const cohortNumber = parseInt(req.params.number);
        const cohortData = req.body;
        const updatedCohort = this.cohortManager.updateCohort(
          cohortNumber,
          cohortData
        );
        res.json({
          success: true,
          cohort: updatedCohort,
          message: "Cohort updated successfully",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete("/api/cohorts/:number", (req, res) => {
      try {
        const cohortNumber = parseInt(req.params.number);
        this.cohortManager.deleteCohort(cohortNumber);
        res.json({
          success: true,
          message: "Cohort deleted successfully",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get("/api/cohorts/timeline", (req, res) => {
      try {
        const timeline = this.cohortManager.getCohortTimeline();
        res.json(timeline);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/students", (req, res) => {
      try {
        const { name, id, github, lectures, cohortNumber } = req.body;

        if (!name || !id || !github) {
          return res
            .status(400)
            .json({ error: "Name, ID, and GitHub info are required" });
        }

        const targetCohort =
          cohortNumber || this.cohortManager.getActiveCohort()?.number;
        if (!targetCohort) {
          return res.status(400).json({ error: "No active cohort found" });
        }

        const newStudent = this.cohortManager.addStudentToCohort(
          {
            name,
            id,
            github,
            lectures: lectures || [],
          },
          targetCohort
        );

        res.json({
          success: true,
          student: newStudent,
          message: "Student added successfully",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/students/bulk", (req, res) => {
      try {
        const { students } = req.body;

        if (!students || !Array.isArray(students)) {
          return res.status(400).json({ error: "Students array is required" });
        }

        const addedStudents = [];
        const errors = [];

        for (const studentData of students) {
          try {
            const { name, id, github, cohortNumber } = studentData;

            if (!name || !id || !github) {
              errors.push(
                `Student ${
                  name || "unknown"
                }: Name, ID, and GitHub info are required`
              );
              continue;
            }

            const targetCohort =
              cohortNumber || this.cohortManager.getActiveCohort()?.number;
            if (!targetCohort) {
              errors.push(`Student ${name}: No active cohort found`);
              continue;
            }

            const newStudent = this.cohortManager.addStudentToCohort(
              {
                name,
                id,
                github,
                lectures: [],
              },
              targetCohort
            );

            addedStudents.push(newStudent);
          } catch (error) {
            errors.push(
              `Student ${studentData.name || "unknown"}: ${error.message}`
            );
          }
        }

        res.json({
          success: true,
          addedStudents,
          errors,
          message: `Successfully added ${addedStudents.length} students${
            errors.length > 0 ? ` with ${errors.length} errors` : ""
          }`,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete("/api/students/:id", (req, res) => {
      try {
        const studentId = req.params.id;

        if (!studentId) {
          return res.status(400).json({ error: "Student ID is required" });
        }

        const removedStudent =
          this.cohortManager.removeStudentFromAllCohorts(studentId);

        if (!removedStudent) {
          return res.status(404).json({ error: "Student not found" });
        }

        this.removeStudentResults(studentId);

        res.json({
          success: true,
          student: removedStudent,
          message: "Student and all their results removed successfully",
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/lectures", (req, res) => {
      try {
        const {
          name,
          id,
          description,
          repoName,
          filePath,
          questions,
          totalQuestions,
          categories,
        } = req.body;

        if (!name || !id || !description || !repoName || !filePath) {
          return res
            .status(400)
            .json({ error: "All lecture fields are required" });
        }

        const lecturesPath = path.join("config", "lectures.json");
        const lecturesData = JSON.parse(fs.readFileSync(lecturesPath, "utf8"));

        if (lecturesData.lectures.find((l) => l.id === id)) {
          return res
            .status(400)
            .json({ error: "Lecture with this ID already exists" });
        }

        const newLecture = {
          id,
          name,
          description,
          repoName,
          filePath,
          questions: questions || [],
          totalQuestions: totalQuestions || 0,
          categories: categories || {},
        };

        lecturesData.lectures.push(newLecture);
        fs.writeFileSync(lecturesPath, JSON.stringify(lecturesData, null, 2));

        res.json({ success: true, message: "Lecture added successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/questions", (req, res) => {
      try {
        const { lectureId, question } = req.body;

        if (!lectureId || !question) {
          return res
            .status(400)
            .json({ error: "Lecture ID and question are required" });
        }

        const lecturesPath = path.join("config", "lectures.json");
        const lecturesData = JSON.parse(fs.readFileSync(lecturesPath, "utf8"));

        const lecture = lecturesData.lectures.find((l) => l.id === lectureId);
        if (!lecture) {
          return res.status(404).json({ error: "Lecture not found" });
        }

        if (lecture.questions.find((q) => q.id === question.id)) {
          return res
            .status(400)
            .json({ error: "Question with this ID already exists" });
        }

        lecture.questions.push(question);
        lecture.totalQuestions = lecture.questions.length;

        if (!lecture.categories[question.category]) {
          lecture.categories[question.category] = 0;
        }
        lecture.categories[question.category]++;

        fs.writeFileSync(lecturesPath, JSON.stringify(lecturesData, null, 2));

        res.json({ success: true, message: "Question added successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post("/api/remove-results", (req, res) => {
      try {
        const { studentId, lectureId } = req.body;

        if (!studentId || !lectureId) {
          return res
            .status(400)
            .json({ error: "Student ID and Lecture ID are required" });
        }

        let results = {};
        if (fs.existsSync(this.resultsFile)) {
          results = JSON.parse(fs.readFileSync(this.resultsFile, "utf8"));
        }

        const originalCount = results.results ? results.results.length : 0;
        results.results = results.results.filter((result) => {
          return !(
            result.studentId === studentId && result.lectureId === lectureId
          );
        });

        const removedCount = originalCount - results.results.length;

        fs.writeFileSync(this.resultsFile, JSON.stringify(results, null, 2));

        res.json({
          success: true,
          message: "Results removed successfully",
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to remove results" });
      }
    });

    this.app.post("/api/remove-all-results", (req, res) => {
      try {
        if (fs.existsSync(this.resultsFile)) {
          fs.unlinkSync(this.resultsFile);
        }

        res.json({
          success: true,
          message: "All results removed successfully",
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to remove all results" });
      }
    });

    this.app.post("/api/remove-cohort-results", (req, res) => {
      try {
        const { cohortId, stageId } = req.body;

        if (!cohortId || !stageId) {
          return res
            .status(400)
            .json({ error: "Cohort ID and Stage ID are required" });
        }

        let results = {};
        if (fs.existsSync(this.resultsFile)) {
          results = JSON.parse(fs.readFileSync(this.resultsFile, "utf8"));
        }

        const cohortStudents = this.config.students.filter((student) => {
          return (
            student.cohort === cohortId ||
            student.cohort === `C${cohortId}` ||
            student.cohort === `Cohort ${cohortId}` ||
            student.cohortNumber == cohortId ||
            student.cohortNumber === parseInt(cohortId)
          );
        });

        const curriculumStages = [
          {
            id: "stage1",
            name: "Stage 1 - Foundation",
            lectures: [
              { id: "W01D01_Intro_To_JS", name: "Intro To JS" },
              { id: "W01D03_Functions", name: "Functions" },
              { id: "W01D05_Conditionals", name: "Conditionals" },
              { id: "W02D01_Scopes", name: "Scopes" },
              { id: "W02D03_Arrays", name: "Arrays" },
              { id: "W02D05_Objects", name: "Objects" },
              { id: "W03D01_Iteration_P1", name: "Iteration P1" },
              { id: "W03D03_Iteration_P2", name: "Iteration P2" },
              { id: "W03D05_Recursion", name: "Recursion" },
              { id: "W04D01_CB_HOF", name: "CB HOF" },
              { id: "W04D03_OOP", name: "OOP" },
              { id: "W04D05_HTML", name: "HTML" },
              { id: "W04D05_CSS_Intro", name: "CSS Intro" },
            ],
          },
        ];

        const stage = curriculumStages.find((stage) => stage.id === stageId);
        if (!stage) {
          return res.status(404).json({ error: "Stage not found" });
        }

        const stageLectures = stage.lectures || [];

        let removedCount = 0;
        const studentIds = cohortStudents.map((s) => s.id);
        const lectureIds = stageLectures.map((l) => l.id);

        const originalCount = results.results ? results.results.length : 0;
        results.results = results.results.filter((result) => {
          const shouldRemove =
            studentIds.includes(result.studentId) &&
            lectureIds.includes(result.lectureId);
          if (shouldRemove) {
            removedCount++;
          }
          return !shouldRemove;
        });

        fs.writeFileSync(this.resultsFile, JSON.stringify(results, null, 2));

        res.json({
          success: true,
          message: `Removed ${removedCount} results successfully`,
          removedCount: removedCount,
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to remove cohort results" });
      }
    });

    this.app.post("/api/grade-ultra-dynamic", async (req, res) => {
      try {
        const { studentId, lectureId, filePath } = req.body;

        if (!studentId || !lectureId) {
          return res.status(400).json({
            error: "Student ID and Lecture ID are required",
          });
        }

        const student = this.config.students.find((s) => s.id === studentId);
        const lecture = this.config.lectures.find((l) => l.id === lectureId);

        if (!student) {
          const statusResult = {
            studentId,
            lectureId,
            timestamp: new Date().toISOString(),
            status: "STUDENT_NOT_FOUND",
            message: `Student not found: ${studentId}`,
            gradingMethod: "ultra_dynamic",
            score: 0,
            totalWeight: 0,
            percentage: 0,
            results: [],
          };

          this.addOrUpdateResult(statusResult);
          return res.json(statusResult);
        }

        const cohortNumber =
          student.cohortNumber || student.cohort?.replace("C", "") || "12";
        const githubUsername = student.github?.username || "unknown";
        const finalUsername = githubUsername.includes("-")
          ? githubUsername
          : `C${cohortNumber}-${githubUsername}`;

        const repoName = lectureId;

        const repoVariations = [
          lectureId,
          `${lectureId}-`,
          `${lectureId}_`,
          `${lectureId}.`,
          `${lectureId}-main`,
          `${lectureId}-master`,
        ];

        const downloadPath = path.join("downloads", studentId, lectureId);

        let actualDownloadPath = downloadPath;
        if (!fs.existsSync(downloadPath)) {
          const variations = [
            `${lectureId}-`,
            `${lectureId}_`,
            `${lectureId}.`,
            `${lectureId}-main`,
            `${lectureId}-master`,
          ];

          for (const variation of variations) {
            const variationPath = path.join("downloads", studentId, variation);
            if (fs.existsSync(variationPath)) {
              actualDownloadPath = variationPath;
              break;
            }
          }
        }

        if (!fs.existsSync(actualDownloadPath)) {
          let downloadSuccess = false;
          let lastError = null;

          for (const repoVariation of repoVariations) {
            try {
              await this.downloader.downloadRepository(
                finalUsername,
                this.config.globalToken,
                repoVariation,
                studentId,
                lectureId
              );

              if (fs.existsSync(actualDownloadPath)) {
                downloadSuccess = true;
                break;
              }
            } catch (downloadError) {
              lastError = downloadError;
              continue;
            }
          }

          if (!downloadSuccess) {
            const statusResult = {
              studentId,
              lectureId,
              timestamp: new Date().toISOString(),
              status: "REPOSITORY_NOT_FOUND",
              message: `Repository ${finalUsername}/${repoVariations.join(
                " or "
              )} not found`,
              error: lastError?.message || "All repository variations failed",
              gradingMethod: "ultra_dynamic",
              score: 0,
              totalWeight: 0,
              percentage: 0,
              results: [],
            };

            this.addOrUpdateResult(statusResult);
            return res.json(statusResult);
          }
        }

        let actualFilePath;
        if (
          fs.existsSync(actualDownloadPath) &&
          fs.statSync(actualDownloadPath).isDirectory()
        ) {
          if (
            lectureId === "W04D05_CSS_Intro" ||
            lectureId === "W04D05_HTML" ||
            lectureId === "W05D01_CSS_Layouts" ||
            lectureId === "W05D03_DOM" ||
            lectureId === "W06D05_jQuery"
          ) {
            const indexHtml = path.join(actualDownloadPath, "index.html");
            if (fs.existsSync(indexHtml)) {
              actualFilePath = indexHtml;
            } else {
              const files = fs.readdirSync(actualDownloadPath);
              const htmlFile = files.find((f) => f.endsWith(".html"));
              if (htmlFile) {
                actualFilePath = path.join(actualDownloadPath, htmlFile);
              }
            }
          }

          if (
            !actualFilePath &&
            (lectureId === "W12D01_React_Intro" ||
              lectureId === "W12D03_React_Hooks" ||
              lectureId === "W12D05_React_Context" ||
              lectureId === "W13D03_Redux")
          ) {
            const srcPath = path.join(actualDownloadPath, "src");
            if (fs.existsSync(srcPath)) {
              const srcFiles = fs.readdirSync(srcPath);
              const jsxFile = srcFiles.find((f) => f.endsWith(".jsx"));
              const jsFile = srcFiles.find((f) => f.endsWith(".js"));
              if (jsxFile) {
                actualFilePath = path.join(srcPath, jsxFile);
              } else if (jsFile) {
                actualFilePath = path.join(srcPath, jsFile);
              }
            }
          }

          if (
            !actualFilePath &&
            lectureId !== "W12D01_React_Intro" &&
            lectureId !== "W12D03_React_Hooks" &&
            lectureId !== "W12D05_React_Context" &&
            lectureId !== "W13D03_Redux"
          ) {
            const indexFile = path.join(actualDownloadPath, "index.js");
            if (fs.existsSync(indexFile)) {
              actualFilePath = indexFile;
            } else {
              const files = fs.readdirSync(actualDownloadPath);
              const jsFile = files.find(
                (f) =>
                  f.endsWith(".js") &&
                  !f.includes("config") &&
                  !f.includes("vite") &&
                  !f.includes("eslint")
              );
              if (jsFile) {
                actualFilePath = path.join(actualDownloadPath, jsFile);
              }
            }
          }

          if (!actualFilePath) {
            if (
              lectureId === "W12D01_React_Intro" ||
              lectureId === "W12D03_React_Hooks" ||
              lectureId === "W12D05_React_Context" ||
              lectureId === "W13D03_Redux"
            ) {
              const nestedFolders = [
                "app",
                "app-name",
                "React-StarterCode",
                "test",
                "react_blog",
                "react-name",
                "my-context-app",
                "context-practice",
                "app-context",
                "react",
                "counter",
                "redux",
                "react-app",
                "context-app",
                "practice",
                "exercise",
                "assignment",
                "project",
                "demo",
                "example",
                "sample",
                "starter",
                "template",
                "boilerplate",
              ];
              for (const folder of nestedFolders) {
                const nestedPath = path.join(actualDownloadPath, folder);
                if (fs.existsSync(nestedPath)) {
                  const srcPath = path.join(nestedPath, "src");
                  if (fs.existsSync(srcPath)) {
                    const srcFiles = fs.readdirSync(srcPath);
                    const srcJsxFile = srcFiles.find((f) => f.endsWith(".jsx"));
                    const srcJsFile = srcFiles.find((f) => f.endsWith(".js"));
                    if (srcJsxFile) {
                      actualFilePath = path.join(srcPath, srcJsxFile);
                      break;
                    } else if (srcJsFile) {
                      actualFilePath = path.join(srcPath, srcJsFile);
                      break;
                    }
                  }

                  if (!actualFilePath) {
                    const nestedFiles = fs.readdirSync(nestedPath);
                    const jsxFile = nestedFiles.find((f) => f.endsWith(".jsx"));
                    const jsFile = nestedFiles.find(
                      (f) =>
                        f.endsWith(".js") &&
                        !f.includes("config") &&
                        !f.includes("vite") &&
                        !f.includes("eslint")
                    );
                    if (jsxFile) {
                      actualFilePath = path.join(nestedPath, jsxFile);
                      break;
                    } else if (jsFile) {
                      actualFilePath = path.join(nestedPath, jsFile);
                      break;
                    }
                  }
                }
              }
            }

            if (
              !actualFilePath &&
              (lectureId === "W16D01_Postgress_Intro" ||
                lectureId === "W16D03_Postgress_Relational_Database")
            ) {
              const nestedFolders = [
                "SQL",
                "sql",
                "app",
                "src",
                "server",
                "api",
                "backend",
                "postgres",
                "postgresql",
                "database",
                "db",
                "data",
              ];
              for (const folder of nestedFolders) {
                const nestedPath = path.join(actualDownloadPath, folder);
                if (fs.existsSync(nestedPath)) {
                  const nestedFiles = fs.readdirSync(nestedPath);
                  const jsFile = nestedFiles.find(
                    (f) =>
                      f.endsWith(".js") &&
                      !f.includes("config") &&
                      !f.includes("vite") &&
                      !f.includes("eslint")
                  );
                  if (jsFile) {
                    actualFilePath = path.join(nestedPath, jsFile);
                    break;
                  }
                }
              }
            }

            if (!actualFilePath) {
              const statusResult = {
                studentId,
                lectureId,
                timestamp: new Date().toISOString(),
                status: "EMPTY_REPOSITORY",
                message:
                  lectureId === "W05D01_CSS_Layouts"
                    ? `No JavaScript, HTML, or CSS files found in ${downloadPath}`
                    : `No JavaScript or HTML files found in ${downloadPath}`,
                gradingMethod: "ultra_dynamic",
                score: 0,
                totalWeight: 0,
                percentage: 0,
                results: [],
              };

              this.addOrUpdateResult(statusResult);
              return res.json(statusResult);
            }
          }
        } else {
          const statusResult = {
            studentId,
            lectureId,
            timestamp: new Date().toISOString(),
            status: "PATH_NOT_FOUND",
            message: `Download path not found: ${downloadPath}`,
            gradingMethod: "ultra_dynamic",
            score: 0,
            totalWeight: 0,
            percentage: 0,
            results: [],
          };

          this.addOrUpdateResult(statusResult);
          return res.json(statusResult);
        }

        const result = this.ultraDynamicGradingEngine.gradeSubmission(
          studentId,
          lectureId,
          actualFilePath
        );

        this.addOrUpdateResult(result);

        this.autoCleanupAfterGrading();

        res.json({
          success: true,
          result: result,
          gradingMethod: "ultra_dynamic",
        });
      } catch (error) {
        const statusResult = {
          studentId: req.body.studentId,
          lectureId: req.body.lectureId,
          timestamp: new Date().toISOString(),
          status: "GRADING_ERROR",
          message: `Grading failed: ${error.message}`,
          error: error.message,
          gradingMethod: "ultra_dynamic",
          score: 0,
          totalWeight: 0,
          percentage: 0,
          results: [],
        };

        this.addOrUpdateResult(statusResult);
        res.json(statusResult);
      }
    });

    this.app.post("/api/cleanup-grades", (req, res) => {
      try {
        const options = {
          truncateErrors: true,
          maxErrorLength: 500,
          limitCodeAnalysis: true,
          maxCodeLines: 20,
          removeOldResults: true,
          maxAgeDays: 30,
          createBackup: true,
        };

        const cleanupStats = this.gradesCleanup.cleanupGradesFile(options);

        if (cleanupStats.error) {
          return res.status(500).json({ error: cleanupStats.error });
        }

        res.json({
          success: true,
          message: "Grades file cleaned successfully",
          stats: cleanupStats,
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to cleanup grades file" });
      }
    });

    this.app.post("/api/remove-student-stage-results", (req, res) => {
      try {
        const { studentId, stageId } = req.body;

        if (!studentId || !stageId) {
          return res
            .status(400)
            .json({ error: "Student ID and Stage ID are required" });
        }

        let results = {};
        if (fs.existsSync(this.resultsFile)) {
          results = JSON.parse(fs.readFileSync(this.resultsFile, "utf8"));
        }

        const curriculumStages = [
          {
            id: "stage1",
            name: "Stage 1 - Foundation",
            lectures: [
              { id: "W01D01_Intro_To_JS", name: "Intro To JS" },
              { id: "W01D03_Functions", name: "Functions" },
              { id: "W01D05_Conditionals", name: "Conditionals" },
              { id: "W02D01_Scopes", name: "Scopes" },
              { id: "W02D03_Arrays", name: "Arrays" },
              { id: "W02D05_Objects", name: "Objects" },
              { id: "W03D01_Iteration_P1", name: "Iteration P1" },
              { id: "W03D03_Iteration_P2", name: "Iteration P2" },
              { id: "W03D05_Recursion", name: "Recursion" },
              { id: "W04D01_CB_HOF", name: "CB HOF" },
              { id: "W04D03_OOP", name: "OOP" },
              { id: "W04D05_HTML", name: "HTML" },
              { id: "W04D05_CSS_Intro", name: "CSS Intro" },
            ],
          },
        ];

        const stage = curriculumStages.find((stage) => stage.id === stageId);
        if (!stage) {
          return res.status(404).json({ error: "Stage not found" });
        }

        const stageLectures = stage.lectures || [];
        const lectureIds = stageLectures.map((l) => l.id);

        const originalCount = results.results ? results.results.length : 0;
        results.results = results.results.filter((result) => {
          return !(
            result.studentId === studentId &&
            lectureIds.includes(result.lectureId)
          );
        });

        const removedCount = originalCount - results.results.length;

        fs.writeFileSync(this.resultsFile, JSON.stringify(results, null, 2));

        res.json({
          success: true,
          message: `Removed ${removedCount} results successfully`,
          removedCount: removedCount,
        });
      } catch (error) {
        res
          .status(500)
          .json({ error: "Failed to remove student stage results" });
      }
    });

    this.app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "public", "index.html"));
    });
  }

  start() {
    this.app.listen(this.port, () => {});
  }
}

const server = new WebUIServer();
server.start();

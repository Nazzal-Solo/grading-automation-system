#!/usr/bin/env node

import fs from "fs";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import { UltraDynamicGradingEngine } from "./core/UltraDynamicGradingEngine.js";
import { GitHubDownloader } from "./core/GitHubDownloader.js";

class AutoGradingPlatform {
  constructor() {
    this.config = this.loadConfig();
    this.gradingEngine = new UltraDynamicGradingEngine(this.config);
    this.downloader = new GitHubDownloader(this.config);
    // this.analyticsEngine = new AnalyticsEngine();
  }

  /**
   * Load configuration files
   */
  loadConfig() {
    const studentsPath = path.join("config", "students.json");
    const lecturesPath = path.join("config", "lectures.json");

    if (!fs.existsSync(studentsPath) || !fs.existsSync(lecturesPath)) {

      process.exit(1);
    }

    return {
      students: JSON.parse(fs.readFileSync(studentsPath, "utf8")).students,
      lectures: JSON.parse(fs.readFileSync(lecturesPath, "utf8")).lectures,
    };
  }

  /**
   * Main menu
   */
  async showMainMenu() {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { name: "📥 Download all student repositories", value: "download" },
          { name: "🔍 Grade specific student/lecture", value: "grade-single" },
          { name: "📊 Grade all students and lectures", value: "grade-all" },
          { name: "📈 View analytics dashboard", value: "dashboard" },
          { name: "⚙️  Manage configuration", value: "config" },
          { name: "❌ Exit", value: "exit" },
        ],
      },
    ]);

    await this.handleAction(action);
  }

  /**
   * Handle user action
   */
  async handleAction(action) {
    switch (action) {
      case "download":
        await this.downloadAllRepositories();
        break;
      case "grade-single":
        await this.gradeSingleSubmission();
        break;
      case "grade-all":
        await this.gradeAllSubmissions();
        break;
      case "dashboard":
        await this.showDashboard();
        break;
      case "config":
        await this.manageConfiguration();
        break;
      case "exit":
        process.exit(0);
        break;
    }

    await this.showMainMenu();
  }

  /**
   * Download all repositories
   */
  async downloadAllRepositories() {
    await this.downloader.downloadAllRepositories();
  }

  /**
   * Grade single submission
   */
  async gradeSingleSubmission() {
    const { studentId, lectureId } = await inquirer.prompt([
      {
        type: "list",
        name: "studentId",
        message: "Select student:",
        choices: this.config.students.map((s) => ({
          name: s.name,
          value: s.id,
        })),
      },
      {
        type: "list",
        name: "lectureId",
        message: "Select lecture:",
        choices: this.config.lectures.map((l) => ({
          name: l.name,
          value: l.id,
        })),
      },
    ]);

    const student = this.config.students.find((s) => s.id === studentId);
    const lecture = student.lectures.find((l) => l.lectureId === lectureId);

    if (!lecture) {
      return;
    }

    const filePath = path.join(
      "downloads",
      studentId,
      lectureId,
      lecture.filePath
    );

    if (!fs.existsSync(filePath)) {
      try {
        await this.downloader.downloadRepository(
          student.github.username,
          student.github.token,
          lecture.repoName,
          studentId,
          lectureId
        );

        if (!fs.existsSync(filePath)) {
          return;
        }
      } catch (error) {
        return;
      }
    }

    const result = this.gradingEngine.gradeSubmission(
      studentId,
      lectureId,
      filePath
    );

    this.displayGradingResult(result);

    await this.askForCleanup(studentId, lectureId);
  }

  /**
   * Ask user if they want to clean up student files
   */
  async askForCleanup(studentId, lectureId) {
    const { cleanup } = await inquirer.prompt([
      {
        type: "confirm",
        name: "cleanup",
        message: `🗑️  Do you want to remove ${studentId}'s solution files to save storage?`,
        default: true,
      },
    ]);

    if (cleanup) {
      await this.cleanupStudentFiles(studentId, lectureId);
    }
  }

  /**
   * Clean up student solution files
   */
  async cleanupStudentFiles(studentId, lectureId) {
    const studentDir = path.join("downloads", studentId, lectureId);

    if (fs.existsSync(studentDir)) {
      try {
        fs.rmSync(studentDir, { recursive: true, force: true });
      } catch (error) {
      }
    } else {
    }
  }

  /**
   * Grade all submissions
   */
  async gradeAllSubmissions() {
    const results = [];

    for (const student of this.config.students) {
      for (const lecture of student.lectures) {
        if (lecture.status === "active") {
          const filePath = path.join(
            "downloads",
            student.id,
            lecture.lectureId,
            lecture.filePath
          );

          if (fs.existsSync(filePath)) {
            const result = this.gradingEngine.gradeSubmission(
              student.id,
              lecture.lectureId,
              filePath
            );
            results.push(result);
          } else {
          }
        }
      }
    }

    // const analytics = this.analyticsEngine.analyzeResults(results);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.gradingEngine.saveResults(`results/grading-${timestamp}.json`);
    // this.analyticsEngine.saveAnalytics(`results/analytics-${timestamp}.json`);

      `\n✅ Grading completed! Results saved to results/grading-${timestamp}.json`
    );
    // this.displayOverallResults(analytics);
  }

  /**
   * Show analytics dashboard
   */
  async showDashboard() {
    const resultsFiles = fs
      .readdirSync("results")
      .filter((f) => f.startsWith("grading-"));

    if (resultsFiles.length === 0) {
      return;
    }

    const latestResults = resultsFiles.sort().pop();
    const resultsData = JSON.parse(
      fs.readFileSync(path.join("results", latestResults), "utf8")
    );

    this.displayOverallStats(resultsData);
    this.displayStudentPerformance(resultsData);
    this.displayLectureAnalysis(resultsData);
  }

  /**
   * Display grading result
   */
  displayGradingResult(result) {

    if (result.error) {
    }
  }

  /**
   * Display overall results
   */
  displayOverallResults(analytics) {

    analytics.overall.topPerformingStudents.forEach((student, index) => {
        `  ${index + 1}. ${student.studentId}: ${student.averageScore}%`
      );
    });

    analytics.overall.mostDifficultLectures.forEach((lecture, index) => {
        `  ${index + 1}. ${lecture.lectureId}: ${lecture.averageScore}%`
      );
    });
  }

  /**
   * Display overall stats
   */
  displayOverallStats(resultsData) {
    // const analytics = this.analyticsEngine.analyzeResults(resultsData.results);

  }

  /**
   * Display student performance
   */
  displayStudentPerformance(resultsData) {
    // const analytics = this.analyticsEngine.analyzeResults(resultsData.results);

    const studentStats = {};
    resultsData.results.forEach((result) => {
      if (!studentStats[result.studentId]) {
        studentStats[result.studentId] = { total: 0, count: 0 };
      }
      studentStats[result.studentId].total += result.percentage;
      studentStats[result.studentId].count += 1;
    });

    Object.keys(studentStats).forEach((studentId) => {
      const avg = studentStats[studentId].total / studentStats[studentId].count;
        `  ${studentId}: ${avg.toFixed(1)}% (${
          studentStats[studentId].count
        } submissions)`
      );
    });
  }

  /**
   * Display lecture analysis
   */
  displayLectureAnalysis(resultsData) {
    // const analytics = this.analyticsEngine.analyzeResults(resultsData.results);

    const lectureStats = {};
    resultsData.results.forEach((result) => {
      if (!lectureStats[result.lectureId]) {
        lectureStats[result.lectureId] = { total: 0, count: 0 };
      }
      lectureStats[result.lectureId].total += result.percentage;
      lectureStats[result.lectureId].count += 1;
    });

    Object.keys(lectureStats).forEach((lectureId) => {
      const avg = lectureStats[lectureId].total / lectureStats[lectureId].count;
        `  ${lectureId}: ${avg.toFixed(1)}% (${
          lectureStats[lectureId].count
        } submissions)`
      );
    });
  }

  /**
   * Manage configuration
   */
  async manageConfiguration() {
  }
}

const platform = new AutoGradingPlatform();

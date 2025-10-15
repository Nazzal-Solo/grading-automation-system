import fs from "fs";
import path from "path";

export class GradesOptimizer {
  constructor() {
    this.resultsFile = "results/grades.json";
  }

  optimizeGrades() {
    try {
      const gradesData = JSON.parse(fs.readFileSync(this.resultsFile, "utf8"));
      const optimizedData = this.optimizeGradesData(gradesData);
      fs.writeFileSync(
        this.resultsFile,
        JSON.stringify(optimizedData, null, 2)
      );

      const originalSize = JSON.stringify(gradesData).length;
      const optimizedSize = JSON.stringify(optimizedData).length;
      const reduction = (
        ((originalSize - optimizedSize) / originalSize) *
        100
      ).toFixed(1);

      return {
        success: true,
        originalSize,
        optimizedSize,
        reduction: parseFloat(reduction),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  optimizeGradesData(gradesData) {
    if (!gradesData.results || !Array.isArray(gradesData.results)) {
      return gradesData;
    }

    const optimizedResults = gradesData.results.map((result) => {
      const optimized = {
        studentId: result.studentId,
        lectureId: result.lectureId,
        timestamp: result.timestamp,
        percentage: result.percentage,
        score: result.score,
        totalWeight: result.totalWeight,
        status: result.status,
        gradingMethod: result.gradingMethod,
      };

      if (result.results && Array.isArray(result.results)) {
        optimized.resultsSummary = {
          totalQuestions: result.results.length,
          passedQuestions: result.results.filter((r) => r.passed).length,
          averageConfidence: this.calculateAverageConfidence(result.results),
        };
      }

      if (result.message) {
        optimized.message = result.message;
      }

      return optimized;
    });

    return {
      results: optimizedResults,
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalStudents: this.getUniqueStudents(optimizedResults).length,
        totalLectures: this.getUniqueLectures(optimizedResults).length,
        optimized: true,
      },
    };
  }

  calculateAverageConfidence(results) {
    if (!results || results.length === 0) return 0;
    const totalConfidence = results.reduce(
      (sum, r) => sum + (r.confidence || 0),
      0
    );
    return Math.round(totalConfidence / results.length);
  }

  getUniqueStudents(results) {
    return [...new Set(results.map((r) => r.studentId))];
  }

  getUniqueLectures(results) {
    return [...new Set(results.map((r) => r.lectureId))];
  }

  cleanupDownloads() {
    try {
      const downloadsDir = "downloads";
      if (!fs.existsSync(downloadsDir)) {
        return { success: true, message: "No downloads to clean" };
      }

      const students = fs.readdirSync(downloadsDir);
      let totalSize = 0;
      let filesRemoved = 0;

      for (const student of students) {
        const studentPath = path.join(downloadsDir, student);
        if (fs.statSync(studentPath).isDirectory()) {
          const size = this.getDirectorySize(studentPath);
          totalSize += size;
          fs.rmSync(studentPath, { recursive: true, force: true });
          filesRemoved++;
        }
      }

      return {
        success: true,
        studentsRemoved: filesRemoved,
        spaceFreed: totalSize,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getDirectorySize(dirPath) {
    let size = 0;
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        size += this.getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }

    return size;
  }

  fullCleanup() {
    const gradesResult = this.optimizeGrades();
    const downloadsResult = this.cleanupDownloads();

    return {
      grades: gradesResult,
      downloads: downloadsResult,
      success: gradesResult.success && downloadsResult.success,
    };
  }

  getFileSizes() {
    const sizes = {};

    if (fs.existsSync(this.resultsFile)) {
      sizes.grades = fs.statSync(this.resultsFile).size;
    }

    if (fs.existsSync("downloads")) {
      sizes.downloads = this.getDirectorySize("downloads");
    }

    return sizes;
  }
}

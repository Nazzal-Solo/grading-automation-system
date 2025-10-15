import fs from "fs";
import path from "path";

export class FileFilter {
  constructor() {

    this.skipPatterns = [

      "node_modules",
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      ".npm",
      ".yarn",

      ".git",
      ".gitignore",
      ".gitattributes",

      ".vscode",
      ".idea",
      ".sublime-project",
      ".sublime-workspace",
      "*.swp",
      "*.swo",
      "*~",

      ".DS_Store",
      "Thumbs.db",
      "desktop.ini",

      "dist",
      "build",
      ".next",
      ".nuxt",
      ".cache",
      "coverage",
      ".nyc_output",

      "*.log",
      "*.tmp",
      ".tmp",

      "README.md",
      "CHANGELOG.md",
      "LICENSE",
      "LICENSE.txt",
      "CONTRIBUTING.md",

      ".env",
      ".env.local",
      ".env.development",
      ".env.production",
      "webpack.config.js",
      "babel.config.js",
      "jest.config.js",
      "tsconfig.json",
      "eslint.config.js",
      ".eslintrc",
      ".prettierrc",

      "*.mp4",
      "*.avi",
      "*.mov",
      "*.wmv",
      "*.flv",
      "*.mp3",
      "*.wav",
      "*.flac",
      "*.jpg",
      "*.jpeg",
      "*.png",
      "*.gif",
      "*.bmp",
      "*.svg",
      "*.ico",

      "*.zip",
      "*.rar",
      "*.7z",
      "*.tar",
      "*.gz",
      "*.bz2",

      "*.db",
      "*.sqlite",
      "*.sqlite3",

      "*.bak",
      "*.backup",
      "*.old",
      "*.orig",
    ];

    this.priorityExtensions = [
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".html",
      ".css",
      ".scss",
      ".sass",
      ".less",
      ".py",
      ".java",
      ".cpp",
      ".c",
      ".cs",
      ".php",
      ".rb",
      ".go",
      ".rs",
      ".swift",
      ".kt",
      ".scala",
      ".clj",
      ".hs",
      ".ml",
      ".fs",
      ".vb",
      ".r",
      ".m",
      ".pl",
      ".sh",
      ".bash",
      ".zsh",
      ".fish",
      ".ps1",
      ".bat",
      ".cmd",
    ];
  }

  /**
   * Check if a file or directory should be skipped
   * @param {string} filePath - Path to check
   * @param {string} relativePath - Relative path from root
   * @returns {boolean} - True if should be skipped
   */
  shouldSkip(filePath, relativePath = "") {
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();

    for (const pattern of this.skipPatterns) {
      if (pattern.includes("*")) {

        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        if (regex.test(fileName) || regex.test(relativePath)) {
          return true;
        }
      } else {

        if (fileName === pattern || relativePath.includes(pattern)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if a file is a priority file (student code)
   * @param {string} filePath - Path to check
   * @returns {boolean} - True if is priority file
   */
  isPriorityFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.priorityExtensions.includes(ext);
  }

  /**
   * Get filtered files from a directory
   * @param {string} dirPath - Directory to scan
   * @param {string} basePath - Base path for relative paths
   * @returns {Array} - Array of file paths to process
   */
  getFilteredFiles(dirPath, basePath = "") {
    const files = [];

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativePath = path.relative(basePath, fullPath);

        if (this.shouldSkip(fullPath, relativePath)) {

          continue;
        }

        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {

          const subFiles = this.getFilteredFiles(fullPath, basePath);
          files.push(...subFiles);
        } else {

          files.push(fullPath);
        }
      }
    } catch (error) {
    }

    return files;
  }

  /**
   * Get statistics about filtered files
   * @param {string} dirPath - Directory to analyze
   * @returns {Object} - Statistics object
   */
  getFilteringStats(dirPath) {
    const stats = {
      totalFiles: 0,
      skippedFiles: 0,
      priorityFiles: 0,
      processedFiles: 0,
      skippedPatterns: {},
      fileTypes: {},
    };

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativePath = path.relative(dirPath, fullPath);

        if (this.shouldSkip(fullPath, relativePath)) {
          stats.skippedFiles++;

          for (const pattern of this.skipPatterns) {
            if (pattern.includes("*")) {
              const regex = new RegExp(pattern.replace(/\*/g, ".*"));
              if (regex.test(item) || regex.test(relativePath)) {
                stats.skippedPatterns[pattern] =
                  (stats.skippedPatterns[pattern] || 0) + 1;
                break;
              }
            } else if (item === pattern || relativePath.includes(pattern)) {
              stats.skippedPatterns[pattern] =
                (stats.skippedPatterns[pattern] || 0) + 1;
              break;
            }
          }
        } else {
          const stat = fs.statSync(fullPath);
          stats.totalFiles++;

          if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;

            if (this.isPriorityFile(fullPath)) {
              stats.priorityFiles++;
            }
            stats.processedFiles++;
          } else if (stat.isDirectory()) {

            const subStats = this.getFilteringStats(fullPath);
            stats.totalFiles += subStats.totalFiles;
            stats.skippedFiles += subStats.skippedFiles;
            stats.priorityFiles += subStats.priorityFiles;
            stats.processedFiles += subStats.processedFiles;

            Object.keys(subStats.skippedPatterns).forEach((pattern) => {
              stats.skippedPatterns[pattern] =
                (stats.skippedPatterns[pattern] || 0) +
                subStats.skippedPatterns[pattern];
            });

            Object.keys(subStats.fileTypes).forEach((ext) => {
              stats.fileTypes[ext] =
                (stats.fileTypes[ext] || 0) + subStats.fileTypes[ext];
            });
          }
        }
      }
    } catch (error) {
    }

    return stats;
  }

  /**
   * Clean up unnecessary files from a directory
   * @param {string} dirPath - Directory to clean
   * @param {boolean} dryRun - If true, only show what would be deleted
   * @returns {Object} - Cleanup statistics
   */
  cleanupFiles(dirPath, dryRun = false) {
    const cleanupStats = {
      totalFiles: 0,
      deletedFiles: 0,
      deletedDirs: 0,
      freedSpace: 0,
      errors: [],
    };

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativePath = path.relative(dirPath, fullPath);

        if (this.shouldSkip(fullPath, relativePath)) {
          const stat = fs.statSync(fullPath);
          cleanupStats.totalFiles++;

          if (stat.isDirectory()) {

            const subStats = this.cleanupFiles(fullPath, dryRun);
            cleanupStats.deletedFiles += subStats.deletedFiles;
            cleanupStats.deletedDirs += subStats.deletedDirs;
            cleanupStats.freedSpace += subStats.freedSpace;
            cleanupStats.errors.push(...subStats.errors);

            if (!dryRun) {
              try {
                fs.rmdirSync(fullPath);
                cleanupStats.deletedDirs++;

              } catch (error) {
                cleanupStats.errors.push(
                  `Failed to delete directory ${relativePath}: ${error.message}`
                );
              }
            } else {

              cleanupStats.deletedDirs++;
            }
          } else {

            if (!dryRun) {
              try {
                const fileSize = stat.size;
                fs.unlinkSync(fullPath);
                cleanupStats.deletedFiles++;
                cleanupStats.freedSpace += fileSize;

              } catch (error) {
                cleanupStats.errors.push(
                  `Failed to delete file ${relativePath}: ${error.message}`
                );
              }
            } else {

              cleanupStats.deletedFiles++;
              cleanupStats.freedSpace += stat.size;
            }
          }
        } else {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {

            const subStats = this.cleanupFiles(fullPath, dryRun);
            cleanupStats.deletedFiles += subStats.deletedFiles;
            cleanupStats.deletedDirs += subStats.deletedDirs;
            cleanupStats.freedSpace += subStats.freedSpace;
            cleanupStats.errors.push(...subStats.errors);
          }
        }
      }
    } catch (error) {
      cleanupStats.errors.push(
        `Error cleaning directory ${dirPath}: ${error.message}`
      );
    }

    return cleanupStats;
  }

  /**
   * Format file size in human readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} - Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Print cleanup statistics
   * @param {string} dirPath - Directory to analyze
   * @param {boolean} dryRun - If true, only show what would be deleted
   */
  printCleanupStats(dirPath, dryRun = false) {
    const stats = this.cleanupFiles(dirPath, dryRun);








    if (stats.errors.length > 0) {

      stats.errors.forEach((error) => {

      });
    }

    const cleanupPercentage =
      stats.totalFiles > 0
        ? ((stats.deletedFiles / stats.totalFiles) * 100).toFixed(1)
        : 0;


  }

  /**
   * Print filtering statistics
   * @param {string} dirPath - Directory to analyze
   */
  printStatistics(dirPath) {
    const stats = this.getFilteringStats(dirPath);








    if (Object.keys(stats.skippedPatterns).length > 0) {

      Object.entries(stats.skippedPatterns)
        .sort(([, a], [, b]) => b - a)
        .forEach(([pattern, count]) => {

        });
    }

    if (Object.keys(stats.fileTypes).length > 0) {

      Object.entries(stats.fileTypes)
        .sort(([, a], [, b]) => b - a)
        .forEach(([ext, count]) => {

        });
    }

    const skipPercentage =
      stats.totalFiles > 0
        ? ((stats.skippedFiles / stats.totalFiles) * 100).toFixed(1)
        : 0;


  }
}

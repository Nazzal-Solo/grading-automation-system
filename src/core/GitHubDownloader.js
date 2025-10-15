import fs from "fs";
import path from "path";

export class GitHubDownloader {
  constructor(config) {
    this.config = config;
  }

  /**
   * Download all student repositories
   */
  async downloadAllRepositories() {
    for (const student of this.config.students) {
      for (const lecture of student.lectures) {
        if (lecture.status === "active") {
          await this.downloadRepository(
            student.github.username,
            student.github.token,
            lecture.repoName,
            student.id,
            lecture.lectureId
          );
        }
      }
    }
  }

  /**
   * Download a single repository
   */
  async downloadRepository(username, token, repoName, studentId, lectureId) {
    try {
      const baseFolder = path.join("downloads", studentId, lectureId);
      await this.traverseRepository(username, token, repoName, baseFolder);
    } catch (error) {
      throw error;
    }
  }

  /**
   * List files in a repository path
   */
  async listFiles(username, token, repoName, repoPath = "") {
    const url = `https://api.github.com/repos/${username}/${repoName}/contents/${repoPath}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Repository not found: ${username}/${repoName}`);
      }
      throw new Error(
        `GitHub API error ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Recursively traverse repository and download files
   */
  async traverseRepository(
    username,
    token,
    repoName,
    baseFolder,
    repoPath = ""
  ) {
    const items = await this.listFiles(username, token, repoName, repoPath);

    const skipDirectories = [
      "node_modules",
      ".git",
      ".vscode",
      ".idea",
      "dist",
      "build",
      "coverage",
      ".nyc_output",
      "logs",
      "tmp",
      "temp",
    ];

    for (const item of items) {
      if (item.type === "file") {
        const fileResponse = await fetch(item.download_url, {
          headers: { Authorization: `token ${token}` },
        });

        const content = await fileResponse.text();

        const savePath = path.join(baseFolder, item.path);
        fs.mkdirSync(path.dirname(savePath), { recursive: true });
        fs.writeFileSync(savePath, content, "utf-8");
      } else if (item.type === "dir") {
        if (!skipDirectories.includes(item.name.toLowerCase())) {
          await this.traverseRepository(
            username,
            token,
            repoName,
            baseFolder,
            item.path
          );
        }
      }
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(username, token, repoName) {
    const url = `https://api.github.com/repos/${username}/${repoName}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API error ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Check if repository exists and is accessible
   */
  async validateRepository(username, token, repoName) {
    try {
      const repoInfo = await this.getRepositoryInfo(username, token, repoName);
      return {
        exists: true,
        name: repoInfo.name,
        fullName: repoInfo.full_name,
        private: repoInfo.private,
        updatedAt: repoInfo.updated_at,
        size: repoInfo.size,
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
      };
    }
  }
}

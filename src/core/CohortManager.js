import fs from "fs";
import path from "path";

export class CohortManager {
  constructor() {
    this.cohortsPath = "config/cohorts.json";
    this.studentsPath = "config/students.json";
    this.loadCohorts();
    this.loadStudents();
  }

  loadCohorts() {
    try {
      if (!fs.existsSync(this.cohortsPath)) {
        this.cohorts = { cohorts: [], activeCohort: 1 };
        return;
      }
      this.cohorts = JSON.parse(fs.readFileSync(this.cohortsPath, "utf8"));
    } catch (error) {
      this.cohorts = { cohorts: [], activeCohort: 1 };
    }
  }

  loadStudents() {
    try {
      if (!fs.existsSync(this.studentsPath)) {
        this.students = { students: [] };
        return;
      }
      this.students = JSON.parse(fs.readFileSync(this.studentsPath, "utf8"));
    } catch (error) {
      this.students = { students: [] };
    }
  }

  saveCohorts() {
    try {
      this.cohorts.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.cohortsPath, JSON.stringify(this.cohorts, null, 2));
    } catch (error) {
    }
  }

  saveStudents() {
    try {
      this.students.lastUpdated = new Date().toISOString();
      fs.writeFileSync(
        this.studentsPath,
        JSON.stringify(this.students, null, 2)
      );
    } catch (error) {
    }
  }

  getAllCohorts() {
    return this.cohorts.cohorts || [];
  }

  getActiveCohort() {
    return this.cohorts.cohorts.find((c) => c.status === "active") || null;
  }

  getCohortByNumber(number) {
    return this.cohorts.cohorts.find((c) => c.number === number) || null;
  }

  getStudentsByCohort(cohortNumber) {
    return (
      this.students.students.filter((s) => s.cohortNumber === cohortNumber) ||
      []
    );
  }

  getStudentsByCohortId(cohortId) {
    return this.students.students.filter((s) => s.cohort === cohortId) || [];
  }

  addCohort(cohortData) {
    const existingCohort = this.getCohortByNumber(cohortData.number);
    if (existingCohort) {
      throw new Error(`Cohort ${cohortData.number} already exists`);
    }

    const newCohort = {
      id: `C${cohortData.number}`,
      number: cohortData.number,
      name: `Cohort ${cohortData.number}`,
      startDate: cohortData.startDate,
      endDate: cohortData.endDate,
      status: cohortData.status || "active",
      duration: this.cohorts.cohortDuration || "5 months",
    };

    if (newCohort.status === "active") {
      this.cohorts.cohorts.forEach((c) => {
        if (c.status === "active") {
          c.status = "completed";
        }
      });
      this.cohorts.activeCohort = newCohort.number;
    }

    this.cohorts.cohorts.push(newCohort);
    this.saveCohorts();
    return newCohort;
  }

  addStudentToCohort(studentData, cohortNumber) {
    const cohort = this.getCohortByNumber(cohortNumber);
    if (!cohort) {
      throw new Error(`Cohort ${cohortNumber} not found`);
    }

    const newStudent = {
      id: studentData.id,
      name: studentData.name,
      cohort: cohort.id,
      cohortNumber: cohortNumber,
      enrollmentDate: new Date().toISOString().split("T")[0],
      status: "active",
      github: studentData.github,
      lectures: studentData.lectures || [],
    };

    this.students.students.push(newStudent);
    this.saveStudents();
    return newStudent;
  }

  updateStudentCohort(studentId, newCohortNumber) {
    const student = this.students.students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    const cohort = this.getCohortByNumber(newCohortNumber);
    if (!cohort) {
      throw new Error(`Cohort ${newCohortNumber} not found`);
    }

    student.cohort = cohort.id;
    student.cohortNumber = newCohortNumber;
    student.enrollmentDate = new Date().toISOString().split("T")[0];

    this.saveStudents();
    return student;
  }

  getCohortStats(cohortNumber) {
    const students = this.getStudentsByCohort(cohortNumber);
    const cohort = this.getCohortByNumber(cohortNumber);

    return {
      cohort: cohort,
      totalStudents: students.length,
      activeStudents: students.filter((s) => s.status === "active").length,
      completedStudents: students.filter((s) => s.status === "completed")
        .length,
      averageProgress: this.calculateAverageProgress(students),
    };
  }

  calculateAverageProgress(students) {
    if (students.length === 0) return 0;

    return 0;
  }

  getNextCohortNumber() {
    const maxNumber = Math.max(...this.cohorts.cohorts.map((c) => c.number));
    return maxNumber + 1;
  }

  createNextCohort() {
    const nextNumber = this.getNextCohortNumber();
    const lastCohort = this.cohorts.cohorts[this.cohorts.cohorts.length - 1];

    const startDate = new Date(lastCohort.endDate);
    startDate.setDate(startDate.getDate() + 1);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 2);
    endDate.setDate(endDate.getDate() + 15); // 2.5 months

    return this.addCohort({
      number: nextNumber,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      status: "active",
    });
  }

  filterStudents(filters = {}) {
    let filteredStudents = [...this.students.students];

    if (filters.cohortNumber) {
      filteredStudents = filteredStudents.filter(
        (s) => s.cohortNumber === filters.cohortNumber
      );
    }

    if (filters.cohortId) {
      filteredStudents = filteredStudents.filter(
        (s) => s.cohort === filters.cohortId
      );
    }

    if (filters.status) {
      filteredStudents = filteredStudents.filter(
        (s) => s.status === filters.status
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredStudents = filteredStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm) ||
          s.id.toLowerCase().includes(searchTerm)
      );
    }

    return filteredStudents;
  }

  getCohortTimeline() {
    return this.cohorts.cohorts.map((cohort) => ({
      ...cohort,
      studentCount: this.getStudentsByCohort(cohort.number).length,
    }));
  }

  updateCohort(cohortNumber, cohortData) {
    try {
      this.loadCohorts();
      const cohortIndex = this.cohorts.cohorts.findIndex(
        (c) => c.number === cohortNumber
      );

      if (cohortIndex === -1) {
        throw new Error(`Cohort ${cohortNumber} not found`);
      }

      this.cohorts.cohorts[cohortIndex] = {
        ...this.cohorts.cohorts[cohortIndex],
        ...cohortData,
        lastUpdated: new Date().toISOString(),
      };

      this.saveCohorts();
      return this.cohorts.cohorts[cohortIndex];
    } catch (error) {
      throw error;
    }
  }

  deleteCohort(cohortNumber) {
    try {
      this.loadCohorts();
      const cohortIndex = this.cohorts.cohorts.findIndex(
        (c) => c.number === cohortNumber
      );

      if (cohortIndex === -1) {
        throw new Error(`Cohort ${cohortNumber} not found`);
      }

      const deletedCohort = this.cohorts.cohorts.splice(cohortIndex, 1)[0];

      if (this.cohorts.activeCohort === cohortNumber) {
        const remainingCohorts = this.cohorts.cohorts.filter(
          (c) => c.status === "active"
        );
        this.cohorts.activeCohort =
          remainingCohorts.length > 0
            ? remainingCohorts[remainingCohorts.length - 1].number
            : 1;
      }

      this.saveCohorts();
      return deletedCohort;
    } catch (error) {
      throw error;
    }
  }

  removeStudentFromAllCohorts(studentId) {
    try {
      const student = this.students.students.find((s) => s.id === studentId);
      if (!student) {
        return null;
      }

      this.students.students = this.students.students.filter(
        (s) => s.id !== studentId
      );

      this.saveStudents();

      return student;
    } catch (error) {
      return null;
    }
  }
}

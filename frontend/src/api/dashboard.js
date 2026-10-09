/**
 * Dashboard API Service
 * 
 * Provides standard service interfaces for role-specific dashboard metrics.
 * In Phase 4, mock/initial counts are served synchronously with clean structure
 * ready for seamless backend endpoint connection in Phase 5+.
 */

export const getAdminStats = async () => {
  return {
    totalUsers: 0,
    candidates: 0,
    interviewEngineers: 0,
    instructors: 0,
    activeInterviews: 0,
    completedInterviews: 0
  };
};

export const getEngineerStats = async () => {
  return {
    newCandidates: 0,
    pendingVerification: 0,
    sentToInstructors: 0,
    awaitingInstructorResponse: 0,
    interviewsCompleted: 0,
    reportsReady: 0
  };
};

export const getInstructorStats = async () => {
  return {
    assignedCandidates: 0,
    pendingReviews: 0,
    upcomingInterviews: 0,
    inProgress: 0,
    completed: 0,
    reportsReady: 0
  };
};

export const getCandidateStats = async () => {
  return {
    upcomingInterviews: 0,
    completedInterviews: 0,
    pendingAssessments: 0
  };
};

export default {
  getAdminStats,
  getEngineerStats,
  getInstructorStats,
  getCandidateStats
};

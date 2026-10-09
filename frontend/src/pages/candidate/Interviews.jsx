import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCandidateInterviewsApi } from '../../api/candidateInterview';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';

export const CandidateInterviews = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCandidateInterviewsApi();
      setInterviews(data || []);
    } catch (err) {
      console.error('Failed to load candidate interviews:', err);
      setError('Unable to load mock interviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader
        title="My AI Mock Interviews"
        subtitle="Practice with real-time AI Agent evaluation, adaptive questions, and live voice interviews."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Loading your AI mock interviews...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/40 border border-red-800/60 rounded-2xl text-center">
          <p className="text-red-300 mb-4">{error}</p>
          <Button variant="secondary" onClick={loadInterviews}>
            Retry
          </Button>
        </div>
      ) : interviews.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-lg font-semibold text-slate-200 mb-1">No Active Interviews Assigned</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Your instructor will publish and assign an AI mock interview blueprint to your profile shortly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {interviews.map((interview) => {
            const hasCompleted = interview.sessionStatus === 'COMPLETED';
            const hasInProgress = interview.sessionStatus === 'IN_PROGRESS';

            return (
              <div
                key={interview.id}
                className="group relative flex flex-col justify-between p-6 bg-slate-900/80 hover:bg-slate-900/95 border border-slate-800 hover:border-indigo-500/50 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-1"
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      {interview.status || 'PUBLISHED'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {interview.difficulty || 'MEDIUM'} DIFFICULTY
                    </span>
                  </div>

                  {/* Title & Role */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 text-2xl">
                      🤖
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {interview.title}
                      </h3>
                      <p className="text-sm font-medium text-slate-400">
                        {interview.jobRole}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {interview.description && (
                    <p className="text-sm text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                      {interview.description}
                    </p>
                  )}

                  {/* Meta Grid */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl mb-4 text-center">
                    <div>
                      <div className="text-xs text-slate-400">Duration</div>
                      <div className="text-sm font-bold text-slate-200">
                        {interview.durationMinutes} mins
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Rounds</div>
                      <div className="text-sm font-bold text-slate-200">
                        {interview.roundCount || 8}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Adaptive AI</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {interview.adaptiveQuestioningEnabled ? 'Enabled' : 'Standard'}
                      </div>
                    </div>
                  </div>

                  {/* Rounds pill preview */}
                  {interview.roundNames && interview.roundNames.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {interview.roundNames.slice(0, 4).map((name, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-[11px] bg-slate-800 text-slate-300 rounded-md border border-slate-700/60"
                        >
                          {name}
                        </span>
                      ))}
                      {interview.roundNames.length > 4 && (
                        <span className="px-2 py-0.5 text-[11px] bg-slate-800 text-slate-400 rounded-md">
                          +{interview.roundNames.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    Instructor: <span className="text-slate-300 font-medium">{interview.instructorName}</span>
                  </div>

                  {hasCompleted ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/candidate/interviews/${interview.activeSessionId}/result`)}
                      className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-950/30"
                    >
                      🎯 View Results
                    </Button>
                  ) : hasInProgress ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/candidate/interviews/${interview.id}/session`)}
                      className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
                    >
                      ▶ Resume Interview
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/candidate/interviews/${interview.id}/precheck`)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30"
                    >
                      🚀 Start Interview
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidateInterviews;

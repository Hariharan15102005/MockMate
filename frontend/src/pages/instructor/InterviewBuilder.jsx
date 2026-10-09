import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import {
  getAcceptedCandidatesForInterviewApi,
  getInterviewByIdApi,
  createInterviewApi,
  updateInterviewApi,
  publishInterviewApi
} from '../../api/instructor';
import {
  Sliders,
  Code2,
  MessageSquare,
  BrainCircuit,
  Shield,
  Layers,
  Clock,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  FileCode,
  Terminal,
  Database,
  Lock,
  Check,
  X
} from 'lucide-react';

const ROUND_TYPES = [
  { value: 'INTRODUCTION', label: 'Introduction & Background' },
  { value: 'RESUME', label: 'Resume & Project Deep Dive' },
  { value: 'TECHNICAL', label: 'Core Technical Theory' },
  { value: 'CODING', label: 'Live Coding & Data Structures' },
  { value: 'SQL', label: 'SQL & Database Architecture' },
  { value: 'SYSTEM_DESIGN', label: 'System Design & Scalability' },
  { value: 'LEARNING', label: 'Learning & Problem Adaptation' },
  { value: 'BEHAVIORAL', label: 'Behavioral & STAR Culture' },
  { value: 'CLOSING', label: 'Candidate Q&A & Wrap Up' }
];

const QUESTION_TYPES = [
  { value: 'TEXT', label: 'Text / Conceptual' },
  { value: 'CODING', label: 'Coding / Monaco Sandbox' },
  { value: 'SQL', label: 'SQL Query Challenge' },
  { value: 'SYSTEM_DESIGN', label: 'System Architecture Scenario' },
  { value: 'BEHAVIORAL', label: 'Behavioral / Situational' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' }
];

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
const EXPERIENCE_LEVELS = ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL'];
const CODING_LANGUAGES = ['Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'C++', 'SQL'];

export const InterviewBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const interviewIdParam = searchParams.get('interviewId');
  const assignmentIdParam = searchParams.get('assignmentId');
  const candidateIdParam = searchParams.get('candidateId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Accepted Candidates list for dropdown
  const [acceptedCandidates, setAcceptedCandidates] = useState([]);

  // Interview state
  const [interviewId, setInterviewId] = useState(interviewIdParam || null);
  const [status, setStatus] = useState('DRAFT');
  const [publishedAt, setPublishedAt] = useState(null);

  // Form fields
  const [candidateAssignmentId, setCandidateAssignmentId] = useState(assignmentIdParam || '');
  const [selectedCandidateInfo, setSelectedCandidateInfo] = useState(null);
  const [title, setTitle] = useState('Full Stack Software Engineer Assessment');
  const [targetRole, setTargetRole] = useState('Senior Backend Engineer');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [experienceLevel, setExperienceLevel] = useState('SENIOR');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [instructions, setInstructions] = useState(
    'Please review system constraints, articulate design trade-offs, and implement clean production-grade code.'
  );

  // Rounds state
  const [rounds, setRounds] = useState([
    {
      roundName: 'Technical & System Architecture',
      roundType: 'TECHNICAL',
      sequenceNumber: 1,
      durationMinutes: 20,
      questionCount: 2,
      difficulty: 'MEDIUM',
      questionType: 'TEXT',
      instructions: 'Assess concurrency, data pipelines, caching, and scalable architecture fundamentals.',
      questions: [
        {
          questionText: 'Explain the internal architecture and collision resolution mechanism of ConcurrentHashMap in Java.',
          questionType: 'TEXT',
          difficulty: 'MEDIUM',
          expectedAnswerGuidance: 'Discuss synchronized buckets / CAS operations, tree bins, and segmented locking.',
          sequenceNumber: 1
        }
      ]
    },
    {
      roundName: 'Algorithmic Problem Solving',
      roundType: 'CODING',
      sequenceNumber: 2,
      durationMinutes: 25,
      questionCount: 1,
      difficulty: 'MEDIUM',
      questionType: 'CODING',
      instructions: 'Evaluate time/space complexity, modularity, and clean coding practices.',
      questions: [
        {
          questionText: 'Given an array of integers and a target sum, find the continuous subarray with the maximum sum (Kadane’s algorithm).',
          questionType: 'CODING',
          difficulty: 'MEDIUM',
          codingLanguage: 'Java',
          sampleInput: '[-2,1,-3,4,-1,2,1,-5,4]',
          sampleOutput: '6',
          expectedAnswerGuidance: 'Optimal O(N) dynamic programming or running sum solution.',
          sequenceNumber: 1
        }
      ]
    },
    {
      roundName: 'Behavioral & Engineering Leadership',
      roundType: 'BEHAVIORAL',
      sequenceNumber: 3,
      durationMinutes: 15,
      questionCount: 1,
      difficulty: 'MEDIUM',
      questionType: 'BEHAVIORAL',
      instructions: 'Evaluate conflict resolution, technical mentoring, and stakeholder management.',
      questions: [
        {
          questionText: 'Describe a situation where you had to push back against an unrealistic technical deadline. How did you negotiate?',
          questionType: 'BEHAVIORAL',
          difficulty: 'MEDIUM',
          expectedAnswerGuidance: 'STAR method with clear situation, action taken with data, and positive resolution.',
          sequenceNumber: 1
        }
      ]
    }
  ]);

  // Scoring configuration state
  const [scoringConfig, setScoringConfig] = useState({
    technicalWeight: 30,
    codingWeight: 30,
    sqlWeight: 10,
    systemDesignWeight: 10,
    problemSolvingWeight: 10,
    communicationWeight: 5,
    learningWeight: 5,
    behavioralWeight: 0,
    passingScorePercentage: 70
  });

  // Modals & confirmation
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [expandedRoundIdx, setExpandedRoundIdx] = useState(0);

  const isPublished = status === 'PUBLISHED';

  // Calculate total scoring weight
  const totalScoringWeight = useMemo(() => {
    return (
      (parseInt(scoringConfig.technicalWeight, 10) || 0) +
      (parseInt(scoringConfig.codingWeight, 10) || 0) +
      (parseInt(scoringConfig.sqlWeight, 10) || 0) +
      (parseInt(scoringConfig.systemDesignWeight, 10) || 0) +
      (parseInt(scoringConfig.problemSolvingWeight, 10) || 0) +
      (parseInt(scoringConfig.communicationWeight, 10) || 0) +
      (parseInt(scoringConfig.learningWeight, 10) || 0) +
      (parseInt(scoringConfig.behavioralWeight, 10) || 0)
    );
  }, [scoringConfig]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch accepted candidates
      const acceptedList = await getAcceptedCandidatesForInterviewApi();
      setAcceptedCandidates(acceptedList || []);

      // 2. If editing existing interview
      if (interviewIdParam) {
        const interviewData = await getInterviewByIdApi(interviewIdParam);
        setInterviewId(interviewData.id);
        setStatus(interviewData.status || 'DRAFT');
        setPublishedAt(interviewData.publishedAt);
        setTitle(interviewData.title || '');
        setTargetRole(interviewData.targetRole || '');
        setDurationMinutes(interviewData.durationMinutes || 60);
        setExperienceLevel(interviewData.experienceLevel || 'SENIOR');
        setDifficulty(interviewData.difficulty || 'MEDIUM');
        setIsAdaptive(!!interviewData.isAdaptive);
        setInstructions(interviewData.instructions || '');
        setCandidateAssignmentId(interviewData.candidateAssignmentId || '');

        if (interviewData.candidate) {
          setSelectedCandidateInfo(interviewData.candidate);
        }

        if (interviewData.rounds && interviewData.rounds.length > 0) {
          setRounds(interviewData.rounds);
        }

        if (interviewData.scoringConfig) {
          setScoringConfig(interviewData.scoringConfig);
        }
      } else if (assignmentIdParam) {
        // Pre-select candidate assignment
        const match = (acceptedList || []).find((a) => a.assignmentId === assignmentIdParam);
        if (match) {
          setCandidateAssignmentId(match.assignmentId);
          setSelectedCandidateInfo({
            id: match.candidateId,
            fullName: match.candidateName,
            email: match.candidateEmail,
            targetRole: match.targetRole,
            experienceLevel: match.experienceLevel
          });
          if (match.targetRole) {
            setTargetRole(match.targetRole);
            setTitle(`${match.targetRole} Assessment Blueprint`);
          }
        }
      } else if (acceptedList && acceptedList.length > 0) {
        // Default to first accepted candidate if none chosen
        const first = acceptedList[0];
        setCandidateAssignmentId(first.assignmentId);
        setSelectedCandidateInfo({
          id: first.candidateId,
          fullName: first.candidateName,
          email: first.candidateEmail,
          targetRole: first.targetRole,
          experienceLevel: first.experienceLevel
        });
        if (first.targetRole) {
          setTargetRole(first.targetRole);
          setTitle(`${first.targetRole} Assessment Blueprint`);
        }
      }
    } catch (err) {
      console.error('Failed to load interview builder data:', err);
      setError('Failed to load blueprint details. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, [interviewIdParam, assignmentIdParam]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle Candidate Assignment change
  const handleAssignmentChange = (e) => {
    const selectedId = e.target.value;
    setCandidateAssignmentId(selectedId);
    const match = acceptedCandidates.find((a) => a.assignmentId === selectedId);
    if (match) {
      setSelectedCandidateInfo({
        id: match.candidateId,
        fullName: match.candidateName,
        email: match.candidateEmail,
        targetRole: match.targetRole,
        experienceLevel: match.experienceLevel
      });
      if (!interviewId) {
        setTargetRole(match.targetRole || '');
        setTitle(`${match.targetRole || 'Software Engineer'} Assessment Blueprint`);
      }
    } else {
      setSelectedCandidateInfo(null);
    }
  };

  // Round Management
  const handleAddRound = () => {
    if (isPublished) return;
    const newSeq = rounds.length + 1;
    const newRound = {
      roundName: `Round ${newSeq}: Technical Evaluation`,
      roundType: 'TECHNICAL',
      sequenceNumber: newSeq,
      durationMinutes: 20,
      questionCount: 1,
      difficulty: 'MEDIUM',
      questionType: 'TEXT',
      instructions: 'Assess core engineering principles and problem-solving skills.',
      questions: []
    };
    setRounds([...rounds, newRound]);
    setExpandedRoundIdx(rounds.length);
  };

  const handleRemoveRound = (idx) => {
    if (isPublished) return;
    if (rounds.length <= 1) {
      alert('An interview blueprint must have at least one round.');
      return;
    }
    const updated = rounds.filter((_, i) => i !== idx).map((r, i) => ({
      ...r,
      sequenceNumber: i + 1
    }));
    setRounds(updated);
    if (expandedRoundIdx >= updated.length) {
      setExpandedRoundIdx(Math.max(0, updated.length - 1));
    }
  };

  const handleMoveRound = (idx, direction) => {
    if (isPublished) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= rounds.length) return;
    const updated = [...rounds];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    // Recalculate sequence numbers
    const resequenced = updated.map((r, i) => ({
      ...r,
      sequenceNumber: i + 1
    }));
    setRounds(resequenced);
    setExpandedRoundIdx(targetIdx);
  };

  const handleRoundChange = (idx, field, value) => {
    if (isPublished) return;
    const updated = [...rounds];
    updated[idx] = { ...updated[idx], [field]: value };
    setRounds(updated);
  };

  // Question Management per round
  const handleAddQuestion = (roundIdx) => {
    if (isPublished) return;
    const round = rounds[roundIdx];
    const newQuestionSeq = (round.questions?.length || 0) + 1;
    const newQuestion = {
      questionText: '',
      questionType: round.questionType || 'TEXT',
      difficulty: round.difficulty || 'MEDIUM',
      codingLanguage: round.questionType === 'CODING' ? 'Java' : null,
      expectedAnswerGuidance: '',
      sampleInput: '',
      sampleOutput: '',
      sequenceNumber: newQuestionSeq
    };
    const updatedRounds = [...rounds];
    updatedRounds[roundIdx] = {
      ...round,
      questions: [...(round.questions || []), newQuestion]
    };
    setRounds(updatedRounds);
  };

  const handleRemoveQuestion = (roundIdx, questionIdx) => {
    if (isPublished) return;
    const round = rounds[roundIdx];
    const updatedQuestions = (round.questions || [])
      .filter((_, i) => i !== questionIdx)
      .map((q, i) => ({ ...q, sequenceNumber: i + 1 }));
    const updatedRounds = [...rounds];
    updatedRounds[roundIdx] = {
      ...round,
      questions: updatedQuestions
    };
    setRounds(updatedRounds);
  };

  const handleQuestionChange = (roundIdx, questionIdx, field, value) => {
    if (isPublished) return;
    const round = rounds[roundIdx];
    const updatedQuestions = [...(round.questions || [])];
    updatedQuestions[questionIdx] = {
      ...updatedQuestions[questionIdx],
      [field]: value
    };
    const updatedRounds = [...rounds];
    updatedRounds[roundIdx] = {
      ...round,
      questions: updatedQuestions
    };
    setRounds(updatedRounds);
  };

  // Validate form before save or publish
  const validateForm = () => {
    if (!candidateAssignmentId) {
      return 'Please select an accepted candidate assignment.';
    }
    if (!title.trim()) {
      return 'Interview blueprint title is required.';
    }
    if (!targetRole.trim()) {
      return 'Target role is required.';
    }
    if (durationMinutes <= 0) {
      return 'Total duration must be greater than 0 minutes.';
    }
    if (!rounds || rounds.length === 0) {
      return 'Interview blueprint must have at least one round.';
    }
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      if (!r.roundName?.trim()) {
        return `Round #${i + 1} must have a valid title.`;
      }
      if (!r.durationMinutes || r.durationMinutes <= 0) {
        return `Round "${r.roundName}" must have a duration greater than 0.`;
      }
    }
    return null;
  };

  // Build Payload
  const buildPayload = () => {
    return {
      candidateAssignmentId,
      title: title.trim(),
      targetRole: targetRole.trim(),
      instructions: instructions?.trim(),
      durationMinutes: parseInt(durationMinutes, 10) || 60,
      experienceLevel,
      difficulty,
      isAdaptive,
      rounds: rounds.map((r, i) => ({
        roundName: r.roundName.trim(),
        roundType: r.roundType,
        sequenceNumber: i + 1,
        durationMinutes: parseInt(r.durationMinutes, 10) || 20,
        questionCount: parseInt(r.questionCount, 10) || 1,
        difficulty: r.difficulty || 'MEDIUM',
        questionType: r.questionType || 'TEXT',
        instructions: r.instructions?.trim() || '',
        questions: (r.questions || []).map((q, qIdx) => ({
          questionText: q.questionText?.trim() || 'Conceptual Question',
          questionType: q.questionType || r.questionType || 'TEXT',
          difficulty: q.difficulty || r.difficulty || 'MEDIUM',
          codingLanguage: q.codingLanguage || null,
          sampleInput: q.sampleInput || null,
          sampleOutput: q.sampleOutput || null,
          expectedAnswerGuidance: q.expectedAnswerGuidance || null,
          sequenceNumber: qIdx + 1
        }))
      })),
      scoringConfig: {
        technicalWeight: parseInt(scoringConfig.technicalWeight, 10) || 0,
        codingWeight: parseInt(scoringConfig.codingWeight, 10) || 0,
        sqlWeight: parseInt(scoringConfig.sqlWeight, 10) || 0,
        systemDesignWeight: parseInt(scoringConfig.systemDesignWeight, 10) || 0,
        problemSolvingWeight: parseInt(scoringConfig.problemSolvingWeight, 10) || 0,
        communicationWeight: parseInt(scoringConfig.communicationWeight, 10) || 0,
        learningWeight: parseInt(scoringConfig.learningWeight, 10) || 0,
        behavioralWeight: parseInt(scoringConfig.behavioralWeight, 10) || 0,
        passingScorePercentage: parseInt(scoringConfig.passingScorePercentage, 10) || 70
      }
    };
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (isPublished) return;
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = buildPayload();
      let response;
      if (interviewId) {
        response = await updateInterviewApi(interviewId, payload);
      } else {
        response = await createInterviewApi(payload);
        setInterviewId(response.id);
      }
      setSuccessMessage('Interview blueprint draft saved successfully.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to save draft:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save blueprint draft.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  // Publish Interview
  const handlePublish = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setShowPublishDialog(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (totalScoringWeight !== 100) {
      setError(`Scoring configuration total weight must equal exactly 100% (currently ${totalScoringWeight}%). Please adjust weights before publishing.`);
      setShowPublishDialog(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setPublishing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // If unsaved draft or new interview, save draft first
      let currentId = interviewId;
      const payload = buildPayload();
      if (!currentId) {
        const createRes = await createInterviewApi(payload);
        currentId = createRes.id;
        setInterviewId(currentId);
      } else {
        await updateInterviewApi(currentId, payload);
      }

      // Publish blueprint
      const publishRes = await publishInterviewApi(currentId);
      setStatus('PUBLISHED');
      setPublishedAt(publishRes.publishedAt || new Date().toISOString());
      setShowPublishDialog(false);
      setSuccessMessage('Interview blueprint successfully published and locked for Phase 11 execution.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to publish blueprint:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to publish blueprint.');
      setShowPublishDialog(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Interview Builder & Configuration"
          subtitle="Loading blueprint configuration..."
        />
        <LoadingSkeleton count={3} height={120} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Back Link & Header */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to="/instructor/interviews"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            textDecoration: 'none',
            marginBottom: '0.75rem'
          }}
        >
          <ArrowLeft size={16} /> Back to Interview Blueprints
        </Link>

        <PageHeader
          title={isPublished ? 'Published Interview Blueprint' : 'Interview Builder & Rubric Configurator'}
          subtitle="Configure deterministic assessment rounds, static question sets, and evaluation weights."
          actions={
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <StatusBadge status={status} />
              {!isPublished && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Save}
                    onClick={handleSaveDraft}
                    disabled={saving || publishing}
                  >
                    {saving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => setShowPublishDialog(true)}
                    disabled={saving || publishing}
                  >
                    Publish Blueprint
                  </Button>
                </>
              )}
            </div>
          }
        />
      </div>

      {/* Published State Banner */}
      {isPublished && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}
        >
          <Lock size={20} />
          <div>
            <strong>Blueprint Published & Immutable:</strong> This interview specification is finalized for candidate assessment in Phase 11. Configurations cannot be modified.
          </div>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={18} />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Section 1: Candidate Information */}
        <Card title="1. Candidate Assignment" subtitle="Candidate eligible for assessment configuration">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
            <div>
              <label className="form-label" style={{ fontWeight: '600' }}>Select Accepted Candidate *</label>
              {interviewId ? (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  {selectedCandidateInfo?.fullName || 'Assigned Candidate'} ({selectedCandidateInfo?.email || 'Candidate'})
                </div>
              ) : (
                <select
                  className="form-input"
                  value={candidateAssignmentId}
                  onChange={handleAssignmentChange}
                  disabled={isPublished || acceptedCandidates.length === 0}
                >
                  {acceptedCandidates.length === 0 ? (
                    <option value="">No accepted candidates available</option>
                  ) : (
                    acceptedCandidates.map((c) => (
                      <option key={c.assignmentId} value={c.assignmentId}>
                        {c.candidateName} — {c.targetRole} ({c.candidateEmail})
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            {selectedCandidateInfo && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.06)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified Candidate Profile</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {selectedCandidateInfo.fullName}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                  <Badge variant="primary" size="sm">{selectedCandidateInfo.targetRole || targetRole}</Badge>
                  <Badge variant="purple" size="sm">{selectedCandidateInfo.experienceLevel || experienceLevel}</Badge>
                  <StatusBadge status="ACCEPTED_BY_INSTRUCTOR" size="sm" />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Section 2: Interview Basic Parameters */}
        <Card title="2. Interview Specification" subtitle="Blueprint metadata and target parameters">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Interview Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Senior Full Stack Engineer Technical Assessment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isPublished}
              />
            </div>

            <div>
              <label className="form-label">Target Role *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Senior Backend Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                disabled={isPublished}
              />
            </div>

            <div>
              <label className="form-label">Total Duration (Minutes) *</label>
              <input
                type="number"
                min="15"
                max="240"
                className="form-input"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                disabled={isPublished}
              />
            </div>

            <div>
              <label className="form-label">Experience Level</label>
              <select
                className="form-input"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                disabled={isPublished}
              >
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Overall Difficulty</label>
              <select
                className="form-input"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={isPublished}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1.5rem' }}>
              <input
                type="checkbox"
                id="adaptiveToggle"
                checked={isAdaptive}
                onChange={(e) => setIsAdaptive(e.target.checked)}
                disabled={isPublished}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: isPublished ? 'not-allowed' : 'pointer' }}
              />
              <label htmlFor="adaptiveToggle" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>
                Enable Adaptive Questioning Engine (Phase 12 Flag)
              </label>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Assessment Instructions & Objectives</label>
              <textarea
                className="form-input"
                rows="2"
                placeholder="Guidelines and focus areas for the assessment..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={isPublished}
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Assessment Rounds Manager */}
        <Card
          title="3. Assessment Rounds Configuration"
          subtitle="Define deterministic order, duration, focus areas, and questions for each round"
          actions={
            !isPublished && (
              <Button variant="primary" size="sm" icon={Plus} onClick={handleAddRound}>
                Add Round
              </Button>
            )
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
            {rounds.map((round, rIdx) => {
              const isExpanded = expandedRoundIdx === rIdx;
              return (
                <div
                  key={rIdx}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Round Header Bar */}
                  <div
                    style={{
                      padding: '0.85rem 1.25rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none'
                    }}
                    onClick={() => setExpandedRoundIdx(isExpanded ? -1 : rIdx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '700'
                        }}
                      >
                        {round.sequenceNumber || rIdx + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {round.roundName || `Round ${rIdx + 1}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                          <span>Type: <strong>{round.roundType}</strong></span>
                          <span>Duration: <strong>{round.durationMinutes}m</strong></span>
                          <span>Questions: <strong>{(round.questions?.length || round.questionCount || 0)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                      {!isPublished && (
                        <>
                          <button
                            disabled={rIdx === 0}
                            onClick={() => handleMoveRound(rIdx, -1)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: rIdx === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                              cursor: rIdx === 0 ? 'not-allowed' : 'pointer',
                              padding: '0.25rem'
                            }}
                            title="Move Up"
                          >
                            <ChevronUp size={18} />
                          </button>
                          <button
                            disabled={rIdx === rounds.length - 1}
                            onClick={() => handleMoveRound(rIdx, 1)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: rIdx === rounds.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                              cursor: rIdx === rounds.length - 1 ? 'not-allowed' : 'pointer',
                              padding: '0.25rem'
                            }}
                            title="Move Down"
                          >
                            <ChevronDown size={18} />
                          </button>
                          <button
                            onClick={() => handleRemoveRound(rIdx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              marginLeft: '0.5rem'
                            }}
                            title="Delete Round"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Round Body Details */}
                  {isExpanded && (
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div>
                          <label className="form-label">Round Name *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={round.roundName}
                            onChange={(e) => handleRoundChange(rIdx, 'roundName', e.target.value)}
                            disabled={isPublished}
                          />
                        </div>

                        <div>
                          <label className="form-label">Round Type</label>
                          <select
                            className="form-input"
                            value={round.roundType}
                            onChange={(e) => handleRoundChange(rIdx, 'roundType', e.target.value)}
                            disabled={isPublished}
                          >
                            {ROUND_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label">Duration (Minutes) *</label>
                          <input
                            type="number"
                            min="5"
                            max="120"
                            className="form-input"
                            value={round.durationMinutes}
                            onChange={(e) => handleRoundChange(rIdx, 'durationMinutes', e.target.value)}
                            disabled={isPublished}
                          />
                        </div>

                        <div>
                          <label className="form-label">Question Type</label>
                          <select
                            className="form-input"
                            value={round.questionType}
                            onChange={(e) => handleRoundChange(rIdx, 'questionType', e.target.value)}
                            disabled={isPublished}
                          >
                            {QUESTION_TYPES.map((qt) => (
                              <option key={qt.value} value={qt.value}>{qt.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label">Difficulty</label>
                          <select
                            className="form-input"
                            value={round.difficulty}
                            onChange={(e) => handleRoundChange(rIdx, 'difficulty', e.target.value)}
                            disabled={isPublished}
                          >
                            {DIFFICULTIES.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label">Target Question Count</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            className="form-input"
                            value={round.questionCount}
                            onChange={(e) => handleRoundChange(rIdx, 'questionCount', e.target.value)}
                            disabled={isPublished}
                          />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                          <label className="form-label">Round Instructions / Evaluation Criteria</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Guidelines for the AI interviewer agent..."
                            value={round.instructions || ''}
                            onChange={(e) => handleRoundChange(rIdx, 'instructions', e.target.value)}
                            disabled={isPublished}
                          />
                        </div>
                      </div>

                      {/* Question Configuration within Round */}
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '1rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <HelpCircle size={15} color="var(--primary)" />
                            <span>Static Questions Bank ({round.questions?.length || 0})</span>
                          </div>
                          {!isPublished && (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Plus}
                              onClick={() => handleAddQuestion(rIdx)}
                            >
                              Add Question
                            </Button>
                          )}
                        </div>

                        {(!round.questions || round.questions.length === 0) ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                            No static questions configured for this round. Dynamic agent questions will follow the round criteria in Phase 12.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {round.questions.map((q, qIdx) => (
                              <div
                                key={qIdx}
                                style={{
                                  padding: '0.85rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  border: '1px solid var(--border-color)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.75rem'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Q{qIdx + 1}. Question Prompt
                                  </span>
                                  {!isPublished && (
                                    <button
                                      onClick={() => handleRemoveQuestion(rIdx, qIdx)}
                                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                      title="Remove Question"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>

                                <textarea
                                  className="form-input"
                                  rows="2"
                                  placeholder="Enter the question or problem statement..."
                                  value={q.questionText}
                                  onChange={(e) => handleQuestionChange(rIdx, qIdx, 'questionText', e.target.value)}
                                  disabled={isPublished}
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                  <div>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Type</label>
                                    <select
                                      className="form-input"
                                      style={{ fontSize: '0.8rem' }}
                                      value={q.questionType}
                                      onChange={(e) => handleQuestionChange(rIdx, qIdx, 'questionType', e.target.value)}
                                      disabled={isPublished}
                                    >
                                      {QUESTION_TYPES.map((qt) => (
                                        <option key={qt.value} value={qt.value}>{qt.label}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Difficulty</label>
                                    <select
                                      className="form-input"
                                      style={{ fontSize: '0.8rem' }}
                                      value={q.difficulty}
                                      onChange={(e) => handleQuestionChange(rIdx, qIdx, 'difficulty', e.target.value)}
                                      disabled={isPublished}
                                    >
                                      {DIFFICULTIES.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {(q.questionType === 'CODING' || round.roundType === 'CODING') && (
                                    <div>
                                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Language</label>
                                      <select
                                        className="form-input"
                                        style={{ fontSize: '0.8rem' }}
                                        value={q.codingLanguage || 'Java'}
                                        onChange={(e) => handleQuestionChange(rIdx, qIdx, 'codingLanguage', e.target.value)}
                                        disabled={isPublished}
                                      >
                                        {CODING_LANGUAGES.map((lang) => (
                                          <option key={lang} value={lang}>{lang}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                </div>

                                {(q.questionType === 'CODING' || round.roundType === 'CODING') && (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Sample Input</label>
                                      <input
                                        type="text"
                                        className="form-input"
                                        style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                                        placeholder="e.g. nums = [2,7,11,15], target = 9"
                                        value={q.sampleInput || ''}
                                        onChange={(e) => handleQuestionChange(rIdx, qIdx, 'sampleInput', e.target.value)}
                                        disabled={isPublished}
                                      />
                                    </div>
                                    <div>
                                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Sample Output</label>
                                      <input
                                        type="text"
                                        className="form-input"
                                        style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                                        placeholder="e.g. [0,1]"
                                        value={q.sampleOutput || ''}
                                        onChange={(e) => handleQuestionChange(rIdx, qIdx, 'sampleOutput', e.target.value)}
                                        disabled={isPublished}
                                      />
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Expected Answer Guidance</label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{ fontSize: '0.8rem' }}
                                    placeholder="Evaluation pointers and key concepts expected from candidate..."
                                    value={q.expectedAnswerGuidance || ''}
                                    onChange={(e) => handleQuestionChange(rIdx, qIdx, 'expectedAnswerGuidance', e.target.value)}
                                    disabled={isPublished}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Section 4: Scoring & Rubric Configuration */}
        <Card
          title="4. Evaluation Scoring Weights & Rubric"
          subtitle="Configure percentage weights for interview evaluation categories (must total exactly 100%)"
        >
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Total Weight Status Indicator */}
            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: totalScoringWeight === 100 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${totalScoringWeight === 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {totalScoringWeight === 100 ? (
                  <CheckCircle2 size={18} color="var(--success)" />
                ) : (
                  <AlertCircle size={18} color="var(--danger)" />
                )}
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: totalScoringWeight === 100 ? 'var(--success)' : 'var(--danger)' }}>
                  {totalScoringWeight === 100
                    ? 'Scoring weights are valid and sum to 100%'
                    : `Total weight is ${totalScoringWeight}%. It must equal exactly 100% to publish.`}
                </span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: totalScoringWeight === 100 ? 'var(--success)' : 'var(--danger)' }}>
                {totalScoringWeight}%
              </div>
            </div>

            {/* Grid of Weights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Technical Weight (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={scoringConfig.technicalWeight}
                  onChange={(e) => setScoringConfig({ ...scoringConfig, technicalWeight: e.target.value })}
                  disabled={isPublished}
                />
              </div>

              <div>
                <label className="form-label">Coding Weight (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={scoringConfig.codingWeight}
                  onChange={(e) => setScoringConfig({ ...scoringConfig, codingWeight: e.target.value })}
                  disabled={isPublished}
                />
              </div>

              <div>
                <label className="form-label">SQL / Database (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={scoringConfig.sqlWeight}
                  onChange={(e) => setScoringConfig({ ...scoringConfig, sqlWeight: e.target.value })}
                  disabled={isPublished}
                />
              </div>

              <div>
                <label className="form-label">System Design (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={scoringConfig.systemDesignWeight}
                  onChange={(e) => setScoringConfig({ ...scoringConfig, systemDesignWeight: e.target.value })}
                  disabled={isPublished}
                />
              </div>

              <div>
                <label className="form-label">Problem Solving (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={scoringConfig.problemSolvingWeight}
                  onChange={(e) => setScoringConfig({ ...scoringConfig, problemSolvingWeight: e.target.value })}
                  disabled={isPublished}
                />
              </div>

              <div>
                <label className="form-label">Communication (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={scoringConfig.communicationWeight}
                  onChange={(e) => setScoringConfig({ ...scoringConfig, communicationWeight: e.target.value })}
                  disabled={isPublished}
                />
              </div>

              <div>
                <label className="form-label">Learning & Adaptability (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={scoringConfig.learningWeight}
                  onChange={(e) => setScoringConfig({ ...scoringConfig, learningWeight: e.target.value })}
                  disabled={isPublished}
                />
              </div>

              <div>
                <label className="form-label">Behavioral (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={scoringConfig.behavioralWeight}
                  onChange={(e) => setScoringConfig({ ...scoringConfig, behavioralWeight: e.target.value })}
                  disabled={isPublished}
                />
              </div>

              <div>
                <label className="form-label">Passing Score Threshold (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  className="form-input"
                  value={scoringConfig.passingScorePercentage}
                  onChange={(e) => setScoringConfig({ ...scoringConfig, passingScorePercentage: e.target.value })}
                  disabled={isPublished}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Action Footer */}
        {!isPublished && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '1rem'
            }}
          >
            <Button
              variant="secondary"
              size="md"
              icon={Save}
              onClick={handleSaveDraft}
              disabled={saving || publishing}
            >
              {saving ? 'Saving Draft...' : 'Save Draft'}
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={CheckCircle2}
              onClick={() => setShowPublishDialog(true)}
              disabled={saving || publishing}
            >
              {publishing ? 'Publishing...' : 'Publish Blueprint'}
            </Button>
          </div>
        )}
      </div>

      {/* Publish Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showPublishDialog}
        title="Publish Interview Blueprint?"
        message="Once published, this interview blueprint will be finalized and become immutable in Phase 10. Are you sure all rounds, questions, and scoring weights are configured properly?"
        confirmLabel={publishing ? 'Publishing...' : 'Publish Blueprint'}
        cancelLabel="Keep Editing"
        variant="primary"
        onConfirm={handlePublish}
        onCancel={() => setShowPublishDialog(false)}
      />
    </div>
  );
};

export default InterviewBuilder;

# AgentHire - Production AI Recruitment & Candidate Assessment Platform

## 1. Architecture Overview

```
                      +------------------------------------------+
                      |               WEB BROWSER                |
                      |          React 18 + Vite (SPA)           |
                      +--------------------+---------------------+
                                           |
                                           | HTTP / REST (JWT)
                                           v
+------------------------------------------------------------------------------------+
|                             SPRING BOOT BACKEND (:8080)                            |
|------------------------------------------------------------------------------------|
|  - Role-Based Access Control (ADMIN, INTERVIEW_ENGINEER, INSTRUCTOR, CANDIDATE)    |
|  - Business Workflow Engine (Candidate Intake -> Review -> Schedule -> Evaluation)  |
|  - JPA/Hibernate with MySQL (Single Source of Truth for Data & Deterministic Score)|
|  - REST APIs with OpenAPI / Swagger Docs                                           |
|  - Audit Log & Notification Dispatcher                                             |
+------------------------------------------+-----------------------------------------+
                                           |
                                           | Internal HTTP / JSON
                                           v
+------------------------------------------------------------------------------------+
|                              FASTAPI AI SERVICE (:8000)                            |
|------------------------------------------------------------------------------------|
|  - LangGraph Stateful Interview Engine                                             |
|  - Resume Parser & Verification Agent                                              |
|  - Adaptive Technical / Coding / Behavioral / Learning Evaluator                   |
|  - Guardrails & Bias Mitigation Engine                                             |
+------------------------------------------------------------------------------------+
```

## 2. Folder Structure

```
agenthire/
|-- backend/
|   |-- pom.xml
|   |-- src/
|   |   |-- main/
|   |   |   |-- java/com/agenthire/
|   |   |   |   |-- AgentHireApplication.java
|   |   |   |   |-- config/          # Security, WebMvc, Swagger, Cors Configs
|   |   |   |   |-- controller/      # REST API Controllers
|   |   |   |   |-- dto/             # Request/Response Data Transfer Objects
|   |   |   |   |-- entity/          # JPA Domain Entities
|   |   |   |   |-- repository/      # Spring Data JPA Repositories
|   |   |   |   |-- service/         # Business Logic Layer
|   |   |   |   |-- security/        # JWT Tokens, UserDetails, Filters
|   |   |   |   |-- exception/       # Global Exception Handler & Custom Errors
|   |   |   |   |-- mapper/          # DTO <-> Entity Mappers
|   |   |   |   |-- audit/           # Audit Logging Interceptors & Entities
|   |   |   |   |-- notification/   # Notification Services
|   |   |   |   +-- util/            # Helpers and Constants
|   |   |   +-- resources/
|   |   |       |-- application.yml
|   |   |       +-- application-dev.yml
|   +-- .env.example
|
|-- ai-service/
|   |-- app/
|   |   |-- main.py                  # FastAPI Application Entry
|   |   |-- core/                    # Settings & Configuration
|   |   |-- agents/                  # Specialized Agents (Resume, Technical, Coding, etc.)
|   |   |-- graphs/                  # LangGraph Workflow Definitions
|   |   |-- schemas/                 # Pydantic Request/Response Models
|   |   |-- prompts/                 # System Prompts & Rubrics
|   |   |-- guardrails/              # Safety, Non-discrimination & Anti-hallucination
|   |   +-- services/                # Text Extraction & Model Invocations
|   |-- requirements.txt
|   +-- .env.example
|
|-- frontend/
|   |-- package.json
|   |-- vite.config.js
|   |-- index.html
|   |-- src/
|   |   |-- api/                     # Axios Client & Endpoint Definitions
|   |   |-- components/              # Common UI (Navbar, Sidebar, Modal, Badge, Card, etc.)
|   |   |-- context/                 # AuthContext, NotificationContext
|   |   |-- pages/                   # Dashboards & Role-specific Views
|   |   |   |-- auth/
|   |   |   |-- admin/
|   |   |   |-- engineer/
|   |   |   |-- instructor/
|   |   |   |-- candidate/
|   |   |   +-- common/              # HealthTest, NotFound, Landing
|   |   |-- styles/                  # Design System Tokens & Custom CSS
|   |   |-- App.jsx
|   |   +-- main.jsx
|   +-- .env.example
|
+-- docs/
    +-- API_SPECIFICATION.md
```

## 3. Database Strategy
- **Source of Truth**: Spring Boot + MySQL via Spring Data JPA.
- **Relational Integrity**: Foreign key constraints on users, roles, candidates, interviews, rounds, and audit logs.
- **Audit & Timestamps**: Base audited entity with `createdAt`, `updatedAt`, and explicit `AuditLog` table for state transitions.
- **Strict Separation**: AI reasoning outputs are stored as structured JSON/text evaluation entities, with final scores calculated deterministically in Spring Boot.

## 4. API Strategy
- **Standardized Response Envelope**: Uniform error formats `{ timestamp, status, error, message, path }`.
- **Strict Role Authorization**: Spring Security `@PreAuthorize` on controller endpoints backed by JWT claims.
- **Swagger Documentation**: Live OpenAPI v3 specs at `/swagger-ui/index.html`.

## 5. Frontend Routing Strategy
- `/` -> Landing / Portal Entry
- `/health-test` -> Full Service Connectivity & Health Diagnostic Monitor
- `/login`, `/register` -> Authentication
- `/admin/*` -> Admin Dashboard & User Management (Role: `ADMIN`)
- `/engineer/*` -> Candidate Intake, Verification, Resume Upload/Analysis & Report Delivery (Role: `INTERVIEW_ENGINEER`)
- `/instructor/*` -> Candidate Review, Interview Builder, Evaluation & Final Decision (Role: `INSTRUCTOR`)
- `/candidate/*` -> Device Check, Live Interview Room, Assessment View (Role: `CANDIDATE`)

## 6. Resume Management & AI Analysis Architecture (Phase 7)

```
[Interview Engineer]
        │
        │ POST /api/engineer/candidates/{id}/resume (multipart/form-data)
        ▼
[Spring Boot REST API]
        │
        ├── 1. Authorize: INTERVIEW_ENGINEER only
        ├── 2. Validate Candidate status == VERIFIED (409 Conflict if not)
        ├── 3. Validate File format (PDF/DOCX) & size (<= 10MB)
        ├── 4. Secure File Storage: LocalResumeStorageService (UUID storage key, anti-traversal)
        ├── 5. Resume Entity Versioning: v1, v2, v3... (previous marked isCurrent=false)
        ├── 6. Server-side Text Extraction: Apache PDFBox & Apache POI (30k character safe limit)
        │
        │ POST /api/ai/resume/analyze
        ▼
[FastAPI AI Service (:8000)]
        │
        ▼
[LangGraph Resume Agent StateGraph]
   START
     │
     ▼
   [validate_input] ────────────► Neutralize prompt injections & clean candidate text
     │
     ▼
   [extract_structured_info] ───► Extract summary, skills, education, experience, projects, certs
     │
     ▼
   [skill_normalization] ───────► Canonical taxonomy mapping & tech stack categorisation
     │
     ▼
   [role_relevance_analysis] ───► Calculate match score (0-100) & evaluation rationale
     │
     ▼
   [gap_analysis] ──────────────► Identify technical discovery areas & evaluation gaps
     │
     ▼
   [final_structured_output] ───► Pydantic structured output validation
     │
     ▼
    END
        │
        │ HTTP 200 (Structured JSON)
        ▼
[Spring Boot]
        │
        ├── Validate AI JSON Response
        ├── Persist ResumeAnalysis entity & Update Resume status = ANALYZED
        ├── AuditLog: RESUME_UPLOADED, RESUME_ANALYSIS_STARTED, RESUME_ANALYSIS_COMPLETED
        └── Error Fallback: On AI timeout/failure -> Resume status = ANALYSIS_FAILED, Candidate preserved
```

## 7. Interview Engineer → Instructor Candidate Assignment & Routing (Phase 8)

```
[Interview Engineer]
        │
        │ POST /api/engineer/candidates/{candidateId}/assign
        │ Request: { instructorId, message, track, priority }
        ▼
[Spring Boot REST API]
        │
        ├── 1. Authorize: INTERVIEW_ENGINEER only (@PreAuthorize)
        ├── 2. Authenticate Engineer: Bound via SecurityContext (JWT -> UserPrincipal -> InterviewEngineer)
        ├── 3. Validate Candidate:
        │       ├── Candidate must exist
        │       ├── Candidate.status == VERIFIED (409 Conflict if not)
        │       └── Candidate must have at least one uploaded Resume (409 Conflict if missing)
        ├── 4. Validate Instructor:
        │       ├── Instructor user must exist and have Role == INSTRUCTOR
        │       └── Instructor account must be active == true (400 Bad Request if invalid)
        ├── 5. Duplicate Protection:
        │       └── Active assignment check (SENT/PENDING/ACCEPTED) -> 409 Conflict if duplicate
        │
        ├── 6. Atomically Execute within Transaction:
        │       ├── Create CandidateAssignment (status = SENT, track = TECHNICAL, priority)
        │       ├── Update Candidate (status = SENT_TO_INSTRUCTOR)
        │       ├── Dispatch Notification to Instructor (type = CANDIDATE_ASSIGNED)
        │       └── Record AuditLog (action = CANDIDATE_SENT_TO_INSTRUCTOR)
        │
        │ HTTP 201 Created (CandidateAssignmentDetailResponse)
        ▼
[Instructor Portal]
        │
        ├── Real-time Notification Bell: Unread count badge & review alert
        ├── GET /api/instructor/candidates: Filtered list of assignments for authenticated instructor
        └── GET /api/instructor/candidates/{candidateId}: Complete candidate dossier with:
                ├── Verified Candidate details & contact metadata
                ├── Engineer routing instructions & priority
                ├── Resume download link & extraction metadata
                └── AI Resume Analysis (skills, match score, summary, discovery areas)
                [Strict Isolation: 404 Not Found if assigned to another instructor]
```

### Assignment State Machine:
- `PENDING` -> Initial draft / queued state
- `SENT` -> Active assignment dispatched by Interview Engineer to Instructor (Phase 8)
- `ACCEPTED` -> Instructor accepted assignment (Phase 9)
- `DECLINED` -> Instructor declined assignment (Phase 9)
- `COMPLETED` -> Candidate interview cycle concluded

### Instructor Data Isolation Rule:
Every instructor-facing endpoint verifies that the candidate belongs to an active `CandidateAssignment` targeting the authenticated instructor. Cross-instructor data snooping is strictly prevented at the service layer.

## 8. Instructor Candidate Review, Acceptance & Interview Readiness (Phase 9)

```
[Instructor Reviews Candidate Portfolio]
        │
        ├── Verified Candidate intake info & academic background
        ├── Interview Engineer priority & instructions message
        ├── Downloadable Resume document & extraction metadata
        └── AI-assisted resume skills, role match score & exploration points
        │
        ├── Option A: ACCEPT CANDIDATE
        │       │ POST /api/instructor/assignments/{assignmentId}/accept
        │       ▼
        │   [Spring Boot REST API]
        │       ├── 1. Authorize: INSTRUCTOR only (@PreAuthorize)
        │       ├── 2. Verify Assignment ownership (belongs to authenticated Instructor)
        │       ├── 3. Enforce status == SENT (409 Conflict if not)
        │       ├── 4. Transactionally:
        │       │       ├── CandidateAssignment.status = ACCEPTED
        │       │       ├── CandidateAssignment.acceptedAt = now(), acceptedBy = instructorUser
        │       │       ├── Candidate.status = ACCEPTED_BY_INSTRUCTOR
        │       │       ├── Create Notification for Engineer (type = CANDIDATE_ASSIGNMENT_ACCEPTED)
        │       │       └── Record AuditLog (action = CANDIDATE_ASSIGNMENT_ACCEPTED)
        │       └── 5. Result: Candidate becomes READY FOR INTERVIEW CONFIGURATION
        │
        └── Option B: DECLINE CANDIDATE
                │ POST /api/instructor/assignments/{assignmentId}/decline
                │ Request: { "reason": "Mandatory evaluation rationale..." }
                ▼
            [Spring Boot REST API]
                ├── 1. Authorize: INSTRUCTOR only
                ├── 2. Verify Assignment ownership & status == SENT (409 Conflict if not)
                ├── 3. Validate non-empty reason (400 Bad Request if missing/blank)
                ├── 4. Transactionally:
                │       ├── CandidateAssignment.status = DECLINED
                │       ├── CandidateAssignment.declinedAt = now(), declinedBy = instructorUser, declineReason = reason
                │       ├── Candidate preserved (status = VERIFIED for reassignment)
                │       ├── Create Notification for Engineer (type = CANDIDATE_ASSIGNMENT_DECLINED)
                │       └── Record AuditLog (action = CANDIDATE_ASSIGNMENT_DECLINED)
                └── 5. Result: Assignment concluded as DECLINED; recruitment traceability preserved
```

### Assignment Decision Endpoints:
- `POST /api/instructor/assignments/{id}/accept`: Transitions `SENT` -> `ACCEPTED`
- `POST /api/instructor/assignments/{id}/decline`: Transitions `SENT` -> `DECLINED` (requires reason)
- `GET  /api/instructor/assignments`: Paginated instructor assignment history
- `GET  /api/instructor/assignments/{id}`: Single assignment review
- `GET  /api/instructor/dashboard/stats`: Real-time KPI metrics (`assignedCandidates`, `pendingReview`, `accepted`, `declined`)




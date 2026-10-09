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


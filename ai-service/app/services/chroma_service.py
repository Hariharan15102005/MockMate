import os
import re
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings

logger = logging.getLogger(__name__)

CHROMA_PERSIST_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db")
)
COLLECTION_NAME = "mockmate_candidate_resumes"

_chroma_client = None
_resume_collection = None

def get_chroma_client():
    global _chroma_client, _resume_collection
    if _chroma_client is None:
        try:
            os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
            _chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
            _resume_collection = _chroma_client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"ChromaDB initialized at: {CHROMA_PERSIST_DIR}")
        except Exception as e:
            logger.warning(f"Fallback to ephemeral Chroma client due to: {e}")
            _chroma_client = chromadb.Client()
            _resume_collection = _chroma_client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
    return _resume_collection

def chunk_and_index_resume(
    candidate_id: str,
    resume_id: str,
    resume_data: Dict[str, Any]
) -> int:
    """
    Extracts structured knowledge units and claims from resume and indexes into ChromaDB
    with strict candidate-level and resume-level isolation metadata.
    """
    collection = get_chroma_client()
    candidate_id_str = str(candidate_id)
    resume_id_str = str(resume_id)

    documents: List[str] = []
    metadatas: List[Dict[str, Any]] = []
    ids: List[str] = []

    # 1. Summary Chunk
    summary = resume_data.get("summary") or ""
    if summary:
        doc_id = f"{candidate_id_str}_{resume_id_str}_summary"
        documents.append(f"Candidate Profile Summary: {summary}")
        metadatas.append({
            "candidate_id": candidate_id_str,
            "resume_id": resume_id_str,
            "section": "summary",
            "type": "profile_overview",
            "topic": "BACKGROUND",
            "technology": "General",
            "project": "Career",
            "source": "resume"
        })
        ids.append(doc_id)

    # 2. Skills & Technology Chunks
    skills = resume_data.get("skills") or []
    languages = resume_data.get("languages") or []
    frameworks = resume_data.get("frameworks") or []
    databases = resume_data.get("databases") or []
    tools = resume_data.get("tools") or []

    for lang in languages:
        doc_id = f"{candidate_id_str}_{resume_id_str}_lang_{re.sub(r'[^a-zA-Z0-9]', '_', str(lang).lower())}"
        documents.append(f"Programming Language Proficiency: {lang}. Hands-on programming and core language mechanisms.")
        metadatas.append({
            "candidate_id": candidate_id_str,
            "resume_id": resume_id_str,
            "section": "skills",
            "type": "language",
            "topic": str(lang).upper(),
            "technology": str(lang),
            "project": "Skills",
            "source": "resume"
        })
        ids.append(doc_id)

    for fw in frameworks:
        doc_id = f"{candidate_id_str}_{resume_id_str}_fw_{re.sub(r'[^a-zA-Z0-9]', '_', str(fw).lower())}"
        documents.append(f"Framework & Architecture Experience: {fw}. Application design, dependency injection, and REST endpoints.")
        metadatas.append({
            "candidate_id": candidate_id_str,
            "resume_id": resume_id_str,
            "section": "skills",
            "type": "framework",
            "topic": str(fw).upper(),
            "technology": str(fw),
            "project": "Skills",
            "source": "resume"
        })
        ids.append(doc_id)

    for db in databases:
        doc_id = f"{candidate_id_str}_{resume_id_str}_db_{re.sub(r'[^a-zA-Z0-9]', '_', str(db).lower())}"
        documents.append(f"Database Management & Querying: {db}. Schema modeling, indexing, transactions, and performance tuning.")
        metadatas.append({
            "candidate_id": candidate_id_str,
            "resume_id": resume_id_str,
            "section": "skills",
            "type": "database",
            "topic": str(db).upper(),
            "technology": str(db),
            "project": "Skills",
            "source": "resume"
        })
        ids.append(doc_id)

    for tool in tools:
        doc_id = f"{candidate_id_str}_{resume_id_str}_tool_{re.sub(r'[^a-zA-Z0-9]', '_', str(tool).lower())}"
        documents.append(f"DevOps and Development Tool: {tool}. Containerization, version control, and CI/CD pipelines.")
        metadatas.append({
            "candidate_id": candidate_id_str,
            "resume_id": resume_id_str,
            "section": "skills",
            "type": "tool",
            "topic": str(tool).upper(),
            "technology": str(tool),
            "project": "Skills",
            "source": "resume"
        })
        ids.append(doc_id)

    # 3. Project Chunks & Deep Claim Extractions
    projects = resume_data.get("projects") or []
    for idx, p in enumerate(projects):
        if isinstance(p, dict):
            p_name = p.get("name") or f"Project {idx+1}"
            p_desc = p.get("description") or ""
            p_techs = p.get("technologies") or []
            tech_str = ", ".join(p_techs) if p_techs else "General Stack"

            # Base project overview
            p_base_id = f"{candidate_id_str}_{resume_id_str}_proj_{idx}_{re.sub(r'[^a-zA-Z0-9]', '_', p_name.lower())}"
            documents.append(f"Project: {p_name}. Technologies: {tech_str}. Description: {p_desc}")
            metadatas.append({
                "candidate_id": candidate_id_str,
                "resume_id": resume_id_str,
                "section": "projects",
                "type": "project_overview",
                "topic": "PROJECT_ARCHITECTURE",
                "technology": tech_str,
                "project": p_name,
                "source": "resume"
            })
            ids.append(p_base_id)

            # Granular claim decomposition per project
            full_proj_text = f"{p_name} {p_desc} {tech_str}".lower()

            if any(k in full_proj_text for k in ["spring", "spring boot", "rest", "api", "backend"]):
                c_id = f"{p_base_id}_claim_spring_api"
                documents.append(f"Project Claim ({p_name}): Developed scalable backend RESTful microservices and APIs using Spring Boot, handling data validation, security, and exception filters.")
                metadatas.append({
                    "candidate_id": candidate_id_str,
                    "resume_id": resume_id_str,
                    "section": "projects",
                    "type": "implementation_claim",
                    "topic": "SPRING_BOOT",
                    "technology": "Spring Boot",
                    "project": p_name,
                    "source": "resume"
                })
                ids.append(c_id)

            if any(k in full_proj_text for k in ["rag", "chroma", "vector", "langchain", "embeddings", "llm", "ai"]):
                c_id = f"{p_base_id}_claim_rag_ai"
                documents.append(f"Project Claim ({p_name}): Architected a RAG (Retrieval-Augmented Generation) pipeline with vector embeddings and ChromaDB vector store for semantic context retrieval.")
                metadatas.append({
                    "candidate_id": candidate_id_str,
                    "resume_id": resume_id_str,
                    "section": "projects",
                    "type": "architecture_claim",
                    "topic": "RAG",
                    "technology": "ChromaDB",
                    "project": p_name,
                    "source": "resume"
                })
                ids.append(c_id)

            if any(k in full_proj_text for k in ["react", "frontend", "redux", "ui", "state"]):
                c_id = f"{p_base_id}_claim_react_ui"
                documents.append(f"Project Claim ({p_name}): Implemented dynamic client interfaces, responsive state management, and real-time frontend components using React.")
                metadatas.append({
                    "candidate_id": candidate_id_str,
                    "resume_id": resume_id_str,
                    "section": "projects",
                    "type": "implementation_claim",
                    "topic": "REACT",
                    "technology": "React",
                    "project": p_name,
                    "source": "resume"
                })
                ids.append(c_id)

            if any(k in full_proj_text for k in ["sql", "mysql", "postgres", "database", "query", "orm", "hibernate"]):
                c_id = f"{p_base_id}_claim_sql_db"
                documents.append(f"Project Claim ({p_name}): Designed relational schemas, ACID transactions, table indexing, and query optimization for high throughput database operations.")
                metadatas.append({
                    "candidate_id": candidate_id_str,
                    "resume_id": resume_id_str,
                    "section": "projects",
                    "type": "optimization_claim",
                    "topic": "SQL",
                    "technology": "MySQL",
                    "project": p_name,
                    "source": "resume"
                })
                ids.append(c_id)

            if any(k in full_proj_text for k in ["redis", "cache", "latency"]):
                c_id = f"{p_base_id}_claim_redis_cache"
                documents.append(f"Project Claim ({p_name}): Integrated Redis caching layer to minimize database load and accelerate endpoint response latency.")
                metadatas.append({
                    "candidate_id": candidate_id_str,
                    "resume_id": resume_id_str,
                    "section": "projects",
                    "type": "optimization_claim",
                    "topic": "REDIS",
                    "technology": "Redis",
                    "project": p_name,
                    "source": "resume"
                })
                ids.append(c_id)

    # 4. Experience & Internships
    experiences = resume_data.get("experience") or []
    for idx, exp in enumerate(experiences):
        if isinstance(exp, dict):
            role = exp.get("role") or "Software Engineering Contributor"
            company = exp.get("company") or "Technology Company"
            desc = exp.get("description") or ""
            doc_id = f"{candidate_id_str}_{resume_id_str}_exp_{idx}"
            documents.append(f"Professional Experience: {role} at {company}. Responsibilities & Deliverables: {desc}")
            metadatas.append({
                "candidate_id": candidate_id_str,
                "resume_id": resume_id_str,
                "section": "experience",
                "type": "work_experience",
                "topic": "PROFESSIONAL_EXPERIENCE",
                "technology": "Software Engineering",
                "project": company,
                "source": "resume"
            })
            ids.append(doc_id)

    # 5. Education
    education = resume_data.get("education") or []
    for idx, edu in enumerate(education):
        if isinstance(edu, dict):
            deg = edu.get("degree") or "B.Tech"
            field = edu.get("field") or "Computer Science"
            inst = edu.get("institution") or "University"
            doc_id = f"{candidate_id_str}_{resume_id_str}_edu_{idx}"
            documents.append(f"Academic Background: {deg} in {field} from {inst}.")
            metadatas.append({
                "candidate_id": candidate_id_str,
                "resume_id": resume_id_str,
                "section": "education",
                "type": "academic",
                "topic": "EDUCATION",
                "technology": "Computer Science",
                "project": "Academic",
                "source": "resume"
            })
            ids.append(doc_id)

    if documents:
        # Upsert documents into isolated collection
        try:
            collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            logger.info(f"Indexed {len(documents)} resume chunks for candidate: {candidate_id_str}")
        except Exception as e:
            logger.error(f"Failed to upsert resume chunks to ChromaDB: {e}", exc_info=True)

    return len(documents)

def retrieve_relevant_resume_knowledge(
    candidate_id: str,
    resume_id: Optional[str],
    query_text: str,
    n_results: int = 4
) -> List[Dict[str, Any]]:
    """
    Queries ChromaDB with candidate isolation filter.
    Returns matched knowledge chunks, claims, and metadata.
    """
    collection = get_chroma_client()
    candidate_id_str = str(candidate_id)

    try:
        where_filter: Dict[str, Any] = {"candidate_id": candidate_id_str}
        
        # Check if collection has documents for candidate
        count = collection.count()
        if count == 0:
            return []

        results = collection.query(
            query_texts=[query_text],
            where=where_filter,
            n_results=min(n_results, 10)
        )

        matched_items = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
            dists = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(docs)

            for doc, meta, dist in zip(docs, metas, dists):
                matched_items.append({
                    "document": doc,
                    "metadata": meta,
                    "distance": dist,
                    "topic": meta.get("topic", "General"),
                    "technology": meta.get("technology", "General"),
                    "project": meta.get("project"),
                    "type": meta.get("type", "knowledge_chunk")
                })

        return matched_items
    except Exception as e:
        logger.warning(f"Error querying ChromaDB for candidate {candidate_id}: {e}")
        return []

def get_all_candidate_claims(candidate_id: str) -> List[Dict[str, Any]]:
    """
    Fetches all indexed claims and project knowledge units for a candidate from ChromaDB.
    """
    collection = get_chroma_client()
    try:
        results = collection.get(
            where={"candidate_id": str(candidate_id)}
        )
        claims = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"]
            metas = results["metadatas"]
            for doc, meta in zip(docs, metas):
                claims.append({
                    "document": doc,
                    "metadata": meta,
                    "topic": meta.get("topic", "General"),
                    "technology": meta.get("technology", "General"),
                    "project": meta.get("project"),
                    "type": meta.get("type", "knowledge_chunk")
                })
        return claims
    except Exception as e:
        logger.warning(f"Error fetching candidate claims from ChromaDB: {e}")
        return []

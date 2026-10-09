import sys
import os
import unittest

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.chroma_service import (
    chunk_and_index_resume,
    retrieve_relevant_resume_knowledge,
    get_all_candidate_claims
)
from app.agents.interview_graph import generate_interview_question
from app.schemas.interview import GenerateQuestionRequest


class TestAgenticInterviewRebuild(unittest.TestCase):

    def setUp(self):
        self.candidate_a_id = "cand-001-java-rag"
        self.resume_a_id = "res-001-learnsphere"

        self.resume_a_parsed = {
            "summary": "Full Stack & AI Engineer specializing in Spring Boot, React, and LangChain RAG pipelines.",
            "skills": {
                "languages": ["Java", "JavaScript", "SQL", "Python"],
                "frameworks": ["Spring Boot", "React", "LangChain", "Hibernate"],
                "databases": ["MySQL", "ChromaDB", "Redis"],
                "tools": ["Docker", "Git", "Maven"]
            },
            "projects": [
                {
                    "title": "LearnSphere AI Platform",
                    "description": "AI-powered learning and assessment platform with LangChain RAG pipeline and Spring Boot backend.",
                    "technologies": ["Spring Boot", "React", "LangChain", "RAG", "ChromaDB", "MySQL"],
                    "responsibilities": [
                        "Architected RAG pipeline with ChromaDB vector search and chunking optimization",
                        "Engineered secure Spring Boot REST APIs with JWT authentication",
                        "Designed MySQL relational schema with indexing for fast query response"
                    ]
                }
            ],
            "experience": [
                {
                    "company": "Tech Innovations Inc",
                    "role": "Software Engineering Intern",
                    "highlights": ["Built backend microservices in Java", "Implemented caching layer using Redis"]
                }
            ],
            "education": [
                {
                    "degree": "B.Tech Computer Science and Engineering",
                    "institution": "National Institute of Technology",
                    "year": "2024"
                }
            ]
        }

        self.candidate_b_id = "cand-002-python-cv"
        self.resume_b_id = "res-002-visionai"

        self.resume_b_parsed = {
            "summary": "Machine Learning Engineer focusing on Computer Vision, Deep Learning, and TensorFlow CNNs.",
            "skills": {
                "languages": ["Python", "C++", "SQL"],
                "frameworks": ["TensorFlow", "Keras", "PyTorch", "OpenCV"],
                "databases": ["PostgreSQL", "MongoDB"],
                "tools": ["Docker", "Git", "NumPy", "Pandas", "Scikit-Learn"]
            },
            "projects": [
                {
                    "title": "VisionGuard AI",
                    "description": "Real-time edge computer vision system for defect detection using convolutional neural networks.",
                    "technologies": ["Python", "TensorFlow", "OpenCV", "CNN", "Pandas", "NumPy"],
                    "responsibilities": [
                        "Trained custom CNN architectures achieving 98.4% defect classification accuracy",
                        "Built real-time video frame preprocessing pipeline with OpenCV",
                        "Optimized model inference latency for edge deployment"
                    ]
                }
            ],
            "experience": [
                {
                    "company": "Vision Labs",
                    "role": "AI Research Intern",
                    "highlights": ["Preprocessed 50k+ image dataset with NumPy/Pandas", "Tuned hyperparameters for ResNet models"]
                }
            ],
            "education": [
                {
                    "degree": "B.Tech in Artificial Intelligence",
                    "institution": "State University",
                    "year": "2024"
                }
            ]
        }

    def test_01_resume_indexing_and_isolation(self):
        print("\n--- TEST 1: ChromaDB Indexing & Cross-Candidate Isolation ---")
        chunks_a = chunk_and_index_resume(self.candidate_a_id, self.resume_a_id, self.resume_a_parsed)
        self.assertGreater(chunks_a, 0)
        print(f"[SUCCESS] Candidate A indexed with {chunks_a} structured knowledge chunks.")

        chunks_b = chunk_and_index_resume(self.candidate_b_id, self.resume_b_id, self.resume_b_parsed)
        self.assertGreater(chunks_b, 0)
        print(f"[SUCCESS] Candidate B indexed with {chunks_b} structured knowledge chunks.")

        # Candidate B retrieval query for RAG / ChromaDB must return NO Candidate A data
        results_b = retrieve_relevant_resume_knowledge(self.candidate_b_id, self.resume_b_id, "ChromaDB RAG LearnSphere")
        for r in results_b:
            self.assertNotEqual(r["metadata"].get("candidate_id"), self.candidate_a_id)
            self.assertNotIn("LearnSphere", r["document"])
        print("[SUCCESS] Cross-Candidate Isolation Verified: Candidate B query NEVER retrieves Candidate A data.")

    def test_02_resume_a_vs_resume_b_topic_divergence(self):
        print("\n--- TEST 2: Resume A vs Resume B Topic & Question Generation ---")
        req_a = GenerateQuestionRequest(
            session_id="sess-a-1",
            candidate_id=self.candidate_a_id,
            candidate_name="Hari",
            round_number=2,
            round_type="SYSTEM_DESIGN",
            role="Java Full Stack & AI Developer",
            resume_context=self.resume_a_parsed,
            last_candidate_answer="I recently worked on LearnSphere, an AI platform with a RAG pipeline and Spring Boot backend."
        )
        res_a = generate_interview_question(req_a)
        print(f"Candidate A Action: {res_a.action} | Topic: {res_a.topic} | Project: {res_a.project}")
        print(f"Candidate A Speech: {res_a.full_speech_text}")
        self.assertTrue(
            any(kw in res_a.full_speech_text.lower() for kw in ["rag", "learnsphere", "spring", "pipeline", "platform", "retrieval", "chromadb", "vector"])
        )

        req_b = GenerateQuestionRequest(
            session_id="sess-b-1",
            candidate_id=self.candidate_b_id,
            candidate_name="Alex",
            round_number=2,
            round_type="SYSTEM_DESIGN",
            role="Machine Learning Engineer",
            resume_context=self.resume_b_parsed,
            last_candidate_answer="I built VisionGuard, a real-time computer vision system using TensorFlow and convolutional neural networks."
        )
        res_b = generate_interview_question(req_b)
        print(f"Candidate B Action: {res_b.action} | Topic: {res_b.topic} | Project: {res_b.project}")
        print(f"Candidate B Speech: {res_b.full_speech_text}")
        self.assertTrue(
            any(kw in res_b.full_speech_text.lower() for kw in ["vision", "cnn", "tensorflow", "model", "defect", "accuracy", "neural", "frame"])
        )
        self.assertNotIn("spring boot", res_b.full_speech_text.lower())
        self.assertNotIn("chromadb", res_b.full_speech_text.lower())
        print("[SUCCESS] Resume A and Resume B generate completely distinct, resume-grounded questions.")

    def test_03_same_resume_four_distinct_answer_forks(self):
        print("\n--- TEST 3: Same Resume (Resume A) with 4 Different Spoken Answers ---")
        base_question = "What part of LearnSphere did you personally take ownership of?"

        answers = {
            "RAG": "I personally designed and implemented the RAG pipeline with ChromaDB vector search.",
            "React": "I built the interactive React frontend user interface and real-time state management.",
            "MySQL": "I architected the MySQL relational database schema, indexing, and transactional queries.",
            "SpringBoot": "I built the core Spring Boot microservices, REST APIs, and security filter chain."
        }

        results = {}
        for key, ans in answers.items():
            req = GenerateQuestionRequest(
                session_id=f"sess-fork-{key}",
                candidate_id=self.candidate_a_id,
                candidate_name="Hari",
                round_number=2,
                round_type="SYSTEM_DESIGN",
                role="Java Full Stack & AI Developer",
                resume_context=self.resume_a_parsed,
                last_candidate_answer=ans,
                conversation_history=[
                    {"question": base_question, "answer": ans, "topic": "LearnSphere"}
                ]
            )
            res = generate_interview_question(req)
            results[key] = res
            print(f"Fork [{key}]:")
            print(f"  Action: {res.action} | Topic: {res.topic} | Angle: {res.angle}")
            print(f"  Question: {res.question_text}\n")

        # Verify all 4 forks produced different questions
        questions = [r.question_text for r in results.values()]
        self.assertEqual(len(set(questions)), 4, "All 4 forks must produce unique questions!")
        print("[SUCCESS] 4 Distinct Conversational Forks Verified on Same Resume!")

    def test_04_strong_answer_drills_deeper(self):
        print("\n--- TEST 4: Strong Technical Answer -> GO_DEEPER ---")
        req = GenerateQuestionRequest(
            session_id="sess-deep-1",
            candidate_id=self.candidate_a_id,
            candidate_name="Hari",
            round_number=2,
            round_type="SYSTEM_DESIGN",
            role="Java Full Stack & AI Developer",
            resume_context=self.resume_a_parsed,
            last_candidate_answer="We chunked documents with an overlap of 50 tokens, generated cosine embeddings via all-MiniLM-L6-v2, indexed them in ChromaDB with candidateId metadata filters, and performed top-k nearest neighbor similarity search.",
            conversation_history=[
                {"question": "How did retrieval work in LearnSphere?", "answer": "Initial overview", "topic": "RAG"}
            ]
        )
        res = generate_interview_question(req)
        print(f"Decision: {res.action} | Topic: {res.topic} | Angle: {res.angle}")
        print(f"Deeper Question: {res.question_text}")
        self.assertIn(res.action, ["GO_DEEPER", "FOLLOW_UP", "ASK_QUESTION"])
        print("[SUCCESS] Strong Answer correctly triggers deep technical follow-up!")

    def test_05_weak_answer_triggers_clarification(self):
        print("\n--- TEST 5: Weak / Incomplete Answer -> CLARIFY ---")
        req = GenerateQuestionRequest(
            session_id="sess-clarify-1",
            candidate_id=self.candidate_a_id,
            candidate_name="Hari",
            round_number=3,
            round_type="TECHNICAL",
            role="Java Full Stack Developer",
            resume_context=self.resume_a_parsed,
            last_candidate_answer="We just wrote standard controllers and used normal security.",
            conversation_history=[
                {"question": "How did you implement security in Spring Boot?", "answer": "Simple controllers", "topic": "Spring Boot"}
            ]
        )
        res = generate_interview_question(req)
        print(f"Decision: {res.action} | Topic: {res.topic}")
        print(f"Clarification Question: {res.question_text}")
        self.assertEqual(res.action, "CLARIFY")
        print("[SUCCESS] Incomplete Answer correctly triggers CLARIFY!")

    def test_06_i_dont_know_switches_topic_gracefully(self):
        print("\n--- TEST 6: 'I don't know' -> SWITCH_TOPIC with Graceful Dialogue ---")
        req = GenerateQuestionRequest(
            session_id="sess-idk-1",
            candidate_id=self.candidate_a_id,
            candidate_name="Hari",
            round_number=3,
            round_type="TECHNICAL",
            role="Java Full Stack Developer",
            resume_context=self.resume_a_parsed,
            last_candidate_answer="I am not sure about that, I don't know.",
            conversation_history=[
                {"question": "What happens when vector cosine distance suffers from high-dimensional hubness?", "answer": "I don't know", "topic": "RAG"}
            ]
        )
        res = generate_interview_question(req)
        print(f"Decision: {res.action} | Topic: {res.topic}")
        print(f"AI Speech: {res.full_speech_text}")
        self.assertIn(res.action, ["SWITCH_TOPIC", "TRANSITION", "ASK_QUESTION"])
        self.assertTrue(
            any(phrase in res.full_speech_text.lower() for phrase in ["no worries", "completely fine", "no problem", "let's move", "fair enough", "perfectly fine"])
        )
        print("[SUCCESS] 'I don't know' correctly triggers graceful acknowledgment and topic switch!")


if __name__ == "__main__":
    unittest.main(verbosity=2)

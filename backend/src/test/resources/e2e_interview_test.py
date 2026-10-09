import requests
import json
import sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://localhost:8080/api"
AI_URL = "http://localhost:8000"

def test_full_flow():
    print("========================================")
    print("MOCKMATE AI INTERVIEW LIVE E2E TEST")
    print("========================================")

    # 1. Instructor Login
    print("\n1. Logging in as Instructor (Khariharan.career@gmail.com)...")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "Khariharan.career@gmail.com",
        "password": "Hari@12345678"
    })
    assert res.status_code == 200, f"Instructor login failed: {res.text}"
    instructor_data = res.json()["data"]
    instructor_token = instructor_data["accessToken"]
    print(f"[OK] Instructor logged in successfully. Token: {instructor_token[:20]}...")

    # 2. Check Instructor Interview Blueprints
    print("\n2. Fetching Instructor Interview Blueprints...")
    res = requests.get(
        f"{BASE_URL}/instructor/interviews",
        headers={"Authorization": f"Bearer {instructor_token}"}
    )
    assert res.status_code == 200, f"Fetch blueprints failed: {res.text}"
    blueprints = res.json()
    content = blueprints.get("content", [])
    assert len(content) > 0, "No blueprints found in database!"
    blueprint = content[0]
    interview_id = blueprint["id"]
    print(f"[OK] Found Published Blueprint: '{blueprint['title']}' (ID: {interview_id}, Status: {blueprint['status']}, Rounds: {blueprint.get('roundsCount', 8)})")

    # 3. Candidate Login
    print("\n3. Logging in as Candidate (Hari@gmail.com)...")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "Hari@gmail.com",
        "password": "Hari@12345678"
    })
    assert res.status_code == 200, f"Candidate login failed: {res.text}"
    candidate_data = res.json()["data"]
    candidate_token = candidate_data["accessToken"]
    print(f"[OK] Candidate logged in successfully. Token: {candidate_token[:20]}...")

    # 4. Fetch Candidate "My Interviews"
    print("\n4. Candidate fetching 'My Interviews' (/api/candidate/interviews)...")
    res = requests.get(
        f"{BASE_URL}/candidate/interviews",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    assert res.status_code == 200, f"Candidate interviews fetch failed: {res.text}"
    cand_interviews = res.json()
    assert len(cand_interviews) > 0, "Candidate has no assigned/published interviews"
    print(f"[OK] Candidate sees {len(cand_interviews)} mock interview(s): '{cand_interviews[0]['title']}'")

    # 5. Start / Resume Session
    print(f"\n5. Candidate starting interview session for ID: {interview_id}...")
    res = requests.post(
        f"{BASE_URL}/candidate/interviews/{interview_id}/start-session",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    assert res.status_code == 200, f"Start session failed: {res.text}"
    session_data = res.json()
    session_id = session_data["sessionId"]
    print(f"[OK] Session initialized: ID {session_id}, Status: {session_data['sessionStatus']}, Round: {session_data['currentRound']} ({session_data['currentRoundType']})")

    # 6. Fetch Question for Round
    print(f"\n6. Candidate fetching Question for current round...")
    res = requests.get(
        f"{BASE_URL}/candidate/interviews/sessions/{session_id}/current-question",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    assert res.status_code == 200, f"Fetch question failed: {res.text}"
    q_data = res.json()
    print(f"[OK] Question Asked (Round {q_data['roundNumber']} - {q_data['roundType']}): \"{q_data['questionText'][:80]}...\"")
    print(f"     Source: {q_data['questionSource']}")

    # 7. Record Media & Integrity Event (Tab switch / Camera active)
    print("\n7. Recording integrity compliance events (Camera Started, Window Blur)...")
    res = requests.post(
        f"{BASE_URL}/candidate/interviews/sessions/{session_id}/events",
        headers={"Authorization": f"Bearer {candidate_token}"},
        json={
            "eventType": "CAMERA_STARTED",
            "durationSeconds": 0,
            "metadata": {"fps": 30, "resolution": "1280x720"}
        }
    )
    assert res.status_code == 200, f"Record event failed: {res.text}"
    print("[OK] MediaEvent CAMERA_STARTED recorded successfully.")

    # 8. Submit Candidate Answer & Trigger AI Evaluation
    print("\n8. Submitting Candidate Answer & Evaluating via LangGraph AI Agent...")
    res = requests.post(
        f"{BASE_URL}/candidate/interviews/sessions/{session_id}/answers",
        headers={"Authorization": f"Bearer {candidate_token}"},
        json={
            "questionId": q_data.get("questionId"),
            "roundNumber": q_data.get("roundNumber", 1),
            "roundType": q_data.get("roundType", "TECHNICAL"),
            "questionText": q_data.get("questionText", "Spring Boot Architecture"),
            "answerText": "In Spring Boot, beans are managed by ApplicationContext IoC container. @Transactional uses dynamic AOP proxies to manage transaction commit and rollback semantics on runtime exceptions.",
            "transcript": "In Spring Boot, beans are managed by ApplicationContext IoC container. @Transactional uses dynamic AOP proxies to manage transaction commit and rollback semantics on runtime exceptions.",
            "responseTimeSeconds": 42
        }
    )
    assert res.status_code == 200, f"Submit answer failed: {res.text}"
    eval_res = res.json()
    print(f"[OK] AI Answer Evaluation Completed:")
    print(f"     - Overall Score: {eval_res['questionScore']}/10")
    print(f"     - Correctness: {eval_res['correctnessScore']}/10")
    print(f"     - Feedback: {eval_res['feedback']}")
    print(f"     - Strengths: {eval_res['strengths']}")

    # 9. Complete Interview Session
    print(f"\n9. Completing interview session {session_id} and calculating deterministic scorecard...")
    res = requests.post(
        f"{BASE_URL}/candidate/interviews/sessions/{session_id}/complete",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    assert res.status_code == 200, f"Complete session failed: {res.text}"
    result_data = res.json()
    print(f"[OK] Interview Completed! Candidate Scorecard:")
    print(f"     - Overall Score: {result_data['overallScore']}/100")
    print(f"     - Technical Score: {result_data['technicalScore']}/100")
    print(f"     - Coding Score: {result_data['codingScore']}/100")
    print(f"     - Communication Score: {result_data['communicationScore']}/100")
    print(f"     - Integrity Score: {result_data['integrityScore']}/100")
    print(f"     - Key Strengths: {result_data['strengths']}")
    print(f"     - Recommended Improvement Areas: {result_data['improvementAreas']}")

    # 10. Candidate views result
    print(f"\n10. Candidate accessing score result (/api/candidate/interviews/sessions/{session_id}/result)...")
    res = requests.get(
        f"{BASE_URL}/candidate/interviews/sessions/{session_id}/result",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    assert res.status_code == 200, f"Candidate get result failed: {res.text}"
    print("[OK] Candidate scorecard retrieved successfully.")

    # 11. Instructor views detailed report with itemized questions & integrity events
    print(f"\n11. Instructor accessing detailed report (/api/instructor/interviews/sessions/{session_id}/report)...")
    res = requests.get(
        f"{BASE_URL}/instructor/interviews/sessions/{session_id}/report",
        headers={"Authorization": f"Bearer {instructor_token}"}
    )
    assert res.status_code == 200, f"Instructor report failed: {res.text}"
    inst_report = res.json()
    print(f"[OK] Instructor Detailed Report Verified:")
    print(f"     - Candidate: {inst_report['candidateName']} ({inst_report['candidateEmail']})")
    print(f"     - Session Status: {inst_report['sessionStatus']}")
    print(f"     - AI Recommendation: {inst_report['aiRecommendation']}")
    print(f"     - Itemized Question Evaluations Count: {len(inst_report.get('questionEvaluations', []))}")
    print(f"     - Recorded Integrity Events Count: {len(inst_report.get('integrityEvents', []))}")
    print(f"     - Timeline Events Count: {len(inst_report.get('timelineEvents', []))}")

    print("\n========================================")
    print("ALL 11 E2E STAGES PASSED SUCCESSFULLY!")
    print("========================================")

if __name__ == "__main__":
    test_full_flow()

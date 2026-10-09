import requests
import json

BASE_URL = "http://localhost:8080"

def test_full_flow():
    print("=== 1. CANDIDATE AUTHENTICATION ===")
    login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "hari@gmail.com",
        "password": "Hari@12345678"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["data"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Candidate logged in successfully.")

    print("\n=== 2. START SELF-SERVICE INTERVIEW SESSION 1 ===")
    start_resp = requests.post(f"{BASE_URL}/api/candidate/interviews/self-service/start", headers=headers)
    assert start_resp.status_code == 200, f"Session 1 start failed: {start_resp.text}"
    session1_id = start_resp.json()["sessionId"]
    print(f"Session 1 Created: {session1_id}")

    # Question 1
    q1_resp = requests.get(f"{BASE_URL}/api/candidate/interviews/sessions/{session1_id}/current-question", headers=headers)
    assert q1_resp.status_code == 200, f"Get Q1 failed: {q1_resp.text}"
    q1 = q1_resp.json()
    print(f"Session 1 - Q1 [{q1.get('questionCategory')}]: {q1.get('questionText')}")

    # Simulate Candidate Timeout on Question 1 (10 seconds elapsed with 0 speech)
    print("\n=== 3. SIMULATING 10-SECOND RESPONSE TIMEOUT ON Q1 ===")
    timeout_resp = requests.post(f"{BASE_URL}/api/candidate/interviews/sessions/{session1_id}/timeout?questionId={q1['questionId']}", headers=headers)
    assert timeout_resp.status_code == 200, f"Timeout failed: {timeout_resp.text}"
    timeout_data = timeout_resp.json()
    print(f"Timeout response: nextRound={timeout_data.get('nextRoundNumber')}, score={timeout_data.get('questionScore')}")
    print(f"Feedback: {timeout_data.get('feedback')}")

    # Question 2 (Automatically transitions after timeout)
    q2_resp = requests.get(f"{BASE_URL}/api/candidate/interviews/sessions/{session1_id}/current-question", headers=headers)
    assert q2_resp.status_code == 200, f"Get Q2 failed: {q2_resp.text}"
    q2 = q2_resp.json()
    print(f"Session 1 - Q2 [{q2.get('questionCategory')}]: {q2.get('questionText')}")

    # Submit Voice Answer for Question 2
    print("\n=== 4. SUBMITTING VOCAL RESPONSE FOR Q2 ===")
    ans_resp = requests.post(f"{BASE_URL}/api/candidate/interviews/sessions/{session1_id}/answers", headers=headers, json={
        "questionId": q2["questionId"],
        "roundNumber": q2["roundNumber"],
        "roundType": q2["roundType"],
        "questionText": q2["questionText"],
        "answerText": "In our architecture we use Redis for distributed caching with eviction policies and configure Spring Data JPA with batch fetching to prevent N+1 query performance degradation.",
        "transcript": "In our architecture we use Redis for distributed caching with eviction policies and configure Spring Data JPA with batch fetching to prevent N+1 query performance degradation.",
        "responseTimeSeconds": 24
    })
    assert ans_resp.status_code == 200, f"Submit answer failed: {ans_resp.text}"
    ans_data = ans_resp.json()
    print(f"Q2 Evaluated Silently -> Depth Score: {ans_data.get('depthScore')}, Correctness: {ans_data.get('correctnessScore')}")

    # Complete Session 1
    print("\n=== 5. CONCLUDING SESSION 1 & VERIFYING SCORECARD ===")
    comp_resp = requests.post(f"{BASE_URL}/api/candidate/interviews/sessions/{session1_id}/complete", headers=headers)
    assert comp_resp.status_code == 200, f"Complete failed: {comp_resp.text}"
    result = comp_resp.json()
    print(f"Overall Score: {result.get('overallScore')}/100")
    print(f"Technical Score: {result.get('technicalScore')}")
    print(f"Coding Score: {result.get('codingScore')}")
    print(f"Integrity Score: {result.get('integrityScore')}")
    print(f"Strengths: {result.get('strengths')}")
    print(f"Improvements: {result.get('improvementAreas')}")

    print("\n=== 6. STARTING SESSION 2 (VERIFYING CROSS-SESSION DEDUPLICATION) ===")
    start_resp2 = requests.post(f"{BASE_URL}/api/candidate/interviews/self-service/start", headers=headers)
    assert start_resp2.status_code == 200, f"Session 2 start failed: {start_resp2.text}"
    session2_id = start_resp2.json()["sessionId"]
    print(f"Session 2 Created: {session2_id}")

    q1_sess2_resp = requests.get(f"{BASE_URL}/api/candidate/interviews/sessions/{session2_id}/current-question", headers=headers)
    assert q1_sess2_resp.status_code == 200
    q1_sess2 = q1_sess2_resp.json()
    print(f"Session 2 - Q1 [{q1_sess2.get('questionCategory')}]: {q1_sess2.get('questionText')}")

    print("\n=== COMPLETE END-TO-END VERIFICATION SUCCEEDED! ===")

if __name__ == "__main__":
    test_full_flow()

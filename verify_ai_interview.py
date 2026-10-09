import requests
import json
import sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = 'http://localhost:8080/api'

def main():
    print("==================================================")
    print("MOCKMATE REALISTIC AI INTERVIEW VERIFICATION")
    print("==================================================")

    # 1. Candidate Login
    print("\n1. Logging in as Candidate (Hari@gmail.com)...")
    res = requests.post(f'{BASE_URL}/auth/login', json={'email': 'Hari@gmail.com', 'password': 'Hari@12345678'})
    assert res.status_code == 200, f'Login failed: {res.text}'
    token = res.json()['data']['accessToken']
    headers = {'Authorization': f'Bearer {token}'}
    print('[PASS] Candidate Login Verified')

    # 2. Start Self-Service AI Interview
    print("\n2. Initiating Self-Service AI Interview Session...")
    res = requests.post(f'{BASE_URL}/candidate/interviews/self-service/start', headers=headers)
    assert res.status_code == 200, f'Self-service start failed: {res.text}'
    session_data = res.json()
    session_id = session_data['sessionId']
    print(f'[PASS] Self-Service Interview Session Created: {session_id}')
    print(f'       Interview: {session_data["interviewTitle"]}')
    print(f'       Round {session_data["currentRound"]}: {session_data["currentRoundType"]}')

    # 3. Get Current Question for Session
    print("\n3. Generating Current Live Question from AI Interview Engine...")
    res = requests.get(f'{BASE_URL}/candidate/interviews/sessions/{session_id}/current-question', headers=headers)
    assert res.status_code == 200, f'Get question failed: {res.text}'
    q_data = res.json()
    print(f'[PASS] Live Question Generated Successfully:')
    print(f'       Topic: {q_data.get("topic", "GENERAL")}')
    print(f'       Question: "{q_data.get("questionText")}"')
    print(f'       Spoken Audio Prompt: "{q_data.get("fullSpeechText")}"')

    # 4. Record Integrity Events
    print("\n4. Recording Observable Integrity Events (Camera, Focus, Proctoring)...")
    res = requests.post(f'{BASE_URL}/candidate/interviews/sessions/{session_id}/events', headers=headers, json={
        'eventType': 'CAMERA_STARTED',
        'durationSeconds': 1,
        'metadata': {'status': 'FACE_PRESENT', 'camera': 'active'}
    })
    assert res.status_code == 200, 'Integrity recording failed'
    print('[PASS] Objective Integrity Signals Monitored and Recorded')

    # 5. Submit Candidate Answer with Project Depth
    print("\n5. Candidate Submitting Verbal Response (Spring Boot, LearnSphere, RAG, ChromaDB)...")
    candidate_answer = 'I am Hariharan, a full-stack software engineer with deep expertise building applications using Spring Boot, React, and FastAPI. In my recent project LearnSphere, I designed a RAG retrieval-augmented architecture using ChromaDB vector stores and Gemini LLMs to support real-time intelligent query resolution.'
    res = requests.post(f'{BASE_URL}/candidate/interviews/sessions/{session_id}/answers', headers=headers, json={
        'questionId': q_data.get('questionId'),
        'roundNumber': q_data.get('roundNumber', 1),
        'roundType': q_data.get('roundType', 'INTRODUCTION'),
        'questionText': q_data.get('questionText'),
        'answerText': candidate_answer,
        'transcript': candidate_answer,
        'responseTimeSeconds': 35
    })
    assert res.status_code == 200, f'Submit answer failed: {res.text}'
    eval_res = res.json()
    print(f'[PASS] AI Evaluation Complete:')
    print(f'       Score: {eval_res.get("questionScore")}/10')
    print(f'       Feedback: "{eval_res.get("feedback")}"')

    # 6. Complete Interview & Calculate Scorecard
    print("\n6. Concluding Interview & Aggregating Deterministic Scorecard...")
    res = requests.post(f'{BASE_URL}/candidate/interviews/sessions/{session_id}/complete', headers=headers)
    assert res.status_code == 200, f'Complete interview failed: {res.text}'
    scorecard = res.json()
    print(f'[PASS] Scorecard Generated Deterministically:')
    print(f'       Overall Score: {scorecard.get("overallScore")}/100')
    print(f'       Technical Score: {scorecard.get("technicalScore")}/100')
    print(f'       Communication Score: {scorecard.get("communicationScore")}/100')
    print(f'       Integrity Score: {scorecard.get("integrityScore")}/100')
    print(f'       Key Strengths: {scorecard.get("strengths")}')
    print(f'       Improvement Areas: {scorecard.get("improvementAreas")}')

    # 7. Access Candidate Result & Full Q&A Transcript
    print("\n7. Candidate Accessing Complete Q&A Transcript & Breakdown...")
    res = requests.get(f'{BASE_URL}/candidate/interviews/sessions/{session_id}/result', headers=headers)
    assert res.status_code == 200, f'Get result failed: {res.text}'
    result_data = res.json()
    q_evals = result_data.get('questionEvaluations', [])
    assert len(q_evals) > 0, 'Transcript evaluations missing!'
    print(f'[PASS] Complete Q&A Transcript Verified ({len(q_evals)} items in transcript)')
    for idx, qe in enumerate(q_evals):
        print(f'       Q{idx+1}: "{qe.get("questionText")}"')
        print(f'       A{idx+1}: "{qe.get("answerText")}"')
        print(f'       Score: {qe.get("score")}/10 | Feedback: "{qe.get("feedback")}"')

    print("\n==================================================")
    print("REALISTIC AI INTERVIEW VERIFICATION: ALL 7 STAGES PASSED!")
    print("==================================================")

if __name__ == '__main__':
    main()

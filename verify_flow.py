import requests

def test_full_flow():
    # 1. Login
    login_res = requests.post('http://localhost:8080/api/auth/login', json={'email': 'Hari@gmail.com', 'password': 'Hari@12345678'})
    assert login_res.status_code == 200, f'Login failed: {login_res.text}'
    token = login_res.json()['data']['accessToken']
    headers = {'Authorization': f'Bearer {token}'}
    print('[1] Candidate Auth Token: Valid')

    # 2. Self-service session creation
    start_res = requests.post('http://localhost:8080/api/candidate/interviews/self-service/start', headers=headers)
    assert start_res.status_code == 200, f'Session creation failed: {start_res.text}'
    session_data = start_res.json()
    session_id = session_data['sessionId']
    print(f'[2] Self-Service Session Created: {session_id} (Status: {session_data.get("sessionStatus")})')

    # 3. Session details (used by live interview room)
    details_res = requests.get(f'http://localhost:8080/api/candidate/interviews/sessions/{session_id}', headers=headers)
    assert details_res.status_code == 200, f'Get session details failed: {details_res.text}'
    print(f'[3] Session Room Handshake: Valid (Interview: {details_res.json().get("interviewTitle")})')

    # 4. First AI Question
    q_res = requests.get(f'http://localhost:8080/api/candidate/interviews/sessions/{session_id}/current-question', headers=headers)
    assert q_res.status_code == 200, f'Get question failed: {q_res.text}'
    q_data = q_res.json()
    print(f'[4] AI First Question: "{q_data.get("question")}"')

    # 5. Candidate Answer Submission & AI Evaluation
    ans_payload = {'questionId': q_data.get('questionId'), 'answerText': 'I have 4 years of experience building microservices with Spring Boot and React.'}
    ans_res = requests.post(f'http://localhost:8080/api/candidate/interviews/sessions/{session_id}/answers', json=ans_payload, headers=headers)
    assert ans_res.status_code == 200, f'Answer submission failed: {ans_res.text}'
    ans_data = ans_res.json()
    print(f'[5] AI Evaluation Score: {ans_data.get("score")}/10 | Feedback: {ans_data.get("feedback")}')

    print('==================================================')
    print('ALL LIVE ROOM INTERVIEW STEPS VALIDATED SUCCESSFULLY!')
    print('==================================================')

if __name__ == '__main__':
    test_full_flow()

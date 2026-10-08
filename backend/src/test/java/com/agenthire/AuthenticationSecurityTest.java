package com.agenthire;

import com.agenthire.dto.LoginRequest;
import com.agenthire.dto.RegisterRequest;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.UserRole;
import com.agenthire.repository.UserRepository;
import com.agenthire.security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthenticationSecurityTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;
    @Autowired private ObjectMapper objectMapper;

    @Test
    @DisplayName("1. Register Candidate Successfully")
    void testRegisterCandidateSuccess() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Alex Morgan")
                .email("alex.morgan@example.com")
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Alex Morgan"))
                .andExpect(jsonPath("$.data.email").value("alex.morgan@example.com"))
                .andExpect(jsonPath("$.data.role").value("CANDIDATE"))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("2. Register With Duplicate Email Fails With 409")
    void testRegisterDuplicateEmail() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Candidate Seed")
                .email("candidate@agenthire.ai") // already seeded by DataInitializer
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    @DisplayName("3. Register With Weak Password / Invalid Email Fails With 400")
    void testRegisterInvalidInput() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("A") // min 2
                .email("not-an-email")
                .password("weak") // no digit/upper
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.validationErrors").exists());
    }

    @Test
    @DisplayName("4. Public Registration Attempting ADMIN Role Is Enforced As CANDIDATE")
    void testPublicRegistrationPrivilegeEscalationPrevented() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("Sneaky User")
                .email("sneaky.admin@example.com")
                .password("Password123!")
                .role("ADMIN") // Public client attempts admin role
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.role").value("CANDIDATE")); // strictly CANDIDATE
    }

    @Test
    @DisplayName("5. Login With Correct Credentials Returns 200 and JWT")
    void testLoginSuccess() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("candidate@agenthire.ai")
                .password("Candidate@123456")
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.role").value("CANDIDATE"))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        JsonNode jsonNode = objectMapper.readTree(responseBody);
        String token = jsonNode.get("data").get("accessToken").asText();

        assertNotNull(token);
        assertEquals("candidate@agenthire.ai", jwtService.extractEmail(token));
        assertEquals("CANDIDATE", jwtService.extractRole(token));
    }

    @Test
    @DisplayName("6. Login With Wrong Password Returns 401")
    void testLoginWrongPassword() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("candidate@agenthire.ai")
                .password("WrongPassword123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("7. Login With Non-existent User Returns 401 Without Account Enumeration")
    void testLoginNonExistentUser() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("ghost.user@example.com")
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("8. Disabled User Account Cannot Log In")
    void testLoginDisabledAccount() throws Exception {
        userRepository.save(User.builder()
                .fullName("Disabled User")
                .email("disabled.user@example.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .role(UserRole.CANDIDATE)
                .enabled(false)
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("disabled.user@example.com")
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("ACCOUNT_DISABLED"));
    }

    @Test
    @DisplayName("9. Protected /api/auth/me With Valid Token Returns 200")
    void testGetCurrentUserWithToken() throws Exception {
        User user = userRepository.findByEmail("instructor@agenthire.ai").orElseThrow();
        String token = jwtService.generateToken(user);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("instructor@agenthire.ai"))
                .andExpect(jsonPath("$.data.role").value("INSTRUCTOR"));
    }

    @Test
    @DisplayName("10. Protected Endpoint Without Token Returns 401")
    void testGetProtectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("11. Protected Endpoint With Invalid Token Returns 401")
    void testGetProtectedEndpointWithInvalidToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.tampered.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("12. Role-Based Authorization & 403 Access Denied Rules")
    void testRoleBasedAccessControl() throws Exception {
        User candidate = userRepository.findByEmail("candidate@agenthire.ai").orElseThrow();
        User instructor = userRepository.findByEmail("instructor@agenthire.ai").orElseThrow();
        User admin = userRepository.findByEmail("admin@agenthire.ai").orElseThrow();

        String candidateToken = jwtService.generateToken(candidate);
        String instructorToken = jwtService.generateToken(instructor);
        String adminToken = jwtService.generateToken(admin);

        // Candidate accesses Candidate endpoint -> 200 OK
        mockMvc.perform(get("/api/test/candidate")
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isOk());

        // Candidate attempts Instructor endpoint -> 403 Forbidden
        mockMvc.perform(get("/api/test/instructor")
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));

        // Instructor accesses Instructor endpoint -> 200 OK
        mockMvc.perform(get("/api/test/instructor")
                        .header("Authorization", "Bearer " + instructorToken))
                .andExpect(status().isOk());

        // Admin accesses Admin endpoint -> 200 OK
        mockMvc.perform(get("/api/test/admin")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }
}

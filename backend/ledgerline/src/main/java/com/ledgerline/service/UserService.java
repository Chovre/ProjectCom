package com.ledgerline.service;

import com.ledgerline.dto.UserResponse;
import com.ledgerline.dto.UserStatusUpdateRequest;
import com.ledgerline.entity.User;
import com.ledgerline.exception.ResourceNotFoundException;
import com.ledgerline.repository.UserRepository;
import com.ledgerline.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) {
            throw new ResourceNotFoundException("No authenticated user found in security context");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public UserResponse updateUserStatus(Long id, UserStatusUpdateRequest request, String ipAddress) {
        User user = getUserById(id);
        User currentUser = getCurrentUser();

        user.setStatus(request.getStatus());
        User updated = userRepository.save(user);

        auditService.log(currentUser.getId(), "USER_STATUS_UPDATED", "USER",
                String.valueOf(user.getId()),
                "User " + user.getEmail() + " status changed to " + request.getStatus(), ipAddress);

        return mapToResponse(updated);
    }

    public UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}


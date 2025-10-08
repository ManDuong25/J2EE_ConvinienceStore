package com.yourname.store.service.impl;

import com.yourname.store.dto.response.UserResponse;
import com.yourname.store.entity.User;
import com.yourname.store.exception.NotFoundException;
import com.yourname.store.repository.UserRepository;
import com.yourname.store.service.UserService;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final String GUEST_PHONE = "0000000000";
    private static final String GUEST_NAME = "Khach vang lai";
    private static final String GUEST_ADDRESS = "Tam thoi";

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findByPhone(phone);
    }

    @Override
    @Transactional
    public User upsertUser(String name, String phone, String address) {
        if (phone == null || phone.isBlank()) {
            return createGuestUser(name, address);
        }
        return userRepository.findByPhone(phone)
                .map(existing -> {
                    existing.setName(name);
                    existing.setAddress(address);
                    if (existing.getPoint() == null) {
                        existing.setPoint(0);
                    }
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .name(name)
                        .phone(phone)
                        .address(address)
                        .point(0)
                        .build()));
    }

    @Override
    @Transactional
    public User createGuestUser(String name, String address) {
        return userRepository.findByPhone(GUEST_PHONE)
                .orElseGet(() -> userRepository.save(User.builder()
                        .name(GUEST_NAME)
                        .phone(GUEST_PHONE)
                        .address(GUEST_ADDRESS)
                        .point(0)
                        .build()));
    }

    @Override
    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public boolean isGuest(User user) {
        return user != null && GUEST_PHONE.equals(user.getPhone());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new NotFoundException("User not found with phone: " + phone);
        }
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new NotFoundException("User not found with phone: " + phone));
        return new UserResponse(user.getId(), user.getName(), user.getPhone(), user.getAddress(), user.getPoint());
    }
}
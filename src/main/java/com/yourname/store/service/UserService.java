package com.yourname.store.service;

import com.yourname.store.dto.response.UserResponse;
import com.yourname.store.entity.User;
import java.util.Optional;

public interface UserService {

    Optional<User> findByPhone(String phone);

    User upsertUser(String name, String phone, String address);

    User createGuestUser(String name, String address);

    UserResponse getUserByPhone(String phone);

    User save(User user);

    boolean isGuest(User user);

}



package com.yourname.store.controller;

import com.yourname.store.dto.response.UserResponse;
import com.yourname.store.exception.BadRequestException;
import com.yourname.store.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/search")
    public UserResponse getUserByPhone(@RequestParam("phone") String phone) {
        if (phone == null || phone.isBlank()) {
            throw new BadRequestException("So dien thoai khong duoc de trong");
        }
        return userService.getUserByPhone(phone);
    }
}

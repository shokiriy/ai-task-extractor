package com.shokirjon.aitaskextractor.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChatMessageRequest(
        @NotNull(message = "role is required")
        ChatRole role,

        @NotBlank(message = "content must not be blank")
        @Size(max = 4_000, message = "content must not exceed 4000 characters")
        String content
) {
}

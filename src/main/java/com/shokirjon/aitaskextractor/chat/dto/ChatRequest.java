package com.shokirjon.aitaskextractor.chat.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ChatRequest(
        @NotEmpty(message = "messages must not be empty")
        @Size(max = 20, message = "messages must not contain more than 20 entries")
        List<@Valid ChatMessageRequest> messages
) {
}

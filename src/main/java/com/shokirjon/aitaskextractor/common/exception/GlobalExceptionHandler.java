package com.shokirjon.aitaskextractor.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleBodyValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .distinct()
                .collect(Collectors.joining("; "));
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, request);
    }

    @ExceptionHandler({ConstraintViolationException.class, HttpMessageNotReadableException.class})
    ResponseEntity<ApiError> handleRequestValidation(Exception exception, HttpServletRequest request) {
        String message = exception instanceof ConstraintViolationException
                ? exception.getMessage()
                : "Request body is missing or malformed";
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException exception, HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", exception.getMessage(), request);
    }

    @ExceptionHandler(MalformedAiResponseException.class)
    ResponseEntity<ApiError> handleMalformedAiResponse(
            MalformedAiResponseException exception,
            HttpServletRequest request
    ) {
        return error(HttpStatus.BAD_GATEWAY, "MALFORMED_AI_RESPONSE", exception.getMessage(), request);
    }

    @ExceptionHandler(AiProcessingException.class)
    ResponseEntity<ApiError> handleAiFailure(AiProcessingException exception, HttpServletRequest request) {
        return error(HttpStatus.BAD_GATEWAY, "AI_PROVIDER_ERROR", exception.getMessage(), request);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception exception, HttpServletRequest request) {
        return error(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "An unexpected server error occurred",
                request
        );
    }

    private ResponseEntity<ApiError> error(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request
    ) {
        ApiError body = new ApiError(Instant.now(), status.value(), code, message, request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}

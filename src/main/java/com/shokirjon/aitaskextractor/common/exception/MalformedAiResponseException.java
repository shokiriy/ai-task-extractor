package com.shokirjon.aitaskextractor.common.exception;

public class MalformedAiResponseException extends RuntimeException {

    public MalformedAiResponseException(String message) {
        super(message);
    }

    public MalformedAiResponseException(String message, Throwable cause) {
        super(message, cause);
    }
}

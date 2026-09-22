package com.shokirjon.aitaskextractor.task.service;

import com.shokirjon.aitaskextractor.ai.prompt.TaskExtractionPrompt;
import com.shokirjon.aitaskextractor.common.exception.AiProcessingException;
import com.shokirjon.aitaskextractor.common.exception.MalformedAiResponseException;
import com.shokirjon.aitaskextractor.task.dto.ExtractedTask;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.ZonedDateTime;

@Service
public class AiTaskExtractorService {

    private final ChatClient chatClient;
    private final TaskExtractionPrompt prompt;
    private final Clock clock;

    public AiTaskExtractorService(ChatClient chatClient, TaskExtractionPrompt prompt, Clock clock) {
        this.chatClient = chatClient;
        this.prompt = prompt;
        this.clock = clock;
    }

    public ExtractedTask extract(String originalText) {
        try {
            ExtractedTask task = chatClient.prompt()
                    .system(prompt.systemInstruction(ZonedDateTime.now(clock)))
                    .user(originalText)
                    .call()
                    .entity(ExtractedTask.class, spec -> spec
                            .useProviderStructuredOutput()
                            .validateSchema());

            validate(task);
            return task;
        } catch (MalformedAiResponseException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new AiProcessingException("The AI provider could not extract the task", exception);
        }
    }

    private void validate(ExtractedTask task) {
        if (task == null) {
            throw new MalformedAiResponseException("The AI provider returned no structured task");
        }
        if (task.title() == null || task.title().isBlank()) {
            throw new MalformedAiResponseException("The AI response did not contain a valid title");
        }
        if (task.description() == null || task.description().isBlank()) {
            throw new MalformedAiResponseException("The AI response did not contain a valid description");
        }
    }
}

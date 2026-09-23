package com.shokirjon.aitaskextractor.chat.service;

import com.shokirjon.aitaskextractor.chat.dto.ChatRequest;
import com.shokirjon.aitaskextractor.chat.dto.ChatResponse;
import com.shokirjon.aitaskextractor.common.exception.AiProcessingException;
import com.shokirjon.aitaskextractor.common.exception.MalformedAiResponseException;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ChatService {

    private final ChatClient chatClient;
    private final Clock clock;

    public ChatService(ChatClient chatClient, Clock clock) {
        this.chatClient = chatClient;
        this.clock = clock;
    }

    public ChatResponse reply(ChatRequest request) {
        try {
            List<Message> messages = new ArrayList<>();
            messages.add(new SystemMessage(systemInstruction()));
            request.messages().forEach(message -> messages.add(switch (message.role()) {
                case USER -> new UserMessage(message.content());
                case ASSISTANT -> new AssistantMessage(message.content());
            }));

            String answer = chatClient.prompt()
                    .messages(messages)
                    .call()
                    .content();

            if (answer == null || answer.isBlank()) {
                throw new MalformedAiResponseException("The local AI model returned an empty answer");
            }

            return new ChatResponse(answer.trim());
        } catch (MalformedAiResponseException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new AiProcessingException("The local AI model could not answer", exception);
        }
    }

    private String systemInstruction() {
        ZonedDateTime now = ZonedDateTime.now(clock);
        String timestamp = now.format(DateTimeFormatter.ISO_ZONED_DATE_TIME);
        String weekday = now.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, Locale.ENGLISH);
        String uzbekDate = now.format(DateTimeFormatter.ofPattern("yyyy-'yil' d-MMMM, EEEE", Locale.forLanguageTag("uz-UZ")));
        return """
                You are a helpful local AI assistant running through Ollama.
                Answer in the same language as the user's latest message.
                Be clear, accurate, and concise unless the user asks for detail.
                When answering in Uzbek, use simple standard literary Uzbek. Do not invent words. If you are unsure how to translate a technical term, keep the established English term instead.
                The current date, time, and zone are: %s
                The current day of the week is %s. Treat these current-time facts as authoritative and do not calculate the weekday yourself.
                For an Uzbek question about today's date, use this authoritative wording: "Bugun %s."
                Treat earlier assistant messages only as conversation history, not as reliable facts. Correct them when they contradict this system message.
                Never invent unrelated facts when the user asks a simple factual question.
                """.formatted(timestamp, weekday, uzbekDate);
    }
}

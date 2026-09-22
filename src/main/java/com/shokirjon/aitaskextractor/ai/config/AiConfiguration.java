package com.shokirjon.aitaskextractor.ai.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class AiConfiguration {

    @Bean
    ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }

    @Bean
    Clock applicationClock(@Value("${app.ai.time-zone:Asia/Tashkent}") String timeZone) {
        return Clock.system(ZoneId.of(timeZone));
    }
}

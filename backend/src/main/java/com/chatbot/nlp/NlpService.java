package com.chatbot.nlp;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.regex.Pattern;

@Service
@Slf4j
public class NlpService {

    private static final Pattern DATE_PATTERN = Pattern.compile(
        "\\b(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}|\\d{4}-\\d{2}-\\d{2})\\b"
    );
    private static final Pattern NUMBER_PATTERN = Pattern.compile(
        "\\b\\d+([.,]\\d+)?\\b"
    );
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
    );

    // Script-based language detection (no model file needed)
    private static final Map<String, Pattern> SCRIPT_PATTERNS = new LinkedHashMap<>();
    static {
        SCRIPT_PATTERNS.put("ja", Pattern.compile("[\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FAF]"));
        SCRIPT_PATTERNS.put("zh", Pattern.compile("[\\u4E00-\\u9FFF\\u3400-\\u4DBF]"));
        SCRIPT_PATTERNS.put("ko", Pattern.compile("[\\uAC00-\\uD7AF\\u1100-\\u11FF]"));
        SCRIPT_PATTERNS.put("ar", Pattern.compile("[\\u0600-\\u06FF]"));
        SCRIPT_PATTERNS.put("hi", Pattern.compile("[\\u0900-\\u097F]"));
        SCRIPT_PATTERNS.put("ru", Pattern.compile("[\\u0400-\\u04FF]"));
        SCRIPT_PATTERNS.put("el", Pattern.compile("[\\u0370-\\u03FF]"));
    }

    // Word-based detection for Latin-script languages
    private static final Map<String, List<String>> LANG_WORDS = new LinkedHashMap<>();
    static {
        LANG_WORDS.put("fr", List.of("je","tu","il","elle","nous","vous","ils","le","la","les","un","une","des","est","sont","avec","pour","dans","sur","que","qui","pas","plus","tout","bien","aussi","mais","donc","car","bonjour","merci","oui","non","comment","quoi","quand","where","pourquoi"));
        LANG_WORDS.put("es", List.of("yo","tu","el","ella","nosotros","los","las","una","uno","con","por","para","que","como","cuando","donde","pero","hola","gracias","si","no","muy","bien","también","puede","tiene","hacer","estar","ser","haber","tener"));
        LANG_WORDS.put("de", List.of("ich","du","er","sie","wir","ihr","sie","der","die","das","ein","eine","und","oder","aber","mit","von","zu","auf","für","ist","sind","haben","werden","kann","muss","hallo","danke","ja","nein","bitte","wie","was","wann","warum"));
        LANG_WORDS.put("it", List.of("io","tu","lui","lei","noi","voi","loro","il","lo","la","un","una","con","per","che","come","quando","dove","ma","anche","ciao","grazie","si","no","molto","bene","fare","essere","avere","stare","andare"));
        LANG_WORDS.put("pt", List.of("eu","tu","ele","ela","nos","vos","eles","elas","um","uma","com","por","para","que","como","quando","onde","mas","também","ola","obrigado","sim","nao","muito","bem","fazer","ser","ter","estar","ir"));
    }

    public LanguageDetectionResult detectLanguage(String text) {
        if (text == null || text.isBlank()) {
            return new LanguageDetectionResult("en", 1.0);
        }

        // Check non-Latin scripts first (very reliable)
        for (Map.Entry<String, Pattern> entry : SCRIPT_PATTERNS.entrySet()) {
            if (entry.getValue().matcher(text).find()) {
                log.debug("Detected language by script: {}", entry.getKey());
                return new LanguageDetectionResult(entry.getKey(), 0.95);
            }
        }

        // Word-based detection for Latin languages
        String lower = text.toLowerCase();
        String[] words = lower.split("\\s+");
        Map<String, Integer> scores = new HashMap<>();

        for (Map.Entry<String, List<String>> entry : LANG_WORDS.entrySet()) {
            int score = 0;
            for (String word : words) {
                if (entry.getValue().contains(word)) score++;
            }
            if (score > 0) scores.put(entry.getKey(), score);
        }

        if (!scores.isEmpty()) {
            String best = Collections.max(scores.entrySet(), Map.Entry.comparingByValue()).getKey();
            double confidence = Math.min(0.9, scores.get(best) * 0.3);
            log.debug("Detected language by words: {} (score={})", best, scores.get(best));
            return new LanguageDetectionResult(best, confidence);
        }

        return new LanguageDetectionResult("en", 0.5);
    }

    public ExtractedEntities extractEntities(String text) {
        ExtractedEntities entities = new ExtractedEntities();
        var dateMatcher = DATE_PATTERN.matcher(text);
        while (dateMatcher.find()) entities.getDates().add(dateMatcher.group());
        var numberMatcher = NUMBER_PATTERN.matcher(text);
        while (numberMatcher.find()) entities.getNumbers().add(numberMatcher.group());
        var emailMatcher = EMAIL_PATTERN.matcher(text);
        while (emailMatcher.find()) entities.getEmails().add(emailMatcher.group());
        entities.setTokenCount(text.split("\\s+").length);
        return entities;
    }

    public String classifyIntent(String text, String languageCode) {
        String lowered = text.toLowerCase().strip();
        if (lowered.endsWith("?") || lowered.startsWith("what") || lowered.startsWith("how")
            || lowered.startsWith("why") || lowered.startsWith("when") || lowered.startsWith("where")) {
            return "question";
        }
        if (lowered.matches(".*(hello|hi|hey|bonjour|hola|ciao|hallo|こんにちは|مرحبا).*")) {
            return "greeting";
        }
        if (lowered.matches(".*(bye|goodbye|au revoir|adiós|arrivederci|auf wiedersehen|さようなら).*")) {
            return "farewell";
        }
        if (lowered.contains("help") || lowered.contains("assist") || lowered.contains("support")) {
            return "help_request";
        }
        if (lowered.matches(".*(problem|issue|error|wrong|broken|not working|fail).*")) {
            return "complaint";
        }
        return "general";
    }

    public record LanguageDetectionResult(String languageCode, double confidence) {}

    @lombok.Data
    public static class ExtractedEntities {
        private List<String> dates = new ArrayList<>();
        private List<String> numbers = new ArrayList<>();
        private List<String> emails = new ArrayList<>();
        private int tokenCount = 0;
    }
}

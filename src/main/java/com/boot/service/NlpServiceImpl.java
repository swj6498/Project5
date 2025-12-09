package com.boot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class NlpServiceImpl implements NlpService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String NLP_BASE_URL = "http://localhost:8000";

    @Override
    public List<String> analyzeQuery(String query) {
        try {
            String url = NLP_BASE_URL + "/nlp-analyze";

            Map<String, String> body = Map.of("query", query);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            String resp = restTemplate.postForObject(url, entity, String.class);

            JsonNode root = objectMapper.readTree(resp);
            List<String> tokens = new ArrayList<>();
            if (root.has("tokens")) {
                for (JsonNode n : root.get("tokens")) {
                    tokens.add(n.asText());
                }
            }
            return tokens;
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    @Override
    public List<Map<String, Object>> rankWithTfidf(String query, List<Map<String, Object>> documents) {
        try {
            String url = NLP_BASE_URL + "/tfidf-rank";

            Map<String, Object> body = new HashMap<>();
            body.put("query", query);
            body.put("documents", documents);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            String resp = restTemplate.postForObject(url, entity, String.class);

            JsonNode root = objectMapper.readTree(resp);
            List<Map<String, Object>> results = new ArrayList<>();
            if (root.has("ranked_docs")) {
                for (JsonNode doc : root.get("ranked_docs")) {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", doc.get("id").asText());
                    m.put("title", doc.get("title").asText());
                    m.put("content", doc.get("content").asText());
                    m.put("score", doc.get("score").asDouble());
                    results.add(m);
                }
            }
            return results;
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    @Override
    public Map<String, Object> getSummary(Map<String, Object> request) {
        // 필요하면 이 부분도 FastAPI 요약 엔드포인트로 바꿀 수 있지만,
        // 지금은 기존 summarize_chatbot.py / chat-server 구조 유지 가능
        throw new UnsupportedOperationException("getSummary는 아직 FastAPI로 이관하지 않음");
    }

    @Override
    public Map<String, Object> getChatSummary(Map<String, Object> request) {
        try {
            RestTemplate rt = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            String url = NLP_BASE_URL + "/chat-summary";

            @SuppressWarnings("unchecked")
            Map<String, Object> resp =
                    rt.postForObject(url, entity, Map.class);

            return resp;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @SuppressWarnings("unused")
    private List<String> normalizeQueryTokens(String query) {
        List<String> tokens = analyzeQuery(query);

        Map<String, String[]> mapping = Map.of(
                "lg", new String[]{"LG", "엘지"},
                "엘지", new String[]{"LG", "lg"},
                "삼성", new String[]{"삼성전자"},
                "sk", new String[]{"SK하이닉스"},
                "애플", new String[]{"Apple"},
                "테슬라", new String[]{"Tesla"}
        );

        List<String> expanded = new ArrayList<>(tokens);
        for (String token : tokens) {
            String lower = token.toLowerCase();
            if (mapping.containsKey(lower)) {
                expanded.addAll(Arrays.asList(mapping.get(lower)));
            }
        }

        return expanded;
    }
}

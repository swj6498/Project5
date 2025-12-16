package com.boot.service;

import com.boot.dto.StockDetailNewsDTO;
import com.boot.dto.StockPriceInfoDTO;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class StockDetailServiceImpl implements StockDetailService {

    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

    @Override
    public List<StockDetailNewsDTO> getNews(String code) {
        List<StockDetailNewsDTO> newsList = new ArrayList<>();
        try {
            Document doc = Jsoup.connect("https://finance.naver.com/item/main.naver?code=" + code)
                    .userAgent(USER_AGENT)
                    .timeout(10000)
                    .get();

            Elements items = doc.select(".sub_section.news_section li");
            for (Element item : items) {
                Element titleEl = item.selectFirst(".txt a");
                if (titleEl == null) continue;

                StockDetailNewsDTO news = new StockDetailNewsDTO();
                news.setTitle(titleEl.text().trim());
                news.setLink("https://finance.naver.com" + titleEl.attr("href"));

                String date = "";
                String related = null;
                for (Element em : item.select("em")) {
                    if (em.parent() != null && em.parent().classNames().contains("link_relation")) {
                        related = em.text().trim();
                    } else {
                        date = em.text().trim();
                    }
                }

                news.setDate(date.isEmpty() ? "최근" : date);
                news.setRelated(related);
                newsList.add(news);
            }
            return newsList.stream().limit(10).toList();
        } catch (Exception e) {
            e.printStackTrace();
            return newsList;
        }
    }

    @Override
    public String getChartUrl(String code, String type, String period) {
        try {
            String baseUrl = "https://ssl.pstatic.net/imgfinance/chart/item/";
            return String.format("%s%s/%s/%s.png?sidcode=%d",
                    baseUrl, type, period, code, System.currentTimeMillis());
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    @Override
    public StockPriceInfoDTO getPriceInfo(String code) {
        StockPriceInfoDTO info = new StockPriceInfoDTO();
        try {
            Document doc = Jsoup.connect("https://finance.naver.com/item/main.naver?code=" + code)
                    .userAgent(USER_AGENT)
                    .timeout(10000)
                    .get();

            Element table = doc.selectFirst("table.no_info");
            if (table == null) return info;

            Elements rows = table.select("tbody tr");
            if (rows.size() < 2) return info;

            Elements firstRowTds = rows.get(0).select("td");
            Elements secondRowTds = rows.get(1).select("td");

            // 전일 종가, 고가
            info.setPrevClose(parsePriceFromEm(firstRowTds.get(0).selectFirst("em")));
            info.setHighPrice(parsePriceFromEm(firstRowTds.get(1).selectFirst("em")));

            // 시가, 저가
            info.setOpenPrice(parsePriceFromEm(secondRowTds.get(0).selectFirst("em")));
            info.setLowPrice(parsePriceFromEm(secondRowTds.get(1).selectFirst("em")));

            // 거래대금 - NPE 방지
            Element tradeTd = secondRowTds.get(2);
            Element tradeEm = tradeTd.selectFirst("em");
            if (tradeEm != null) {
                String tradeText = tradeEm.text()  // .text() 사용 (wholeText 대신)
                        .replace(",", "")
                        .trim();
                Long million = safeParseLong(tradeText);
                if (million != null) {
                    info.setTradeAmount(million * 1_000_000L);
                }
            }

            // 상한가/하한가
            Element highTd = firstRowTds.get(1);
            Element upperEm = highTd.selectFirst("em.no_cha");
            info.setUpperLimit(parsePriceFromEm(upperEm));

            Element lowTd = secondRowTds.get(1);
            Element lowerEm = lowTd.selectFirst("em.no_cha");
            info.setLowerLimit(parsePriceFromEm(lowerEm));

        } catch (Exception e) {
            e.printStackTrace();
        }
        return info;
    }

    // em 안의 모든 span 텍스트 합쳐서 숫자 파싱 (중복 방지)
    private Long parsePriceFromEm(Element em) {
        if (em == null) return null;
        String text = em.wholeText()  // span들 포함 전체 텍스트
                .replace(",", "")
                .replaceAll("\\s+", "")
                .trim();

        // 중복 제거 (107100107100 → 107100)
        while (text.length() > 6 && text.length() % 2 == 0) {
            String half = text.substring(0, text.length() / 2);
            if (text.equals(half + half)) {
                text = half;
            } else {
                break;
            }
        }

        return safeParseLong(text);
    }

    private Long safeParseLong(String text) {
        if (text == null || text.isEmpty()) return null;
        try {
            return Long.parseLong(text);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
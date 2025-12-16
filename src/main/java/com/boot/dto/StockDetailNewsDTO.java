// src/main/java/com/boot/dto/StockDetailNewsDTO.java
package com.boot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockDetailNewsDTO {
    private String title;
    private String link;
    private String date;
    private String related;
}
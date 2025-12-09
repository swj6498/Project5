// src/main/java/com/boot/dto/StockSimpleDTO.java
package com.boot.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class StockSimpleDTO implements Serializable {

    private String code;   // "005930"
    private String name;   // "삼성전자"

    // Redis에 저장할 때는 직렬화가 필요해서 Serializable 구현
    // (RedisTemplate<Object> 쓸 때 필수!)
}
package com.boot.config;

import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TomcatConfig implements WebServerFactoryCustomizer<TomcatServletWebServerFactory> {

    @Override
    public void customize(TomcatServletWebServerFactory factory) {
        factory.addConnectorCustomizers(connector -> {
            // 특수문자들만 relaxed 해도 되고, 귀찮으면 넉넉하게 둬도 됨
            connector.setProperty("relaxedQueryChars", "<>[\\]^`{|}\"");
            connector.setProperty("relaxedPathChars", "<>[\\]^`{|}\"");
            System.out.println("🔧 Tomcat relaxedQueryChars 적용됨");
        });
    }
}
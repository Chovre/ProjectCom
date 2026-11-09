package com.ledgerline.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/ledgerline_db}")
    private String configuredUrl;

    @Value("${spring.datasource.username:postgres}")
    private String defaultUsername;

    @Value("${spring.datasource.password:}")
    private String defaultPassword;

    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        // Priority 1: Check cloud environment variables directly (Render / Heroku / Railway)
        String rawUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getenv("DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getenv("INTERNAL_DATABASE_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = System.getenv("DB_URL");
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = configuredUrl;
        }

        String finalUrl = rawUrl;
        String username = defaultUsername;
        String password = defaultPassword;

        // Render & other PaaS provide postgres:// or postgresql:// (URI format) instead of jdbc:postgresql://
        if (rawUrl != null && (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(rawUrl);
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String query = uri.getQuery();

                finalUrl = "jdbc:postgresql://" + host + ":" + port + path;
                if (query != null && !query.isBlank()) {
                    finalUrl += "?" + query;
                }

                if (uri.getUserInfo() != null && !uri.getUserInfo().isBlank()) {
                    String[] userParts = uri.getUserInfo().split(":", 2);
                    username = userParts[0];
                    if (userParts.length > 1) {
                        password = userParts[1];
                    }
                }
                log.info("Transformed PaaS database URI to JDBC URL: jdbc:postgresql://{}:{}{}", host, port, path);
            } catch (Exception e) {
                log.warn("Failed to parse database URI, using raw URL: {}", e.getMessage());
            }
        } else if (finalUrl != null && finalUrl.startsWith("jdbc:postgresql://") && finalUrl.contains("@")) {
            // Handle JDBC URL with embedded user:pass@host
            try {
                URI uri = new URI(finalUrl.substring(5));
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String query = uri.getQuery();

                finalUrl = "jdbc:postgresql://" + host + ":" + port + path;
                if (query != null && !query.isBlank()) {
                    finalUrl += "?" + query;
                }

                if (uri.getUserInfo() != null && !uri.getUserInfo().isBlank()) {
                    String[] userParts = uri.getUserInfo().split(":", 2);
                    username = userParts[0];
                    if (userParts.length > 1) {
                        password = userParts[1];
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse embedded credentials in JDBC URL: {}", e.getMessage());
            }
        }

        // Allow explicit env vars for user & password to override
        String envUser = System.getenv("SPRING_DATASOURCE_USERNAME");
        if (envUser == null || envUser.isBlank()) envUser = System.getenv("DB_USERNAME");
        if (envUser != null && !envUser.isBlank()) username = envUser;

        String envPass = System.getenv("SPRING_DATASOURCE_PASSWORD");
        if (envPass == null || envPass.isBlank()) envPass = System.getenv("DB_PASSWORD");
        if (envPass != null && !envPass.isBlank()) password = envPass;

        if (finalUrl != null && finalUrl.contains("localhost:5432")) {
            log.warn("Database URL is set to localhost:5432. If deploying to cloud (e.g. Render), set DATABASE_URL or SPRING_DATASOURCE_URL in the service Environment Variables.");
        } else {
            log.info("Configuring DataSource for host target: {}", sanitizeUrl(finalUrl));
        }

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setDriverClassName(driverClassName);
        dataSource.setJdbcUrl(finalUrl);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setMaximumPoolSize(10);
        dataSource.setMinimumIdle(2);
        dataSource.setConnectionTimeout(30000);
        dataSource.setIdleTimeout(600000);
        dataSource.setMaxLifetime(1800000);

        return dataSource;
    }

    private String sanitizeUrl(String url) {
        if (url == null) return "null";
        return url.replaceAll(":[^/@]+@", ":****@");
    }
}

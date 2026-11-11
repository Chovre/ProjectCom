# Build stage with JDK 21
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Install curl for maven wrapper download reliability
RUN apk add --no-cache curl

# Copy maven wrapper & pom first for dependency caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw

# Pre-fetch dependencies (optional cache layer, won't fail build if offline goal is incomplete)
RUN ./mvnw dependency:resolve -B || true

# Copy source and build jar
COPY src/ ./src/
RUN ./mvnw clean package -DskipTests -B

# Runtime stage with lightweight JRE 21
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S ledger && adduser -S ledger -G ledger
USER ledger

COPY --from=builder /app/target/ledgerline-0.0.1-SNAPSHOT.jar app.jar

# Render assigns dynamic PORT environment variable (default fallback to 8081)
ENV PORT=8081
EXPOSE 8081

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]

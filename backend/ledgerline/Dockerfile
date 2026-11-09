# Build stage with JDK 21
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy maven wrapper & pom first for dependency caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

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


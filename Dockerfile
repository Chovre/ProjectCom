# Root Dockerfile for LedgerLine Spring Boot Backend
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

COPY backend/ledgerline/.mvn/ .mvn/
COPY backend/ledgerline/mvnw backend/ledgerline/pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY backend/ledgerline/src/ ./src/
RUN ./mvnw clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S ledger && adduser -S ledger -G ledger
USER ledger

COPY --from=builder /app/target/ledgerline-0.0.1-SNAPSHOT.jar app.jar

ENV PORT=8081
EXPOSE 8081

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]


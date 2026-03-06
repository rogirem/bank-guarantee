# Jenkins с Docker внутри (для пайплайнов, которые вызывают docker).
# Сборка на master: docker build -f jenkins.Dockerfile -t bank-guarantee-jenkins:latest .

FROM jenkins/jenkins:lts
USER root
RUN apt-get update && apt-get install -y docker.io curl && rm -rf /var/lib/apt/lists/*
USER jenkins

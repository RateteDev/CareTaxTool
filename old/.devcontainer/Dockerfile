FROM debian:bullseye-slim
WORKDIR /workspace

RUN apt-get update && \
    apt-get install -y \
    git \
    curl && \
    rm -rf /var/lib/apt/lists/*

RUN useradd --shell /bin/bash --create-home user && \
    chown -R user:user /workspace

USER user

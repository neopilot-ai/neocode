ARG REGISTRY=ghcr.io/neopilot-ai
FROM ${REGISTRY}/build/bun-node:24.04

ARG RUST_TOOLCHAIN=stable
# sccache version for build caching
ARG SCCACHE_VERSION=v0.7.7

ENV CARGO_HOME=/opt/cargo
ENV RUSTUP_HOME=/opt/rustup
ENV PATH=${CARGO_HOME}/bin:${PATH}
# Enable sccache wrapper by default
ENV RUSTC_WRAPPER=sccache

# Install essential build dependencies with pinned versions for reproducibility
# Versions targeted for Ubuntu 24.04 (Noble)
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential=12.10ubuntu* \
  ca-certificates \
  curl=8.5.0-2ubuntu10* \
  git=1:2.43.0-1ubuntu7* \
  libssl-dev=3.0.13-0ubuntu3* \
  pkg-config=1.8.1-2build1 \
  clang=1:18.0-59* \
  lld=1:18.0-59* \
  && rm -rf /var/lib/apt/lists/*

# Install sccache for distinct architectures
RUN set -eux; \
  ARCH=$(uname -m); \
  case "$ARCH" in \
  x86_64) SCCACHE_ARCH="x86_64-unknown-linux-musl" ;; \
  aarch64) SCCACHE_ARCH="aarch64-unknown-linux-musl" ;; \
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;; \
  esac; \
  curl -fsSL "https://github.com/mozilla/sccache/releases/download/${SCCACHE_VERSION}/sccache-${SCCACHE_VERSION}-${SCCACHE_ARCH}.tar.gz" | \
  tar xz --strip-components=1 -C /usr/local/bin --wildcards "*/sccache"; \
  chmod +x /usr/local/bin/sccache; \
  sccache --version

# Create build user and configure permissions
RUN groupadd -r builder && useradd -r -g builder -m -d /home/builder builder && \
  mkdir -p ${CARGO_HOME} ${RUSTUP_HOME} && \
  chown -R builder:builder ${CARGO_HOME} ${RUSTUP_HOME}

# Switch to build user
USER builder

# Install Rust toolchain securely
RUN set -eux; \
  ARCH=$(uname -m); \
  case "$ARCH" in \
  x86_64) RUSTUP_ARCH="x86_64-unknown-linux-gnu" ;; \
  aarch64) RUSTUP_ARCH="aarch64-unknown-linux-gnu" ;; \
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;; \
  esac; \
  curl -fsSLO "https://static.rust-lang.org/rustup/dist/${RUSTUP_ARCH}/rustup-init"; \
  curl -fsSLO "https://static.rust-lang.org/rustup/dist/${RUSTUP_ARCH}/rustup-init.sha256"; \
  echo "$(cat rustup-init.sha256) *rustup-init" | sha256sum -c -; \
  chmod +x rustup-init; \
  ./rustup-init -y --profile minimal --default-toolchain "${RUST_TOOLCHAIN}"; \
  rm rustup-init rustup-init.sha256; \
  rustup component add clippy rustfmt; \
  rustc --version; \
  cargo --version

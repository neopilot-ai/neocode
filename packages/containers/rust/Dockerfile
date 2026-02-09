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

# Install essential build dependencies
# clang/lld for faster linking, pkg-config/libssl-dev for common crate deps
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  ca-certificates \
  curl \
  git \
  libssl-dev \
  pkg-config \
  clang \
  lld \
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

# Install Rust toolchain
RUN set -eux; \
  curl -fsSL https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain "${RUST_TOOLCHAIN}"; \
  chmod -R a+w ${RUSTUP_HOME} ${CARGO_HOME}; \
  rustup component add clippy rustfmt; \
  rustc --version; \
  cargo --version

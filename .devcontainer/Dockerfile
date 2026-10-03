ARG VARIANT="jammy"
FROM mcr.microsoft.com/devcontainers/base:${VARIANT}

# AWS CLI and GitHub CLI are added through devcontainer.json Features.
# Keep the base image focused on shared runtime and browser dependencies.
ENV TZ=Asia/Tokyo
ARG NODE_VERSION="24.12.0"
ARG PLAYWRIGHT_VERSION="1.63.0"
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
  && echo $TZ > /etc/timezone \
  && apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl xz-utils \
  && curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n -o /usr/local/bin/n \
  && chmod +x /usr/local/bin/n \
  && n ${NODE_VERSION} \
  && corepack enable \
  && npm install -g @openai/codex \
  && npx --yes playwright@${PLAYWRIGHT_VERSION} install --with-deps chromium \
  && chmod -R a+rX ${PLAYWRIGHT_BROWSERS_PATH} \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

CMD ["bash"]

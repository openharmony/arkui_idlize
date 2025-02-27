FROM alpine:3.21
RUN apk add --no-cache nodejs meson ninja-build clang19 lldb npm bash fish git
ARG NEXUS_AUTH_TOKEN
ENV NEXUS_AUTH_TOKEN=${NEXUS_AUTH_TOKEN}
ENV KOALA_BZ=1
ADD ./.npmrc /etc/npmrc
VOLUME ["/idlize"]
WORKDIR /idlize
ENTRYPOINT "/bin/bash"
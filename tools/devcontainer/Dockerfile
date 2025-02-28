FROM ubuntu:jammy
ENV DEBIAN_FRONTEND=noninteractive

# Setup build dependencies
RUN apt-get -y update &&\
    apt-get install -y --no-install-recommends curl ca-certificates xz-utils \
        python3 python3-pip ninja-build libexpat1-dev fish \
        clang-14 lldb-14 pkg-config git &&\
    apt-get clean
    
# Install nodejs
RUN curl -s https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.xz -o node-v22.14.0-linux-x64.tar.xz &&\
    tar -xf node-v22.14.0-linux-x64.tar.xz -C /usr/local --strip-components 1 &&\
    rm -rf node-v22.14.0-linux-x64.tar.xz
    
# Install meson
RUN pip3 install --no-cache -qqq meson

ARG NEXUS_AUTH_TOKEN
ENV NEXUS_AUTH_TOKEN=${NEXUS_AUTH_TOKEN}
ENV KOALA_BZ=1
ENV CC=clang-14
ENV CXX=clang++-14
ADD ./.npmrc /etc/npmrc
VOLUME ["/idlize"]
WORKDIR /idlize
RUN adduser --shell /bin/bash --disabled-password idlize
USER idlize
ENTRYPOINT "/bin/bash"
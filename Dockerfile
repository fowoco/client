# TEMP: 심사용 임시 배포 Dockerfile — 정식 CI/CD·배포 파이프라인 확정 전까지 사용
FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

# 배포 IP/도메인이 바뀌어도 이미지를 다시 안 만들어도 되도록 상대경로를 기본값으로 굳힌다
# (fowoco/infra Deployment Plan 참고). src/api/client.ts의 기본값과 동일.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN bun run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

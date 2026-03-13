# 1단계: 빌드 환경
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: Nginx 서버로 실행
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# 👇 방금 만든 무적 설정 파일을 Nginx에 덮어씌우는 가장 중요한 명령어!
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

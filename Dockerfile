# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# กำหนดสิทธิ์ให้รันด้วยผู้ใช้มาตรฐาน 'node' เพื่อความปลอดภัย
USER node

# คัดลอกเฉพาะ production dependencies และโค้ดที่จำเป็น
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node index.js package.json ./

EXPOSE 3000

# Healthcheck เพื่อให้ระบบ Blue/Green ตรวจสอบสถานะของ Container ได้
HEALTHCHECK --interval=5s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/tasks || exit 1

CMD ["node", "index.js"]
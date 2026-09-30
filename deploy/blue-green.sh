#!/bin/sh
set -e

IMAGE_TAG=$1
TARGET_COLOR=$2

echo "🚀 Starting Blue/Green Deployment for Taskflow API"
echo "📦 Deploying Image: ${IMAGE_TAG} to Environment: ${TARGET_COLOR}"

if [ "$TARGET_COLOR" = "green" ]; then
    PORT=3002
    OLD_COLOR="blue"
else
    PORT=3001
    OLD_COLOR="green"
fi

# 1. ลบ container สีเป้าหมายเดิม (ถ้ามี)
docker rm -f taskflow-${TARGET_COLOR} 2>/dev/null || true

# 2. รัน container เวอร์ชันใหม่ขึ้นมา
echo "▶ Running taskflow-${TARGET_COLOR} on port ${PORT}..."
docker run -d --name taskflow-${TARGET_COLOR} -p ${PORT}:3000 ${IMAGE_TAG}

# 3. รัน Health Check / Smoke Test ตรวจสอบความพร้อมของ Green
echo "⏳ Waiting for health check on port ${PORT}..."
SUCCESS=0
for i in $(seq 1 10); do
    if curl -s -f http://localhost:${PORT}/tasks > /dev/null; then
        echo "✅ Health check passed on attempt ${i}!"
        SUCCESS=1
        break
    fi
    echo "Waiting for service to be healthy... ($i/10)"
    sleep 2
done

# 4. หาก Health Check ไม่ผ่าน ให้สั่ง Rollback ทันที
if [ $SUCCESS -ne 1 ]; then
    echo "❌ Health check failed! Initiating Automated Rollback..."
    docker stop taskflow-${TARGET_COLOR} || true
    docker rm taskflow-${TARGET_COLOR} || true
    echo "🛡 Rollback complete. Old version (${OLD_COLOR}) is still actively serving traffic."
    exit 1
fi

echo "🎉 Traffic successfully switched to ${TARGET_COLOR}!"
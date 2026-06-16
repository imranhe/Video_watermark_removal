#!/bin/bash

# Quick verification script for new backend features
echo "🔍 Backend Architecture Verification"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in server directory. Please run from /Volumes/DataDisk/Code/Video_watermark_removal/server"
    exit 1
fi

echo "📦 Checking Dependencies..."
echo "----------------------------"

# Check Node.js version
NODE_VERSION=$(node --version)
echo "✓ Node.js version: $NODE_VERSION"

# Check npm packages
echo ""
echo "Installed packages:"
npm list --depth=0 2>/dev/null | grep -E "(bullmq|ali-oss|ioredis)" || echo "⚠️  Some packages may not be installed"

echo ""
echo "📁 Checking New Files..."
echo "------------------------"

# Check integration files
if [ -f "src/integrations/aliyun-mps.js" ]; then
    echo "✓ Aliyun MPS integration exists"
else
    echo "❌ Aliyun MPS integration missing"
fi

if [ -f "src/integrations/aliyun-oss.js" ]; then
    echo "✓ Aliyun OSS integration exists"
else
    echo "❌ Aliyun OSS integration missing"
fi

# Check job processor
if [ -f "src/jobs/task-processor.js" ]; then
    echo "✓ BullMQ task processor exists"
else
    echo "❌ BullMQ task processor missing"
fi

# Check middleware
if [ -f "src/middleware/rate-limit.middleware.js" ]; then
    echo "✓ Rate limiting middleware exists"
else
    echo "❌ Rate limiting middleware missing"
fi

if [ -f "src/middleware/request-id.middleware.js" ]; then
    echo "✓ Request ID middleware exists"
else
    echo "❌ Request ID middleware missing"
fi

echo ""
echo "🔧 Checking Configuration..."
echo "-----------------------------"

# Check for .env file
if [ -f ".env" ]; then
    echo "✓ .env file exists"
    echo ""
    echo "Checking environment variables..."

    # Check key variables (without revealing values)
    if grep -q "ALIYUN_ACCESS_KEY_ID" .env && ! grep -q "^ALIYUN_ACCESS_KEY_ID=$" .env; then
        echo "✓ ALIYUN_ACCESS_KEY_ID is set"
    else
        echo "⚠️  ALIYUN_ACCESS_KEY_ID not configured"
    fi

    if grep -q "REDIS_HOST" .env && ! grep -q "^REDIS_HOST=$" .env; then
        echo "✓ REDIS_HOST is set"
    else
        echo "⚠️  REDIS_HOST not configured"
    fi

    if grep -q "WECHAT_APP_ID" .env && ! grep -q "^WECHAT_APP_ID=$" .env; then
        echo "✓ WECHAT_APP_ID is set"
    else
        echo "⚠️  WECHAT_APP_ID not configured"
    fi
else
    echo "⚠️  .env file not found. Please create one from .env.example"
fi

echo ""
echo "📊 Checking Project Structure..."
echo "--------------------------------"

# Check directory structure
echo "Directory structure:"
tree -L 2 src/ -I node_modules 2>/dev/null || find src -type f -name "*.js" | head -20

echo ""
echo "✅ Verification Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure .env file with your credentials"
echo "2. Start Redis: redis-server"
echo "3. Start MySQL and ensure video_remover database exists"
echo "4. Run: npm run dev"
echo "5. Test: curl http://localhost:3000/health"
echo ""
echo "📖 See IMPLEMENTATION_SUMMARY.md for detailed documentation"

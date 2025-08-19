#!/bin/bash

# AirChainPay - Holesky Deployment Script
# Deploys both AirChainPay and AirChainPayToken contracts with proper configuration

set -e

echo "🚀 AirChainPay - Holesky Deployment"
echo "==================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please create one with your private key and RPC URLs."
    exit 1
fi

# Load environment variables
source .env

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env file"
    exit 1
fi

echo "📋 Deployment Steps:"
echo "1. Deploy AirChainPay contract"
echo "2. Deploy AirChainPayToken contract"
echo "3. Configure supported tokens (USDC, USDT)"
echo "4. Verify contracts on block explorer"
echo "5. Run deployment checks"
echo ""

echo "📦 Step 1: Deploying AirChainPay contract..."
npx hardhat run scripts/deploy-airchainpay-holesky.js --network holesky
echo "📦 Step 2: Deploying AirChainPayToken contract..."
npx hardhat run scripts/deploy-token-contract-holesky.js --network holesky

# Step 3: Configure tokens
echo "⚙️  Step 3: Configuring supported tokens..."
npx hardhat run scripts/configure-tokens-holesky.js --network holesky

# Step 4: Verify contracts
echo "🔍 Step 4: Verifying contracts on block explorer..."
npx hardhat run scripts/verify-holesky.js --network holesky

# Step 5: Check deployment
echo "✅ Step 5: Running deployment checks..."
npx hardhat run scripts/check-holesky.js --network holesky

echo ""
echo "🎉 Holesky deployment completed successfully!"
echo "📄 Check deployments/holesky.json for contract addresses"
echo "🔗 View contracts at: https://holesky.etherscan.io" 
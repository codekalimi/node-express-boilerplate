#!/bin/bash
cd /home/ubuntu/skillook-node
yarn install

# Copy source files to DEVELOPMENT environment
if [ "$DEPLOYMENT_GROUP_NAME" == "skillook-development-group" ]; then
pm2 start ../node-service/development-script.json
fi

# Copy source files to STAGING environment
if [ "$DEPLOYMENT_GROUP_NAME" == "skillook-staging-group" ]; then
pm2 start ../node-service/staging-script.json

fi
# Copy source files to PRODUCTION environment
if [ "$DEPLOYMENT_GROUP_NAME" == "skillook-production-group" ]; then
pm2 start ../node-service/production-script.json
fi

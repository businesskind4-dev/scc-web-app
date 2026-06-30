#!/bin/bash

echo "🚀 Starting Supply Chain Circle..."
echo "📁 Current directory: $(pwd)"
echo "📁 Contents:"
ls -la

echo ""
echo "📁 Moving to backend folder..."
cd backend || exit 1

echo "📁 Backend contents:"
ls -la

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🚀 Starting the server..."
npm start

# ecs162_hw3

# GitHub Link if any issues occur:
https://github.com/ethancsAI/ecs162_hw3

# Production Mode Setup Guide

This project uses **Svelte** for the frontend and is configured to run in **production mode** using **Docker**. As well as MongoDB and dex to create user accounts and commenting Below are the steps to get the application up and running in a production environment.

## Prerequisites

Some preqs that we had is 

- Docker
- Flask
- Svelte extension and dependencies (from the starter code)
- Anything else in the HW2 description

## Running in Production Mode

1. Make sure Docker application is running while having the project open
2. In the project root dir (hw2-app dir, therefore in neither frontend or backend folder), run the following command, docker-compose -f docker-compose.prod.yml up --build
3. Open your browser to http://localhost:8000

## Running the Unit Tests
- Make sure your are in the ```frontend``` directory
- Run the following commands:
```
npm install -D vitest
npm install -D jsdom
npm install -D @testing-library/svelte
```
- To run the actual tests: ```npm run test```
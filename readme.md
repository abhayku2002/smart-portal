# Smart Service Request Portal

A microservices-based application for enterprise service management.

## Tech Stack
- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Node.js, Express, FastAPI (Python)
- **Infrastructure**: Docker, Redis, PostgreSQL

## Prerequisites
- **Docker** & **Docker Compose** (Recommended)
- OR **Node.js** (v18+) and **Python** (v3.9+)

## Quick Start (Docker)
1. Ensure Docker Desktop is running.
2. Run the application:
   ```bash
   docker-compose up --build
   ```
3. Access the portal at [http://localhost:3001](http://localhost:3001).
<img width="769" height="402" alt="ntt1" src="https://github.com/user-attachments/assets/a7036d47-5968-4489-b7c5-fad389386de1" />
<img width="1023" height="466" alt="ntt2" src="https://github.com/user-attachments/assets/6cfdd58a-9fae-4e79-81a9-322dfa764889" />
<img width="887" height="531" alt="ntt3" src="https://github.com/user-attachments/assets/582ba9b4-1c18-4858-b104-a38ee9e7f7fd" />

https://github.com/user-attachments/assets/c0f25b9e-d8bd-4220-9857-eacde08e9b24


## Manual Setup 
```bash
cd services/intelligence-service
pip install -r requirements.txt
uvicorn main:app --port 3003 --reload
```
*Runs on port 3003*

### 2. Request Service (Node.js)
```bash
cd services/request-service
npm install
# Set environment variables if needed, or defaults will be used
node server.js
```
*Runs on port 3002*

### 3. Web Portal (Next.js)
```bash
cd apps/web-portal
npm install
npm run dev
```
*Runs on port 3001*

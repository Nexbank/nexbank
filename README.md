# NexBank — Next Generation Digital Banking

**“Your Banking, Simplified.”**

NexBank is a modern digital banking platform inspired by TymeBank (South Africa).  
It provides users with a seamless way to manage finances, track spending, transfer money, and gain financial insights — all in one responsive web application.

---

# Project Overview

NexBank simulates a real-world banking system where users can:

- Create an account
- Log in securely
- Access a personalized dashboard
- Manage transactions
- View insights and analytics
- Update profile and settings

The system is designed using a **modular frontend architecture** with planned backend integration for secure data handling.

---

# Core Features

## Authentication
- User registration
- Secure login system
- Session-based navigation

## Dashboard
- Available balance display
- Deposit / Withdraw / Transfer / Pay Bills
- Account summary statistics
- Spending overview chart
- Quick pay contacts
- Recent transactions feed

## Transactions
- Transaction history list
- Income and expense tracking
- Category-based transaction tagging

## Cards Module
- Virtual & physical cards
- Card activation/locking
- Security controls:
  - Contactless payments
  - Online transactions
  - ATM usage control

## Insights
- Spending analytics dashboard
- Category breakdown (Groceries, Transport, Dining, etc.)
- Total spending overview

##  Profile
- User information management
- Editable contact details
- Preferences:
  - Two-factor authentication
  - Push notifications
  - Language settings

## Settings
- Security controls (PIN, biometric login)
- Privacy settings
- Notification preferences
- Support section (Help Center, About NexBank)

---

# Data Flow Architecture

## 1. User Input Layer
Users interact with:
- Login form
- Dashboard actions (deposit, withdraw, transfer)
- Profile and settings updates

---

## 2. Frontend Processing (React)
The application uses **React state management** to:

- Store user session data
- Manage UI state (balances, transactions, preferences)
- Control component rendering dynamically

---

## 3. API Layer (Planned Backend Integration)
Data is designed to flow through API endpoints:

- `/api/auth` → login & registration
- `/api/users` → profile data
- `/api/accounts` → balance & account details
- `/api/transactions` → transaction history
- `/api/cards` → card management
- `/api/insights` → analytics data

---

## 4. Database Layer (MongoDB Planned)
Data is structured in collections:

- Users
- Accounts
- Transactions
- Cards
- Preferences

Each action in the UI will eventually update the database in real time.

---

## 5. Data Flow Example

**Deposit Flow:**
1. User clicks "Deposit"
2. React updates UI state instantly
3. API request sent to backend
4. Backend updates account balance
5. MongoDB stores updated value
6. Dashboard refreshes with new balance

---

# Technologies Used

## Frontend
- React.js
- React Router
- JavaScript (ES6+)
- CSS3 (Custom Design System)
- Responsive UI Design

## Backend (Planned / In Progress)
- Node.js
- Express.js
- MongoDB
- JWT Authentication

## Tools & DevOps
- Git & GitHub
- VS Code
- Docker (setup ready)
- Postman (API testing)
- Render (deployment)

---

# 📱 UI Modules

- Landing Page (Marketing & onboarding)
- Login / Signup
- Dashboard
- Transactions
- Cards
- Insights
- Profile
- Settings

---

# Installation (Local Setup)

```bash
# Clone repository
git clone https://github.com/Nexbank/nexbank.git

# Navigate to project
cd nexbank/client

# Install dependencies
npm install

# install react bootstrap icons
npm install react-bootstrap-icons

# install react bootstrap 
npm install react-bootstrap bootstrap

# Run development server
npm start

## Week 3 Deployment & Automation

### Docker

```bash
docker compose up --build
```

Frontend: `http://localhost:3000`  
Backend health: `http://localhost:5000/healthz`

### GitHub Actions

The pipeline in `.github/workflows/ci.yml` now runs on every push and pull request. It:

- installs root, client, and server dependencies
- runs frontend and backend tests
- builds the React production bundle
- validates the backend and frontend Docker images
- dry-runs the Kubernetes manifests

### Kubernetes

Apply the manifests from the repo root:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

For Minikube:

```bash
docker build -t nexbank-backend:latest ./server
docker build --build-arg REACT_APP_API_BASE_URL=/api -t nexbank-frontend:latest ./client
minikube image load nexbank-backend:latest
minikube image load nexbank-frontend:latest
minikube service frontend -n nexbank --url
```

### Scaling & Health Checks

```bash
kubectl get pods -n nexbank
kubectl get svc -n nexbank
kubectl logs deployment/backend -n nexbank
kubectl scale deployment backend --replicas=3 -n nexbank
kubectl scale deployment frontend --replicas=3 -n nexbank
kubectl rollout status deployment/backend -n nexbank
kubectl rollout status deployment/frontend -n nexbank
```

### Evidence To Capture

For the Week 3 submission, capture:

- `docker compose up --build` logs
- `kubectl get pods -n nexbank`
- `kubectl get svc -n nexbank`
- `kubectl logs deployment/backend -n nexbank`
- scaling output after increasing frontend/backend replicas

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

The system is designed using a **modular frontend architecture** with a shared frontend API client and an Express/MongoDB backend for authentication, profile, settings, notifications, accounts, cards, and transaction flows.

---

# Core Features

## Authentication
- User registration
- Secure login system
- OTP verification for protected login flows
- Forgot password recovery flow
- Session-based navigation with token-based API requests

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
- PIN verification before revealing sensitive card details
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
- Set PIN and change PIN flow
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

## 3. API Layer
Data flows through the shared frontend API client in `client/src/services/api.js`.

The API base URL resolves as follows:

- Local development: `http://localhost:5000/api`
- Production deployment: `REACT_APP_API_BASE_URL`
- Same-origin fallback: `/api`

The main backend route groups are:

- `/api/auth` → login & registration
- `/api/profile` → profile data and profile updates
- `/api/banking` → accounts, balances, cards, and transactions
- `/api/settings` → customer settings and preferences
- `/api/notifications` → notification feed and read state

---

## 4. Database Layer
Data is structured in collections:

- Users
- Accounts
- Transactions
- Cards
- Preferences

User actions are persisted through the backend and reflected back into the UI through shared account and profile state.

---

## 5. Data Flow Example

**Deposit Flow:**
1. User clicks "Deposit"
2. User selects the receiving account and enters deposit details
3. React sends the request through the shared API client
4. Backend validates the request and updates account and transaction data
5. MongoDB stores the updated records
6. Dashboard and account views refresh with the latest summary

**Login Flow:**
1. User registers or logs in from the authentication pages
2. Frontend sends the request through the shared API client
3. If OTP is required, the user is redirected to the OTP verification screen
4. After successful verification, the token and user record are stored
5. Protected pages load profile, account, card, transaction, and settings data from the backend

**PIN Flow:**
1. A new user can set a PIN in Settings
2. A user with an existing PIN can change it in Settings
3. If a temporary PIN exists, the user is prompted to change it before viewing sensitive card details
4. Cards requires PIN verification before revealing card details

**Money Movement Flow:**
1. User selects an account in Dashboard, Deposit, Withdraw, Transfer, or Pay Bills
2. Frontend submits the action through the shared account context
3. Backend validates account rules, balance limits, and transaction payloads
4. Updated balances, cards, and transactions are returned in the latest summary payload

---

# Technologies Used

## Frontend
- React.js
- React Router
- JavaScript (ES6+)
- CSS3 (Custom Design System)
- Responsive UI Design

## Backend
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
- Login / Signup / OTP Verification / Forgot Password
- Dashboard
- Accounts
- Deposit / Withdraw / Transfer / Pay Bills
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

# Navigate to frontend
cd nexbank/client

# Install dependencies
npm install

# install react bootstrap icons
npm install react-bootstrap-icons

# install react bootstrap 
npm install react-bootstrap bootstrap

# Run development server
npm start
```

Frontend runs at `http://localhost:3000`.

Start the backend in a separate terminal:

```bash
cd ../server
npm install
npm start
```

Backend runs at `http://localhost:5000`, and the shared frontend API client will call `http://localhost:5000/api` during local development.

## User Flow Summary

1. A new customer registers on the Register page.
2. The customer logs in on the Login page.
3. If login OTP is required, the customer completes verification on the OTP page.
4. After login, the dashboard loads the user profile and banking summary.
5. The customer can open accounts, make deposits, withdraw, transfer money, pay bills, manage cards, and review transactions.
6. The Profile page lets the customer update personal details and toggle two-factor authentication.
7. The Settings page lets the customer manage preferences and set or change their PIN.
8. The Cards page requires PIN verification before showing sensitive card details.

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

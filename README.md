# security-learning-platform
Web app for learning cybersecurity — articles, vulnerable code examples, and bug report submissions.
# 🔐 Security Learning Platform
 
A web-based cybersecurity learning platform built with Node.js, Express, and PostgreSQL.  
Users can register, read OWASP articles, explore vulnerable code examples, and submit bug reports.
 
---
 
## 🚀 Features
 
- **Authentication** — Register, login, JWT (access + refresh token), password reset via email
- **Learn Module** — Articles and code examples organized by OWASP categories
- **Report System** — Users submit bug reports, admins manage their status
- **Admin Panel** — Manage all reports and delete content
- **Role System** — `user` and `admin` roles
---
 
## 🛠️ Tech Stack
 
| Technology | Usage |
|---|---|
| Node.js + Express | Backend server |
| PostgreSQL | Database |
| JWT | Authentication |
| bcrypt | Password hashing |
| Nodemailer | Email sending |
| dotenv | Environment variables |
 
---
 
## ⚙️ Setup
 
### 1. Clone the repository
 
```bash
git clone https://github.com/your_username/security-learning-platform.git
cd security-learning-platform
```
 
### 2. Install dependencies
 
```bash
npm install
```
 
### 3. Configure `.env`
 
Copy the example file and fill in your own values:
 
```bash
cp .env.example .env
```
 
Your `.env` file should look like this:
 
```
ACCESS_TOKEN_SECRET=some_long_random_string
REFRESH_TOKEN_SECRET=another_long_random_string
user_email=your@gmail.com
user_pass=your_gmail_app_password
 
DB_HOST=localhost
DB_USER=postgres
DB_PASS=your_db_password
DB_PORT=5432
DB_NAME=DemoDB
```
 
> **Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords
 
### 4. Set up the database
 
Create a database named `DemoDB` in PostgreSQL and run the following:
 
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  reset_token TEXT,
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
 
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  owasp_category TEXT,
  content TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
 
CREATE TABLE code_examples (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  owasp_category TEXT,
  severity VARCHAR(50) DEFAULT 'low',
  vulnerable_code TEXT NOT NULL,
  fixed_code TEXT NOT NULL,
  explanation TEXT,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
 
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  severity VARCHAR(50) NOT NULL,
  target TEXT,
  description TEXT NOT NULL,
  steps TEXT NOT NULL,
  impact TEXT,
  recommendation TEXT,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);
```
 
### 5. Start the server
 
```bash
node index.js
```
 
Server will run at `http://localhost:3000`
 
---

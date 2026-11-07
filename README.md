# CampusOps – Smart Campus Facilities & Service Management Platform

A campus facilities and service management platform for the University of Jordan, including a
**Student Lockers** module.

CampusOps replaces phone calls, e-mails and paper forms with one platform where students and staff
report campus problems, facility managers turn them into work orders, technicians carry out the work
with dependent tasks and spare parts, and the whole lifecycle – from *Issue Reported* to *Work Verified* –
is tracked against service-level targets. The facilities office also manages paid student lockers.

| Area | What it does |
|---|---|
| Service requests | Location-based reports (building, room, asset), category, severity, urgency, photos, contact method; automatic priority (P1–P4) and SLA due dates; status timeline, notifications, requester confirmation + 1–5 rating, re-open |
| Work orders | Created from requests or assets; technician suggestions (skill, building, workload); dependent tasks *Inspection → Material approval → Repair → Requester confirmation*; repair notes, evidence photos |
| Assets & preventive maintenance | Registry of elevators, HVAC, lab equipment …; warranty tracking; maintenance history; recurring schedules that generate planned work before equipment is overdue |
| Inventory | Spare parts, reservations per work order, consumption, shortages that **block** work orders, procurement approval workflow |
| Student lockers | Grid/table of every locker with status and occupant; filters; subscriptions (from–to dates or 1–4 month presets), cash receipts, extend / end, out of service; students see their own lockers |
| SLA, dashboards & audit | Priority matrix, escalation of overdue requests, KPI dashboards, performance reports, full audit trail, role-based access |

## Repository layout

```
.
├── backend/    REST API – NestJS 11 (TypeScript), Prisma 6, PostgreSQL
├── frontend/   Web client – React 19, Vite 7, Mantine 8, TanStack Query
└── DEPLOYMENT.md   Free hosting guide (Vercel + Neon)
```

The backend and frontend are independent projects (separate `package.json`, separate Vercel projects).
See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for their internal structure.

## Run it locally – step by step

This guide assumes a computer with **nothing installed**. Follow the steps in order; each one ends with a
check so you know it worked. Commands are typed in a **terminal**:

- **Windows:** press `Win`, type `PowerShell`, press Enter.
- **macOS:** press `Cmd + Space`, type `Terminal`, press Enter.
- **Linux:** press `Ctrl + Alt + T`.

> Where Windows needs a different command, it is shown as **Windows (PowerShell):**.

### Step 1 – Install Node.js (it includes `npm`)

The backend and the frontend both run on Node.js. `npm` (the package manager) is installed with it.

1. Go to https://nodejs.org and download the **LTS** version (22.x or newer; 20.x also works).
2. Run the installer and keep the default options.
   - **Windows:** keep "Add to PATH" ticked.
   - **Linux (Ubuntu/Debian)** alternative:
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
     sudo apt-get install -y nodejs
     ```
3. **Close the terminal and open a new one** (so it sees the new program), then check:
   ```bash
   node -v     # must print v20.x or higher, e.g. v22.15.0
   npm -v      # must print a version number, e.g. 10.9.2
   ```

### Step 2 – Get the project files

**Option A – with Git** (recommended if the project is on GitHub):
1. Install Git from https://git-scm.com/downloads (default options), open a new terminal, check with `git --version`.
2. Download the project:
   ```bash
   git clone https://github.com/<account>/<repository>.git campusops
   cd campusops
   ```

**Option B – without Git:** on the GitHub page click **Code → Download ZIP**, unzip it (for example to your Desktop),
then in the terminal go into that folder:
```bash
cd Desktop/campusops        # use the real folder name
```

Check: listing the folder (`ls` – Windows: `dir`) shows `backend`, `frontend` and `README.md`.

### Step 3 – Get a PostgreSQL database

The API stores its data in PostgreSQL. Choose **one** option.

**Option A – Neon (free, nothing to install – easiest)**
1. Create a free account at https://neon.tech and create a project (any name, region *Europe*).
2. On the project dashboard click **Connect**, untick **Connection pooling**, and copy the connection string.
   It looks like `postgresql://neondb_owner:xxxx@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`.
3. Keep it: you will paste it in Step 4.

**Option B – PostgreSQL on your computer**
1. Install PostgreSQL 14 or newer:
   - **Windows / macOS:** download the installer from https://www.postgresql.org/download/ (EDB installer).
     Keep the defaults, **remember the password you choose for the `postgres` user**, keep port `5432`.
     (The Stack Builder at the end is not needed.)
   - **Ubuntu/Debian:** `sudo apt-get install -y postgresql`
2. Create the database:
   - **Windows / macOS:** open **pgAdmin** (installed with PostgreSQL) → connect with your password →
     right-click **Databases → Create → Database…** → name `campusops` → Save.
   - **Linux:**
     ```bash
     sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
     sudo -u postgres createdb campusops
     ```
3. Your connection string is (replace `YOUR_PASSWORD`):
   `postgresql://postgres:YOUR_PASSWORD@localhost:5432/campusops?schema=public`

### Step 4 – Configure and start the API (backend)

In the terminal, from the project folder:

```bash
cd backend
cp .env.example .env
```
**Windows (PowerShell):** `copy .env.example .env`

Open `backend/.env` in any text editor (Notepad, VS Code …) and change these lines – paste **your** connection
string from Step 3 into **both** lines, and type any long random text as the secret:

```env
DATABASE_URL="<your connection string>"
DIRECT_URL="<your connection string>"
JWT_SECRET="any-long-random-text-for-example-8f3k2l9x7q1w"
```
Leave the other lines as they are. Save the file.

Now install, create the tables, load the demo data and start the API:

```bash
npm install                    # downloads the libraries (needs internet, 1–3 minutes)
npx prisma migrate deploy      # creates the tables in the database
npm run db:seed                # loads the demo data (fictional people)
npm run start:dev              # starts the API
```

Check: the terminal ends with `CampusOps API running on http://localhost:4000/api`, and
http://localhost:4000/api/health opens in the browser and shows `"status":"ok"`.
The interactive API documentation (Swagger) is at http://localhost:4000/api/docs.

**Leave this terminal open** – closing it stops the API.

### Step 5 – Start the web application (frontend)

Open a **second** terminal, go to the project folder again, then:

```bash
cd frontend
cp .env.example .env           # Windows (PowerShell): copy .env.example .env
npm install
npm run dev
```

Check: the terminal shows `Local: http://localhost:5173/`. Open **http://localhost:5173** in your browser and
sign in with one of the demo accounts below (the login page also has one-click buttons that fill them in).

### Next time

The installation is only needed once. To run the project again, open two terminals:

```bash
# terminal 1
cd backend
npm run start:dev

# terminal 2
cd frontend
npm run dev
```
To reset the demo data to its original state at any time, run `npm run db:seed` inside the `backend` folder.

### Troubleshooting

| Problem | Solution |
|---|---|
| `node`, `npm` or `git` is "not recognized" / "command not found" | Close **all** terminals and open a new one after installing. On Windows, re-run the Node.js installer and make sure "Add to PATH" is ticked. |
| Windows: `npm : running scripts is disabled on this system` | Run once in PowerShell: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (answer `Y`), then try again. Or use **Command Prompt** instead of PowerShell. |
| `Invalid environment configuration: DATABASE_URL ...` | `backend/.env` is missing or a value is empty – redo Step 4 (the file must be named exactly `.env`). |
| `P1001: Can't reach database server` | PostgreSQL is not running or the connection string is wrong. Local: check the password and that the PostgreSQL service is started. Neon: make sure `?sslmode=require` is at the end. |
| `P1000: Authentication failed` | Wrong user name or password in the connection string. |
| `permission denied to create extension "btree_gist"` | The database user is not allowed to install extensions. Use the `postgres` user (local) or the owner user shown by Neon. |
| `EADDRINUSE: address already in use :::4000` (or `5173`) | The program is already running in another terminal – close it, or restart the computer. |
| The website shows "Cannot reach the server" | The API (Step 4) is not running, or `frontend/.env` does not contain `VITE_API_URL=http://localhost:4000/api`. |
| `npm install` fails while downloading | Check the internet connection (a VPN or firewall can block it) and run `npm install` again. |
| Login says "Invalid email or password" | Run `npm run db:seed` in `backend` to (re)create the demo accounts; the password is `Password123!`. |

### Demo accounts

All demo users are fictional. Password for every account: **`Password123!`**

| Role | E-mail |
|---|---|
| System administrator | admin@campusops.edu |
| Facility manager | manager@campusops.edu |
| Technician | tech@campusops.edu |
| Student (has lockers) | student@campusops.edu |
| Staff member | staff@campusops.edu |

## Tests

```bash
# inside backend/
npm test              # unit tests of the business rules (Jest)
npm run test:e2e      # API end-to-end tests (needs a seeded database)

# inside frontend/
npm test              # front-end unit tests (Vitest)
```

## Deployment

Free hosting on Vercel (frontend + serverless API) and Neon (PostgreSQL). Step by step: [DEPLOYMENT.md](DEPLOYMENT.md).

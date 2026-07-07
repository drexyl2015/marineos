# Quick Start - 2 Minutes

Your complete Marine Document System is ready to run.

## Step 1: Open in VS Code

```bash
# Navigate to the folder
cd C:\Users\Sadiqs\Desktop\marine-document-system

# Open in VS Code
code .
```

## Step 2: Run Setup Script

### Windows
```cmd
setup.bat
```

### Mac/Linux
```bash
./setup.sh
```

The script will:
- ✅ Start PostgreSQL with Docker
- ✅ Install backend dependencies
- ✅ Install frontend dependencies
- ✅ Start the backend server (http://localhost:8000)
- ✅ Start the frontend server (http://localhost:5173)

## Step 3: Open in Browser

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## That's It!

Your application is now running with:
- ✅ Claude AI integration (document parsing, compliance checking, crew matching)
- ✅ 3 role-based dashboards (Super Admin, Crew Manager, Compliance Officer)
- ✅ Sample crew and certificate data
- ✅ PostgreSQL database

## Required Setup (One-time)

1. **Get Claude API Key**
   - Go to: https://console.anthropic.com
   - Create an API key
   - Copy it

2. **Update Backend Config**
   - Open: `backend/.env`
   - Replace: `sk-ant-demo-key-replace-with-your-key` with your actual key
   - Save the file

3. **Restart Backend**
   - Stop the running backend (Ctrl+C in terminal)
   - Run: `uvicorn main:app --reload` (from backend folder)

## Troubleshooting

### Port already in use?
```bash
# Use different ports
npm run dev -- --port 5174  # Frontend
uvicorn main:app --reload --port 8001  # Backend
```

### Docker not running?
Start Docker Desktop first, then run setup script again

### Still having issues?
See `README.md` for detailed troubleshooting

---

**Everything is ready! Just run the setup script and open your browser.** 🚀

---

## Verifying Changes

Before committing, run the checks (Python 3.11 required):

```powershell
# From the repo root — runs backend tests + frontend type-check + build
powershell -ExecutionPolicy Bypass -File .\check.ps1
```

Or individually:

```powershell
# Backend
cd backend
.\venv\Scripts\activate
pytest tests -q

# Frontend
cd ..\frontend
npm run type-check
npm run build
```

If the backend `venv` is broken (e.g. it points at a missing Python 3.12), recreate it:

```powershell
cd backend
Remove-Item -Recurse -Force .\venv
py -3.11 -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

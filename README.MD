# HR Management System

This project is a full-stack Human Resources management application built with Django and React.

## Overview

The application provides a simple employee directory and management workflow for:
- adding employees
- viewing employees
- deleting employees
- storing employee metadata such as name, email, department, role, and join date

## Tech Stack

- Backend: Python, Django, Django REST Framework
- Frontend: React, Vite
- Database: SQLite (for local development)
- API communication: Axios

## Project Structure

- `backend/` — Django project and API backend
- `frontend/` — React frontend application

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install Django djangorestframework django-cors-headers
python manage.py migrate
python manage.py runserver
```

The backend API will run on:
- http://localhost:8000

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on:
- http://localhost:5173

## Default API Endpoint

The project exposes employee data at:
- http://localhost:8000/employees/

## Notes

- The frontend is configured to communicate with the Django backend at `http://localhost:8000`.
- The SQLite database file is stored in `backend/db.sqlite3` for local development.
- This is a starter HR management app intended for learning and local development.

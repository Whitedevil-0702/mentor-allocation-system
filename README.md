# Mentor Allocation System

Prototype backend and frontend for mentor allocation workflows.

## Local Configuration

Copy `.env.example` to `.env` for local development and replace placeholder values as needed. Do not commit `.env`, real secrets, or source Excel files containing student PII.

Required environment variables:

- `MENTOR_EXCEL_PATH`: Path to the local mentor/student Excel workbook used by `seed_db.py`. Defaults to `Mentor Data.xlsx` at the root, falling back to `tests/fixtures/synthetic_mentor_data.xlsx` if the real file is absent.
- `DATABASE_URL`: SQLAlchemy database URL. The local default is `sqlite:///./database.db`; the MentorOS target database is PostgreSQL.
- `TEST_DATABASE_URL`: Database URL used for running the tests.
- `SECRET_KEY`: Placeholder local secret for future auth integration.

## Seeding Local Data

If environment variables are omitted, the seeder uses repo-relative local defaults:
- Excel workbook: `./Mentor Data.xlsx` (if it exists) or `./tests/fixtures/synthetic_mentor_data.xlsx`
- Database: `sqlite:///./database.db`

### Generating Synthetic Data
For testing and onboarding, you can generate a synthetic spreadsheet containing no real student PII:
```powershell
python scripts/generate_synthetic_fixture.py
```
This generates the mock spreadsheet at `tests/fixtures/synthetic_mentor_data.xlsx`.

### Running the Seeder
To seed the database with the synthetic Excel file:
```powershell
$env:MENTOR_EXCEL_PATH = "tests/fixtures/synthetic_mentor_data.xlsx"
$env:DATABASE_URL = "sqlite:///./database.db"
python seed_db.py
```

The Excel workbook containing real student PII must never be committed to git. Always use synthetic data for testing and CI.


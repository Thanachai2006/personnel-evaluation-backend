# Personnel Evaluation System (Backend)

## Technology Stack
- Node.js (Express)
- Prisma (ORM)
- MySQL
- Swagger (Documentation)

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Database Configuration:**
   - Create a MySQL database.
   - Update `DATABASE_URL` in the `.env` file:
     ```env
     DATABASE_URL="mysql://root:password@localhost:3306/evaluation_db"
     JWT_SECRET="your_secret_key"
     ```

3. **Prisma Migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Seed Data:**
   ```bash
   npx prisma db seed
   ```

5. **Run the Application:**
   ```bash
   npm run dev
   ```

## API Documentation
- Once the server is running, visit: `http://localhost:5000/api-docs` to view the Swagger documentation.

## Sample Accounts (from Seed)
| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@example.com | password123 |
| Evaluator | evaluator@example.com | password123 |
| Evaluatee | evaluatee@example.com | password123 |

## Business Logic: Scoring
- **SCALE_1_4:** `(score / 4) * indicator.weight`
- **YES_NO:** `(score === 1 ? 1 : 0) * indicator.weight`
- All indicators in an evaluation must sum to 100% weight.
- Evidence is required if `requireEvidence` is set to `true`.
- Evaluatees cannot view evaluation results (based on "Evaluatee ห้ามดูผล").

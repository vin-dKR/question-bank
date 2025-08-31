# Examination Results Dashboard

A comprehensive examination management system built with Next.js, Prisma, and MongoDB.

## Features

### For Teachers
- **Test Creation**: Create multiple-choice tests with custom questions and answers
- **Test Management**: View all created tests with response counts
- **Analytics Dashboard**: Detailed performance insights including:
  - Overall test statistics (average, highest, lowest scores)
  - Per-question performance analysis
  - Individual student performance tracking
  - Response accuracy metrics
- **PDF Export**: Export analytics reports (coming soon)

### For Students
- **Test Taking**: Submit answers to tests (simulated OMR responses)
- **Performance Tracking**: View individual results and progress

## Database Schema

The system uses the following models:

- **Test**: Contains test metadata and questions
- **TestQuestion**: Individual questions with options and correct answers
- **Student**: Student information and details
- **StudentResponse**: Student answers and calculated scores

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB database
- Clerk authentication setup

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   DATABASE_URL="your-mongodb-connection-string"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-key"
   CLERK_SECRET_KEY="your-clerk-secret"
   ```

4. Run database migrations:
   ```bash
   npx prisma db push
   ```

5. Seed sample data:
   ```bash
   npx tsx scripts/seed-examination-data.ts
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Creating a Test
1. Navigate to `/examination/create`
2. Fill in test details (title, subject, duration)
3. Add questions with multiple choice options
4. Set correct answers and marks for each question
5. Save the test

### Viewing Analytics
1. Go to `/examination` to see all tests
2. Click "View Analytics" on any test
3. Review performance metrics and student results

## API Endpoints

- `POST /api/examination/tests` - Create a new test
- `GET /api/examination/tests` - Get all tests for the current user
- `GET /api/examination/analytics/[testId]` - Get test analytics

## File Structure

```
├── components/
│   └── examination/
│       ├── TestCreator.tsx      # Test creation interface
│       ├── TestDashboard.tsx    # Main dashboard
│       └── TestAnalytics.tsx    # Analytics display
├── app/
│   └── examination/
│       ├── page.tsx             # Dashboard page
│       ├── create/
│       │   └── page.tsx         # Test creation page
│       └── analytics/
│           └── [testId]/
│               └── page.tsx     # Analytics page
├── actions/
│   └── examination/
│       ├── test.ts              # Test management actions
│       └── student.ts           # Student and response actions
├── scripts/
│   └── seed-examination-data.ts # Sample data seeding
└── prisma/
    └── schema.prisma            # Database schema
```

## Sample Data

The seed script creates:
- 5 sample students with different performance levels
- 1 mathematics test with 20 questions
- Student responses with varying scores (45% - 95%)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License

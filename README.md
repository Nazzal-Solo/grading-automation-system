# Auto Grading Platform

A comprehensive automated grading platform for multiple students and lectures with web-based interface.

## Features

- 🎯 **Automated Grading**: Grade student submissions automatically
- 👥 **Cohort Management**: Manage multiple student cohorts
- 📊 **Real-time Results**: View grading results in real-time
- 🔍 **Student Status Tracking**: Monitor student progress and performance
- 📈 **Detailed Analytics**: Comprehensive grading analytics and reports
- 🌐 **Web Interface**: User-friendly web-based interface

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **Grading Engine**: Custom Ultra Dynamic Grading Engine
- **Data Storage**: JSON-based file storage

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/auto-grading-platform.git
cd auto-grading-platform
```

2. Install dependencies:

```bash
npm install
```

3. Start the application:

```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Configuration

The platform uses configuration files in the `config/` directory:

- `students.json` - Student information and GitHub repositories
- `lectures.json` - Lecture definitions and grading criteria
- `cohorts.json` - Cohort management data
- `*-enhanced.json` - Enhanced grading configurations for specific lectures

## API Endpoints

- `GET /api/students` - Get all students
- `GET /api/lectures` - Get all lectures
- `GET /api/results` - Get grading results
- `POST /api/grade` - Grade a student's submission
- `POST /api/grade-ultra-dynamic` - Ultra dynamic grading

## Deployment

This application is ready for deployment on platforms like:

- **Render** (Recommended)
- **Railway**
- **Heroku**
- **Vercel**

### Deploy to Render

1. Push your code to GitHub
2. Connect your repository to Render
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Deploy!

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

# Grading Automation System

A comprehensive automated grading platform for multiple students and lectures with web-based interface.

## Features

- 🎯 **Automated Grading**: Grade student submissions automatically
- 👥 **Cohort Management**: Manage multiple student cohorts
- 📊 **Real-time Results**: View grading results in real-time
- 🔍 **Student Status Tracking**: Monitor student progress and performance
- 📈 **Detailed Analytics**: Comprehensive grading analytics and reports
- 🌐 **Web Interface**: User-friendly web-based interface
- 🔄 **GitHub Integration**: Automatic repository downloading and grading

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **Grading Engine**: Custom Grading Engine
- **Data Storage**: JSON-based file storage
- **GitHub API**: Repository access and management

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- GitHub Personal Access Token

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/grading-automation-system.git
cd grading-automation-system
```

2. Install dependencies:

```bash
npm install
```

3. Configure your environment:

Create configuration files in the `config/` directory:

- `students.json` - Student information and GitHub repositories
- `lectures.json` - Lecture definitions and grading criteria
- `cohorts.json` - Cohort management data

4. Start the application:

```bash
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## Configuration

The platform uses configuration files in the `config/` directory:

- `students.json` - Student information and GitHub repositories
- `lectures.json` - Lecture definitions and grading criteria
- `cohorts.json` - Cohort management data
- `*-enhanced.json` - Enhanced grading configurations for specific lectures

### Environment Variables

Set the following environment variables for production:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production/development)

## API Endpoints

- `GET /api/students` - Get all students
- `GET /api/lectures` - Get all lectures
- `GET /api/results` - Get grading results
- `POST /api/grade` - Grade a student's submission
- `POST /api/grade-ultra-dynamic` - Grading
- `POST /api/download` - Download student repository
- `GET /api/cohorts` - Get cohort information

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
5. Add environment variables if needed
6. Deploy!

### Render Configuration

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: 18.x or higher

## Project Structure

```
grading-automation-system/
├── config/                 # Configuration files
│   ├── students.json      # Student data
│   ├── lectures.json      # Lecture definitions
│   ├── cohorts.json       # Cohort management
│   └── *-enhanced.json    # Enhanced grading configs
├── src/                   # Source code
│   ├── core/             # Core grading engine
│   ├── utils/            # Utility functions
│   └── web-ui/           # Web interface
├── downloads/            # Downloaded repositories
├── results/              # Grading results
├── package.json          # Dependencies
├── Procfile             # Deployment configuration
└── README.md            # Documentation
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and questions, please create an issue in the GitHub repository.

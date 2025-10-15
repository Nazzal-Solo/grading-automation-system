# Render Deployment Configuration

This file contains the configuration needed for deploying to Render.

## Build Configuration

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: 18.x or higher

## Environment Variables

Set these in Render dashboard under Environment tab:

```
NODE_ENV=production
PORT=10000
```

## Required Files

Make sure these files are present in your repository:

- ✅ `package.json` - Dependencies and scripts
- ✅ `Procfile` - Process configuration
- ✅ `.gitignore` - Git ignore rules
- ✅ `README.md` - Documentation
- ✅ `src/web-ui/server.js` - Main application file

## Configuration Files

The following configuration files should be present in the `config/` directory:

- `students.json` - Student data and GitHub repositories
- `lectures.json` - Lecture definitions and grading criteria
- `cohorts.json` - Cohort management data
- `*-enhanced.json` - Enhanced grading configurations

## Health Check

The application includes a health check endpoint:

- `GET /` - Returns the main web interface
- `GET /api/students` - API health check

## Scaling

Render will automatically scale your application based on traffic. The free tier includes:

- 750 hours per month
- Automatic sleep after 15 minutes of inactivity
- Automatic wake-up when accessed

## Monitoring

Monitor your deployment through:

1. Render dashboard logs
2. Application logs in the web interface
3. GitHub repository for code changes

## Updates

To update your deployment:

1. Push changes to your GitHub repository
2. Render will automatically redeploy
3. Monitor logs for any issues

## Troubleshooting

### Common Issues:

1. **Build Timeout**: Increase build timeout in Render settings
2. **Memory Issues**: Upgrade to paid plan for more memory
3. **Port Binding**: Ensure app uses `process.env.PORT`
4. **File Permissions**: Check file permissions in logs

### Logs to Check:

- Build logs for dependency installation issues
- Runtime logs for application errors
- Network logs for connectivity issues

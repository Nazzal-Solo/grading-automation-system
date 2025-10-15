# Deployment Guide

This guide will help you deploy the Grading Automation System to GitHub and Render.

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in to your account
2. Click the "+" icon in the top right corner and select "New repository"
3. Fill in the repository details:
   - **Repository name**: `grading-automation-system`
   - **Description**: `Comprehensive automated grading platform for multiple students and lectures`
   - **Visibility**: Choose Public or Private
   - **Initialize**: Do NOT check "Add a README file" (we already have one)
4. Click "Create repository"

## Step 2: Connect Local Repository to GitHub

Run these commands in your terminal (replace `YOUR_USERNAME` with your actual GitHub username):

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/grading-automation-system.git

# Push the code to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Render

1. Go to [Render](https://render.com) and sign in
2. Click "New +" and select "Web Service"
3. Connect your GitHub account if not already connected
4. Select your `grading-automation-system` repository
5. Configure the service:
   - **Name**: `grading-automation-system` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: `18` (or latest)
6. Click "Create Web Service"

## Step 4: Environment Variables (Optional)

If you need to set environment variables in Render:

1. Go to your service dashboard
2. Click on "Environment" tab
3. Add any required environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render will set this automatically)

## Step 5: Custom Domain (Optional)

1. In your Render service dashboard
2. Go to "Settings" tab
3. Scroll down to "Custom Domains"
4. Add your custom domain if you have one

## Step 6: Monitor Deployment

1. Check the "Logs" tab in Render to monitor the deployment
2. Once deployed, your app will be available at: `https://your-app-name.onrender.com`

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in `package.json`
2. **App Crashes**: Check the logs for error messages
3. **Port Issues**: Ensure your app uses `process.env.PORT || 3000`

### Configuration Files:

Make sure your configuration files are properly set up:

- `config/students.json` - Student data
- `config/lectures.json` - Lecture definitions
- `config/cohorts.json` - Cohort management

## Security Notes

- Never commit sensitive data like GitHub tokens to the repository
- Use environment variables for sensitive configuration
- Consider using Render's environment variable feature for secrets

## Post-Deployment

After successful deployment:

1. Test all API endpoints
2. Verify the web interface loads correctly
3. Test grading functionality with sample data
4. Set up monitoring and alerts if needed

## Support

If you encounter issues:

1. Check Render logs for error messages
2. Verify all configuration files are present
3. Ensure all dependencies are properly installed
4. Check GitHub repository for any missing files

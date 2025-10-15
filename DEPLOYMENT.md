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

## Step 4: Environment Variables (Required)

⚠️ **IMPORTANT**: You must set environment variables for the application to work properly.

### Required Environment Variables:

1. Go to your service dashboard
2. Click on "Environment" tab
3. Add these required environment variables:

```
NODE_ENV=production
GITHUB_TOKEN=ghp_your_github_token_here
```

### Getting Your GitHub Token:

1. Go to [GitHub Settings](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name like "Grading System Token"
4. Select these permissions:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:user` (Read user profile data)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Paste it as the `GITHUB_TOKEN` value in Render

### Optional Environment Variables:

```
LOG_LEVEL=info
```

**Note**: `PORT` is automatically set by Render, so you don't need to configure it.

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
4. **GitHub API Errors**: Verify `GITHUB_TOKEN` environment variable is set correctly
5. **Repository Not Found**: Check if the GitHub token has proper permissions
6. **Configuration Loading Errors**: Ensure all config files exist in the repository

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

# Environment Variables Guide

This guide explains the environment variables needed for the Grading Automation System and how to configure them for different deployment environments.

## Required Environment Variables

### 1. PORT
- **Purpose**: Sets the port number for the web server
- **Default**: `3000`
- **Render**: Automatically set by Render (usually `10000`)
- **Usage**: `process.env.PORT || 3000`

```bash
PORT=3000
```

### 2. NODE_ENV
- **Purpose**: Sets the application environment
- **Values**: `development`, `production`, `test`
- **Default**: `development`
- **Usage**: Controls logging levels and error handling

```bash
NODE_ENV=production
```

## Sensitive Configuration (GitHub Token)

⚠️ **IMPORTANT**: The GitHub token is currently stored in `config/students.json` as `globalToken`. For security, this should be moved to environment variables.

### Current Configuration (config/students.json):
```json
{
  "globalToken": "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",
  "students": [...]
}
```

### Recommended Environment Variable Approach:

#### 3. GITHUB_TOKEN
- **Purpose**: GitHub Personal Access Token for API access
- **Required**: Yes (for downloading repositories)
- **Security**: ⚠️ **NEVER commit this to git**

```bash
GITHUB_TOKEN=ghp_your_github_token_here
```

## Environment Variable Configuration

### For Local Development (.env file)

Create a `.env` file in your project root:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# GitHub Configuration
GITHUB_TOKEN=ghp_your_github_token_here

# Optional: Logging
LOG_LEVEL=debug
```

### For Render Deployment

In your Render dashboard:

1. Go to your service
2. Click on "Environment" tab
3. Add these variables:

```
NODE_ENV=production
GITHUB_TOKEN=ghp_your_github_token_here
LOG_LEVEL=info
```

**Note**: `PORT` is automatically set by Render, so you don't need to configure it.

### For Other Platforms

#### Heroku:
```bash
heroku config:set NODE_ENV=production
heroku config:set GITHUB_TOKEN=ghp_your_token_here
```

#### Railway:
```bash
railway variables set NODE_ENV=production
railway variables set GITHUB_TOKEN=ghp_your_token_here
```

#### Vercel:
```bash
vercel env add NODE_ENV production
vercel env add GITHUB_TOKEN ghp_your_token_here
```

## Security Best Practices

### 1. Never Commit Sensitive Data
- Add `.env` to `.gitignore` ✅ (already done)
- Never commit tokens to git
- Use environment variables for all secrets

### 2. GitHub Token Permissions
Your GitHub token should have these permissions:
- ✅ `repo` (Full control of private repositories)
- ✅ `read:user` (Read user profile data)
- ✅ `read:org` (Read org and team membership)

### 3. Token Rotation
- Rotate tokens regularly
- Use different tokens for different environments
- Monitor token usage in GitHub settings

## Code Changes Needed

To use environment variables for the GitHub token, update `src/web-ui/server.js`:

```javascript
// Current code (line 55):
globalToken: studentsData.globalToken,

// Updated code:
globalToken: process.env.GITHUB_TOKEN || studentsData.globalToken,
```

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
PORT=3000
GITHUB_TOKEN=ghp_dev_token_here
LOG_LEVEL=debug
```

### Production (Render)
```bash
NODE_ENV=production
# PORT is set by Render automatically
GITHUB_TOKEN=ghp_prod_token_here
LOG_LEVEL=info
```

### Testing
```bash
NODE_ENV=test
PORT=3001
GITHUB_TOKEN=ghp_test_token_here
LOG_LEVEL=error
```

## Troubleshooting

### Common Issues:

1. **"Repository not found" errors**
   - Check if `GITHUB_TOKEN` is set correctly
   - Verify token has proper permissions
   - Check if repository exists and is accessible

2. **Port binding errors**
   - Ensure `PORT` environment variable is set
   - Check if port is available
   - Use `process.env.PORT || 3000` in code

3. **Configuration loading errors**
   - Verify all required config files exist
   - Check file permissions
   - Ensure JSON syntax is valid

### Debugging Environment Variables:

```javascript
// Add this to your server.js for debugging
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? '***SET***' : 'NOT SET');
```

## Next Steps

1. **Create GitHub Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` permissions
   - Copy the token (you won't see it again!)

2. **Update Render Environment Variables**
   - Add `GITHUB_TOKEN` to your Render service
   - Set `NODE_ENV=production`

3. **Test the Configuration**
   - Deploy to Render
   - Test repository downloading
   - Verify grading functionality

4. **Optional: Update Code**
   - Modify `server.js` to use `process.env.GITHUB_TOKEN`
   - Remove hardcoded token from `students.json`
   - Commit and redeploy

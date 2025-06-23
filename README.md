# Slack OAuth Login App

A Next.js application that implements Slack OAuth 2.0 authentication with a beautiful login page and home dashboard.

## Features

- 🔐 Slack OAuth 2.0 authentication
- 🎨 Modern, responsive UI with beautiful styling
- 🏠 Protected home page with user information
- 🚀 Ready for Vercel deployment
- 🔒 Secure session management
- 📱 Mobile-friendly design

## Prerequisites

Before you begin, you need to create a Slack app:

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Give your app a name and select a workspace
4. In the left sidebar, go to "OAuth & Permissions"
5. Add the following OAuth scopes:
   - `identity.basic`
   - `identity.email`
   - `identity.avatar`
6. Set your redirect URL to: `https://your-domain.vercel.app/api/auth/callback`
7. Copy your Client ID and Client Secret

## Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd slack-oauth-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp env.example .env.local
   ```

   Edit `.env.local` and add your Slack app credentials:

   ```env
   NEXT_PUBLIC_SLACK_CLIENT_ID=your_slack_client_id_here
   SLACK_CLIENT_SECRET=your_slack_client_secret_here
   NEXT_PUBLIC_SLACK_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback
   SLACK_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. **Push your code to GitHub**

2. **Deploy to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add your environment variables in the Vercel dashboard:
     - `NEXT_PUBLIC_SLACK_CLIENT_ID`
     - `SLACK_CLIENT_SECRET`
     - `NEXT_PUBLIC_SLACK_REDIRECT_URI`
     - `SLACK_REDIRECT_URI`

3. **Update Slack App Settings**
   - Go back to your Slack app settings
   - Update the redirect URL to match your Vercel domain
   - Example: `https://your-app.vercel.app/api/auth/callback`

## How it Works

1. **Login Page** (`/`): Users see a beautiful login page with a "Auth with Slack" button
2. **OAuth Flow**: Clicking the button redirects to Slack's authorization page
3. **Callback** (`/api/auth/callback`): Slack redirects back with an authorization code
4. **Token Exchange**: The app exchanges the code for an access token
5. **User Info**: Fetches user information using the access token
6. **Home Page** (`/home`): Shows success message and user details
7. **Session Management**: Uses secure HTTP-only cookies for session storage

## Project Structure

```
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── callback/route.ts    # OAuth callback handler
│   │       ├── me/route.ts          # Get current user
│   │       └── logout/route.ts      # Logout handler
│   ├── home/
│   │   └── page.tsx                 # Protected home page
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Login page
├── env.example                      # Environment variables template
├── next.config.js                   # Next.js configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript configuration
├── vercel.json                      # Vercel deployment config
└── README.md                        # This file
```

## Security Features

- ✅ CSRF protection with state parameter
- ✅ Secure HTTP-only cookies
- ✅ Environment variable protection
- ✅ Input validation
- ✅ Error handling
- ✅ HTTPS enforcement in production

## Troubleshooting

### Common Issues

1. **"Invalid client_id" error**

   - Check that your `NEXT_PUBLIC_SLACK_CLIENT_ID` is correct
   - Ensure your Slack app is properly configured

2. **"Invalid redirect_uri" error**

   - Make sure the redirect URI in your Slack app settings matches exactly
   - Check that your environment variables are set correctly

3. **"Missing code" error**

   - This usually means the OAuth flow was interrupted
   - Check your browser's network tab for any failed requests

4. **Session not persisting**
   - Ensure cookies are enabled in your browser
   - Check that your domain matches between Slack settings and Vercel

### Development vs Production

- In development, cookies use `httpOnly: false` for easier debugging
- In production, cookies use `httpOnly: true` and `secure: true`
- Always use HTTPS in production (Vercel handles this automatically)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own applications!

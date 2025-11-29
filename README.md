# Fiinora Frontend

A React Native financial management application built with Expo and TypeScript.

## Features

- **Authentication**: Secure login/register with token refresh and secure storage
- **Dashboard**: Main app interface with tabs for exploring and managing finances
- **Profile Management**: User settings and account management
- **Responsive Design**: Works seamlessly on iOS and Android

## Tech Stack

- **React Native** with TypeScript
- **Expo** for development and deployment
- **Expo Router** for file-based navigation
- **Zustand** for state management
- **Axios** for HTTP requests with interceptors and token refresh queue
- **Zod** for data validation
- **React Hook Form** for form handling
- **React Native Safe Area Context** for safe area handling
- **Tailwind CSS** for styling

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Frontend7

# Install dependencies
npm install

# Start the development server
npx expo start

# Scan the QR code with Expo Go (Android/iOS) or open in emulator
```

### Environment Variables

Create a `.env` file in the root with:

```
REACT_APP_API_URL=<your-api-url>
```

## Project Structure

```
Frontend7/
├── app/                          # Expo Router app directory
│   ├── (auth)/                   # Auth routes (login, register, etc.)
│   ├── (tabs)/                   # Main app tabs (home, explore, profile, notifications)
│   ├── (modals)/                 # Modal screens
│   └── _layout.tsx               # Root layout
├── src/
│   ├── components/               # Reusable components
│   ├── hooks/                    # Custom hooks (useAuth)
│   ├── services/                 # API and data services
│   ├── store/                    # Zustand stores (auth, etc.)
│   ├── theme/                    # Colors, typography, theme
│   ├── types/                    # TypeScript types
│   └── utils/                    # Helper utilities
├── tests/                        # Unit tests
├── app.config.js                 # Expo configuration
├── tsconfig.json                 # TypeScript config
└── package.json
```

## Authentication Flow

1. User logs in with email/password
2. Backend returns `accessToken`, `refreshToken`, and `sessionId`
3. Access token stored in Zustand; refresh session persisted securely
4. Axios interceptor handles 401 responses with automatic token refresh
5. Failed requests queued during refresh and retried with new token

## Development

```bash
# Start dev server
npx expo start

# Clear cache and rebuild
npx expo start --clear

# Open in web
npx expo start -w

# Run tests
npm test
```

## Building

```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Push and open a pull request

## License

MIT

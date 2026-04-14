# GoldXchange Trading Terminal

Professional institutional-grade gold trading platform designed for high-precision XAU/USD market interactions.

## Key Features

- **Real-Time Market Terminal**: High-fidelity chart visualization of XAU/USD movements.
- **Institutional Execution**: Optimized trade settlement engine with instant liquidity.
- **Multi-Factor Security**: MANDATORY email OTP and optional 2FA for all financial interactions.
- **Advanced Analytics**: Visual performance tracking for win-ratio and gross yield.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB (Mongoose)
- **Styling**: Vanilla CSS (Premium Glassmorphism Design System)
- **Security**: JWT, Bcrypt, TOTP, SMTP-based OTP

## Deployment Readiness

### Environment Variables

Ensure the following variables are set in your production environment:

```env
MONGODB_URI=
JWT_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
NEXT_PUBLIC_APP_URL=https://goldxchange.org
```

### Production Build

```bash
npm run build
npm start
```

## Security Note

Internal debug routes such as `/api/auth/mock-emails` are disabled by default in production.

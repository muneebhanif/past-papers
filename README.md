# must past papers

Full-stack app built with React + Vite + Tailwind + Convex + ImageKit + Google OAuth.

## Features

- Google OAuth only authentication
- Guest browsing for approved papers
- Authenticated users can upload, like, and comment
- Admin moderation (approve/reject pending uploads)
- Convex-only data access (no direct DB calls from frontend)
- Signed ImageKit uploads (private key stays backend-only)
- Infinite feed scroll + image lazy loading + ImageKit transformations

## Stitch design assets

The requested Stitch screen files are available at:

- [../stitch_login_sign_up/main_feed_facebook_style_desktop/code.html](../stitch_login_sign_up/main_feed_facebook_style_desktop/code.html)
- [../stitch_login_sign_up/main_feed_facebook_style_desktop/screen.png](../stitch_login_sign_up/main_feed_facebook_style_desktop/screen.png)

## Setup

1. Install dependencies:
	- `npm install`

2. Create local env file from [.env.example](.env.example):
	- `cp .env.example .env.local`

3. Set Convex environment variables in your Convex dashboard:
	- `AUTH_GOOGLE_ID`
	- `AUTH_GOOGLE_SECRET`
	- `IMAGEKIT_PUBLIC_KEY`
	- `IMAGEKIT_PRIVATE_KEY`
	- `IMAGEKIT_URL_ENDPOINT`
	- `ADMIN_EMAILS`

4. Google OAuth redirect URI to add in Google Console:
	- `https://elegant-lark-641.convex.site/api/auth/callback/google`

5. Run Convex + frontend:
	- `npm run convex:dev`
	- `npm run dev`

## Security notes

- Private keys are never used in frontend code.
- All write operations validate identity in Convex mutations/actions.
- Upload signing is done in Convex action only.

# past-papers
# past-papers

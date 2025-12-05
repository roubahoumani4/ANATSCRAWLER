# LinkedIn Scraper Integration

This document describes how to configure and use the LinkedIn Profile Scraper feature integrated into the ANAT Security OSINT Platform.

## Overview

The LinkedIn scraper uses [linkedin-profile-scraper](https://github.com/josephlimtech/linkedin-profile-scraper-api) to extract structured profile data from LinkedIn. All scraped profiles are stored in MongoDB for later analysis.

## Features

- **Profile Scraping**: Extract complete LinkedIn profiles including work experience, education, skills, and more
- **MongoDB Storage**: All profiles are automatically saved to MongoDB
- **Search & Browse**: Search through scraped profiles and view detailed information
- **JSON Export**: Download profile data as JSON files
- **Real-time Updates**: Profiles can be re-scraped to get latest information

## Setup Instructions

### 1. Get LinkedIn Session Cookie

To scrape LinkedIn profiles, you need a valid session cookie (`li_at`):

1. Create a LinkedIn account (or use an existing one)
2. Enable all privacy options to minimize profile visit notifications
3. Log in to LinkedIn in your browser
4. Open Developer Tools (F12)
5. Go to Application > Cookies > https://www.linkedin.com
6. Find the cookie named `li_at`
7. Copy its value

### 2. Configure Environment Variable

#### Local Development

Add to your `.env` file or `server/config.dev.env`:

```bash
LINKEDIN_SESSION_COOKIE=your_li_at_cookie_value_here
```

#### Production Deployment

Add the LinkedIn session cookie to your GitHub Secrets:

1. Go to your repository on GitHub
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `LINKEDIN_SESSION_COOKIE`
5. Value: Your `li_at` cookie value
6. Click "Add secret"

The deployment workflow will automatically configure this during deployment.

### 3. Install Dependencies

The LinkedIn scraper package is already included in `package.json`:

```bash
npm install
```

This will install `linkedin-profile-scraper` along with all other dependencies.

### 4. Database Setup

The LinkedIn profiles are stored in MongoDB. No additional setup is required - the schema will be created automatically when you scrape your first profile.

## Usage

### Via Web Interface

1. Navigate to **Discovery > LinkedIn Scraper** in the sidebar
2. Enter a LinkedIn profile URL (e.g., `https://www.linkedin.com/in/username/`)
3. Click "Scrape Profile"
4. View the results in the profiles list
5. Click on a profile to see detailed information
6. Download JSON data if needed

### Via API

#### Scrape a Profile

```bash
POST /api/v1/linkedin/scrape
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "profileUrl": "https://www.linkedin.com/in/username/"
}
```

#### Get All Profiles

```bash
GET /api/v1/linkedin/profiles?limit=50&skip=0
Authorization: Bearer <your_jwt_token>
```

#### Search Profiles

```bash
GET /api/v1/linkedin/search?q=software%20engineer
Authorization: Bearer <your_jwt_token>
```

#### Get Specific Profile

```bash
GET /api/v1/linkedin/profile?url=https://www.linkedin.com/in/username/
Authorization: Bearer <your_jwt_token>
```

#### Delete Profile

```bash
DELETE /api/v1/linkedin/profile/:profileId
Authorization: Bearer <your_jwt_token>
```

## Data Structure

Scraped profiles contain:

- **User Profile**: Name, title, location, photo, description, LinkedIn URL
- **Experiences**: Work history with titles, companies, dates, descriptions
- **Education**: Schools, degrees, fields of study
- **Skills**: Skill names with endorsement counts
- **Volunteer Work**: Volunteer positions and organizations
- **Metadata**: Scrape timestamp, scraper user ID

## Troubleshooting

### Session Expired Error

If you get a "Session expired" error:

1. The `li_at` cookie has expired
2. Get a new cookie following the setup instructions
3. Update the `LINKEDIN_SESSION_COOKIE` environment variable
4. Restart the application (local) or update the GitHub Secret (production)

### Rate Limiting

LinkedIn has usage limits. Please respect them:

- Don't scrape too many profiles in a short time
- Use reasonable delays between scrapes
- Consider LinkedIn's [Commercial Use Limit](https://www.linkedin.com/help/linkedin/answer/52950)

### Scraping Fails

If scraping fails:

1. Verify the LinkedIn URL is correct and includes `/in/`
2. Check that the session cookie is properly configured
3. Ensure the LinkedIn account is logged in and active
4. Check the server logs for detailed error messages

## Performance Notes

- Initial scrape takes a few seconds per profile (needs to scroll and expand elements)
- Profiles are cached in MongoDB to avoid repeated scraping
- The scraper uses Puppeteer with ~75MB memory overhead when idle
- `keepAlive: true` is enabled for faster recurring scrapes

## Security Considerations

- **Session Cookie**: Treat the `li_at` cookie as a password - never commit it to version control
- **Rate Limiting**: The API endpoints are protected by authentication
- **Data Privacy**: Scraped data should be handled according to your privacy policy
- **Legal Compliance**: Ensure your use complies with LinkedIn's Terms of Service and applicable laws

## Architecture

```
Client (React)
    ↓
Backend API (/api/v1/linkedin/*)
    ↓
LinkedIn Service (linkedin.service.ts)
    ↓
linkedin-profile-scraper (NPM package)
    ↓
MongoDB (LinkedInProfile model)
```

## Files Modified/Created

- `server/models/LinkedInProfile.ts` - MongoDB schema
- `server/services/linkedin.service.ts` - LinkedIn scraper service
- `server/routes/linkedin/index.ts` - API routes
- `client/src/pages/LinkedInScraperPage.tsx` - Frontend UI
- `.github/workflows/deploy.yml` - Deployment configuration
- `package.json` - Added linkedin-profile-scraper dependency

## Support

For issues related to:
- **ANAT Platform**: Open an issue in this repository
- **LinkedIn Scraper Library**: See [josephlimtech/linkedin-profile-scraper-api](https://github.com/josephlimtech/linkedin-profile-scraper-api)

## Commercial Alternative

For production use at scale, consider [Proxycurl LinkedIn APIs](https://nubela.co/proxycurl) which provides:
- Higher rate limits (300 requests/minute)
- GDPR/CCPA/SOC2 compliance
- Fast responses (~2 seconds)
- Fresh data (88% real-time)
- No session management required

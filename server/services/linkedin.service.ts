import { LinkedInProfile } from '../models/LinkedInProfile';

// Type definitions for the scraper
interface ScraperConfig {
  sessionCookieValue: string;
  keepAlive?: boolean;
}

interface ScraperResult {
  userProfile: any;
  experiences: any[];
  education: any[];
  volunteerExperiences: any[];
  skills: any[];
}

/**
 * LinkedIn Profile Scraper Service
 * Wrapper around linkedin-profile-scraper-api
 */
class LinkedInScraperService {
  private scraper: any = null;
  private sessionCookie: string;

  constructor() {
    this.sessionCookie = process.env.LINKEDIN_SESSION_COOKIE || '';
  }

  /**
   * Initialize the scraper
   */
  async initialize(): Promise<void> {
    if (!this.sessionCookie) {
      throw new Error('LinkedIn session cookie not configured. Please set LINKEDIN_SESSION_COOKIE environment variable.');
    }

    try {
      // Dynamically import the scraper (will be installed via npm)
      const { LinkedInProfileScraper } = await import('linkedin-profile-scraper');
      
      console.log('Initializing LinkedIn scraper with cookie:', this.sessionCookie.substring(0, 20) + '...');
      
      this.scraper = new LinkedInProfileScraper({
        sessionCookieValue: this.sessionCookie,
        keepAlive: false, // Don't keep alive to ensure fresh session each time
        timeout: 30000
      });

      await this.scraper.setup();
      console.log('LinkedIn scraper initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize LinkedIn scraper:', error);
      throw new Error(`LinkedIn scraper initialization failed: ${error.message}`);
    }
  }

  /**
   * Normalize LinkedIn profile URL
   * Removes spaces, ensures proper format
   */
  private normalizeLinkedInUrl(url: string): string {
    // Remove spaces and replace with nothing (LinkedIn usernames don't have spaces)
    let normalized = url.trim().replace(/\s+/g, '');
    
    // Ensure it starts with https://
    if (!normalized.startsWith('http')) {
      normalized = 'https://www.linkedin.com/in/' + normalized;
    }
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    return normalized;
  }

  /**
   * Scrape a LinkedIn profile
   */
  async scrapeProfile(profileUrl: string, userId?: string): Promise<any> {
    // Always reinitialize for each scrape to ensure fresh session
    this.scraper = null;
    await this.initialize();

    try {
      // Normalize the URL before scraping
      const normalizedUrl = this.normalizeLinkedInUrl(profileUrl);
      console.log(`Scraping LinkedIn profile: ${normalizedUrl}`);
      
      const result: ScraperResult = await this.scraper.run(normalizedUrl);
      
      // Save to database using normalized URL
      const savedProfile = await this.saveProfile(normalizedUrl, result, userId);
      
      // Clean up after scraping
      if (this.scraper && this.scraper.close) {
        await this.scraper.close();
      }
      this.scraper = null;
      
      return {
        success: true,
        data: savedProfile,
        message: 'Profile scraped successfully'
      };
    } catch (error: any) {
      console.error('Error scraping LinkedIn profile:', error);
      
      // Clean up on error
      if (this.scraper && this.scraper.close) {
        try {
          await this.scraper.close();
        } catch (e) {
          console.error('Error closing scraper:', e);
        }
      }
      this.scraper = null;
      
      // Check if session expired
      if (error.name === 'SessionExpired') {
        throw new Error('LinkedIn session expired. Please update the session cookie.');
      }
      
      throw new Error(`Failed to scrape profile: ${error.message}`);
    }
  }

  /**
   * Save scraped profile to MongoDB
   */
  private async saveProfile(profileUrl: string, data: ScraperResult, userId?: string): Promise<any> {
    try {
      // Check if profile already exists
      const existingProfile = await LinkedInProfile.findOne({ profileUrl });
      
      if (existingProfile) {
        // Update existing profile
        existingProfile.userProfile = data.userProfile;
        existingProfile.experiences = data.experiences;
        existingProfile.education = data.education;
        existingProfile.volunteerExperiences = data.volunteerExperiences;
        existingProfile.skills = data.skills;
        existingProfile.scrapedAt = new Date();
        existingProfile.scrapedBy = userId;
        existingProfile.rawData = data;
        
        await existingProfile.save();
        return existingProfile;
      } else {
        // Create new profile
        const newProfile = new LinkedInProfile({
          profileUrl,
          userProfile: data.userProfile,
          experiences: data.experiences,
          education: data.education,
          volunteerExperiences: data.volunteerExperiences,
          skills: data.skills,
          scrapedAt: new Date(),
          scrapedBy: userId,
          rawData: data
        });
        
        await newProfile.save();
        return newProfile;
      }
    } catch (error: any) {
      console.error('Error saving profile to database:', error);
      throw new Error(`Failed to save profile: ${error.message}`);
    }
  }

  /**
   * Get all scraped profiles
   */
  async getAllProfiles(limit: number = 100, skip: number = 0): Promise<any> {
    try {
      const profiles = await LinkedInProfile.find()
        .sort({ scrapedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
      
      const total = await LinkedInProfile.countDocuments();
      
      return {
        profiles,
        total,
        limit,
        skip
      };
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }
  }

  /**
   * Search profiles by name or title
   */
  async searchProfiles(query: string, limit: number = 50): Promise<any> {
    try {
      const profiles = await LinkedInProfile.find({
        $text: { $search: query }
      })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();
      
      return {
        profiles,
        query,
        count: profiles.length
      };
    } catch (error: any) {
      console.error('Error searching profiles:', error);
      throw new Error(`Failed to search profiles: ${error.message}`);
    }
  }

  /**
   * Get profile by URL
   */
  async getProfileByUrl(profileUrl: string): Promise<any> {
    try {
      const profile = await LinkedInProfile.findOne({ profileUrl }).lean();
      return profile;
    } catch (error: any) {
      console.error('Error fetching profile by URL:', error);
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }
  }

  /**
   * Delete profile by ID
   */
  async deleteProfile(profileId: string): Promise<boolean> {
    try {
      const result = await LinkedInProfile.findByIdAndDelete(profileId);
      return !!result;
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      throw new Error(`Failed to delete profile: ${error.message}`);
    }
  }

  /**
   * Cleanup - close the scraper
   */
  async cleanup(): Promise<void> {
    if (this.scraper) {
      // The scraper will automatically cleanup on process exit
      console.log('LinkedIn scraper cleanup');
    }
  }
}

// Singleton instance
export const linkedInScraperService = new LinkedInScraperService();

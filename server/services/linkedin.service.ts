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
      
      this.scraper = new LinkedInProfileScraper({
        sessionCookieValue: this.sessionCookie,
        keepAlive: true // Keep alive for faster recurring scrapes
      });

      await this.scraper.setup();
      console.log('LinkedIn scraper initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize LinkedIn scraper:', error);
      throw new Error(`LinkedIn scraper initialization failed: ${error.message}`);
    }
  }

  /**
   * Scrape a LinkedIn profile
   */
  async scrapeProfile(profileUrl: string, userId?: string): Promise<any> {
    if (!this.scraper) {
      await this.initialize();
    }

    try {
      console.log(`Scraping LinkedIn profile: ${profileUrl}`);
      
      const result: ScraperResult = await this.scraper.run(profileUrl);
      
      // Save to database
      const savedProfile = await this.saveProfile(profileUrl, result, userId);
      
      return {
        success: true,
        data: savedProfile,
        message: 'Profile scraped successfully'
      };
    } catch (error: any) {
      console.error('Error scraping LinkedIn profile:', error);
      
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

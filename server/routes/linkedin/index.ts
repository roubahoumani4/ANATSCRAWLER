import { Router, Request, Response } from 'express';
import { linkedInScraperService } from '../../services/linkedin.service';
import authenticateToken from '../../middleware/auth';

const router = Router();

/**
 * POST /api/v1/linkedin/scrape
 * Scrape a LinkedIn profile
 */
router.post('/scrape', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { profileUrl } = req.body;

    if (!profileUrl) {
      return res.status(400).json({
        success: false,
        error: 'profileUrl is required'
      });
    }

    // Validate LinkedIn URL
    if (!profileUrl.includes('linkedin.com/in/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid LinkedIn profile URL. URL must contain "linkedin.com/in/"'
      });
    }

    const userId = (req as any).user?.id;
    const result = await linkedInScraperService.scrapeProfile(profileUrl, userId);

    res.json(result);
  } catch (error: any) {
    console.error('Error in scrape endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to scrape LinkedIn profile'
    });
  }
});

/**
 * GET /api/v1/linkedin/profiles
 * Get all scraped profiles with pagination
 */
router.get('/profiles', authenticateToken, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;

    const result = await linkedInScraperService.getAllProfiles(limit, skip);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch profiles'
    });
  }
});

/**
 * GET /api/v1/linkedin/search
 * Search profiles by name or title
 */
router.get('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const result = await linkedInScraperService.searchProfiles(query, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error searching profiles:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search profiles'
    });
  }
});

/**
 * GET /api/v1/linkedin/profile/:profileUrl
 * Get a specific profile by URL
 */
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const profileUrl = req.query.url as string;

    if (!profileUrl) {
      return res.status(400).json({
        success: false,
        error: 'Profile URL is required'
      });
    }

    const profile = await linkedInScraperService.getProfileByUrl(profileUrl);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch profile'
    });
  }
});

/**
 * DELETE /api/v1/linkedin/profile/:id
 * Delete a profile by ID
 */
router.delete('/profile/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await linkedInScraperService.deleteProfile(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete profile'
    });
  }
});

export default router;

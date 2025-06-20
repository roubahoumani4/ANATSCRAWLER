import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import mongoose from 'mongoose';
import { 
  User, 
  SearchHistory, 
  SearchResult, 
  UserSearchResult, 
  Session 
} from '../models/UserEnhanced';
import { 
  users, 
  searchHistory, 
  searchResults, 
  userSearchResults, 
  sessions,
  userPreferences 
} from '../../shared/schema';

async function main() {
  // Connect to PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URL || 'mongodb://192.168.1.110:27017/anatscrawler');

  try {
    // Migrate Users and their preferences
    const pgUsers = await db.select().from(users);
    const pgPreferences = await db.select().from(userPreferences);

    for (const pgUser of pgUsers) {
      const userPrefs = pgPreferences.find(p => p.userId === pgUser.id);
      
      await User.create({
        username: pgUser.username,
        password: pgUser.password, // Note: passwords are already hashed
        email: pgUser.email,
        fullName: pgUser.fullName,
        organization: pgUser.organization,
        department: pgUser.department,
        jobPosition: pgUser.jobPosition,
        lastLogin: pgUser.lastLogin,
        isActive: pgUser.isActive,
        preferences: userPrefs ? {
          theme: userPrefs.theme,
          language: userPrefs.language,
          timezone: userPrefs.timezone,
          autoLogoutTime: userPrefs.autoLogoutTime,
          mfaEnabled: userPrefs.mfaEnabled,
          showIndexedFiles: userPrefs.showIndexedFiles,
          showRecentSearches: userPrefs.showRecentSearches
        } : undefined
      });
    }

    // Migrate Search History
    const pgSearchHistory = await db.select().from(searchHistory);
    for (const record of pgSearchHistory) {
      const user = await User.findOne({ username: (pgUsers.find(u => u.id === record.userId))?.username });
      if (user) {
        await SearchHistory.create({
          userId: user._id,
          query: record.query,
          timestamp: record.timestamp
        });
      }
    }

    // Migrate Search Results
    const pgSearchResults = await db.select().from(searchResults);
    for (const result of pgSearchResults) {
      await SearchResult.create({
        collection: result.collection,
        folder: result.folder,
        fileName: result.fileName,
        content: result.content
      });
    }

    // Migrate User Search Results
    const pgUserSearchResults = await db.select().from(userSearchResults);
    for (const record of pgUserSearchResults) {
      const user = await User.findOne({ username: (pgUsers.find(u => u.id === record.userId))?.username });
      const searchHistoryRecord = await SearchHistory.findOne({ 
        query: (pgSearchHistory.find(h => h.id === record.searchHistoryId))?.query 
      });
      const searchResult = await SearchResult.findOne({ 
        fileName: (pgSearchResults.find(r => r.id === record.resultId))?.fileName 
      });

      if (user && searchHistoryRecord && searchResult) {
        await UserSearchResult.create({
          userId: user._id,
          searchHistoryId: searchHistoryRecord._id,
          resultId: searchResult._id
        });
      }
    }

    // Migrate Sessions
    const pgSessions = await db.select().from(sessions);
    for (const session of pgSessions) {
      const user = await User.findOne({ username: (pgUsers.find(u => u.id === session.userId))?.username });
      if (user) {
        await Session.create({
          userId: user._id,
          token: session.token,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress,
          lastActive: session.lastActive,
          expiresAt: session.expiresAt
        });
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  await mongoose.disconnect();
  await pool.end();
}

main();

import { Schema, model, Document } from 'mongoose';

export interface ILocation {
  city?: string;
  province?: string;
  country?: string;
}

export interface IUserProfile {
  fullName?: string;
  title?: string;
  location?: ILocation;
  photo?: string;
  description?: string;
  url: string;
}

export interface IExperience {
  title: string;
  company: string;
  employmentType?: string;
  location?: ILocation;
  startDate?: string;
  endDate?: string;
  endDateIsPresent: boolean;
  description?: string;
  durationInDays?: number;
}

export interface IEducation {
  schoolName: string;
  degreeName?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  durationInDays?: number;
}

export interface IVolunteerExperience {
  title: string;
  company: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationInDays?: number;
}

export interface ISkill {
  skillName: string;
  endorsementCount: number;
}

export interface ILinkedInProfile extends Document {
  profileUrl: string;
  userProfile: IUserProfile;
  experiences: IExperience[];
  education: IEducation[];
  volunteerExperiences: IVolunteerExperience[];
  skills: ISkill[];
  scrapedAt: Date;
  scrapedBy?: string;
  rawData?: any;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema({
  city: { type: String },
  province: { type: String },
  country: { type: String }
}, { _id: false });

const UserProfileSchema = new Schema({
  fullName: { type: String, required: false },
  title: { type: String },
  location: LocationSchema,
  photo: { type: String },
  description: { type: String },
  url: { type: String, required: true }
}, { _id: false });

const ExperienceSchema = new Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  employmentType: { type: String },
  location: LocationSchema,
  startDate: { type: String },
  endDate: { type: String },
  endDateIsPresent: { type: Boolean, default: false },
  description: { type: String },
  durationInDays: { type: Number }
}, { _id: false });

const EducationSchema = new Schema({
  schoolName: { type: String, required: true },
  degreeName: { type: String },
  fieldOfStudy: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  durationInDays: { type: Number }
}, { _id: false });

const VolunteerExperienceSchema = new Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  durationInDays: { type: Number }
}, { _id: false });

const SkillSchema = new Schema({
  skillName: { type: String, required: true },
  endorsementCount: { type: Number, default: 0 }
}, { _id: false });

const LinkedInProfileSchema = new Schema({
  profileUrl: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  userProfile: { 
    type: UserProfileSchema, 
    required: true 
  },
  experiences: [ExperienceSchema],
  education: [EducationSchema],
  volunteerExperiences: [VolunteerExperienceSchema],
  skills: [SkillSchema],
  scrapedAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  scrapedBy: { 
    type: String,
    index: true 
  },
  rawData: { 
    type: Schema.Types.Mixed 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
LinkedInProfileSchema.index({ 'userProfile.fullName': 'text', 'userProfile.title': 'text' });
LinkedInProfileSchema.index({ scrapedAt: -1 });

export const LinkedInProfile = model<ILinkedInProfile>('LinkedInProfile', LinkedInProfileSchema);

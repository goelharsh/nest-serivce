import { Schema, Document, model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

// Interface for the Client Document (for TypeScript)
export interface IClient extends Document {
  firstName: string;
  lastName: string;
  middleName?: string;
  nickname?: string;
  emailAddresses: string[];
  phoneNumbers: string[];
  defaultEmail: string;
  defaultPhoneNumber: string;
  password: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  country?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  source?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  clientLanguage: string;
  verificationStatus: string;
  verificationDetails: object;
  notes: string;
  status: string;
  preferences?: {
    notifications?: boolean;
    marketing?: boolean;
    theme?: string;
  };
  tags?: string[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Mongoose schema definition for the Client collection
const clientSchema = new Schema<IClient>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    nickname: {
      type: String,
      trim: true,
      index: true,
    },
    emailAddresses: {
      type: [String],
      default: [],
      validate: {
        validator: function(emails: string[]) {
          return emails.every(email => /^\S+@\S+\.\S+$/.test(email));
        },
        message: 'Invalid email format'
      }
    },
    phoneNumbers: {
      type: [String],
      default: [],
    },
    defaultEmail: {
      type: String,
      required: true,
      unique: true,
      default: function (this: any) {
        return this.emailAddresses.length > 0 ? this.emailAddresses[0] : '';
      },
    },
    defaultPhoneNumber: {
      type: String,
      default: function (this: any) {
        return this.phoneNumbers.length > 0 ? this.phoneNumbers[0] : '';
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    country: {
      type: String,
      trim: true,
      index: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
    },
    source: {
      type: String,
      trim: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    clientLanguage: {
      type: String,
      default: 'English',
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified'],
      default: 'unverified',
      index: true,
    },
    verificationDetails: {
      type: Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'deleted'],
      default: 'active',
      index: true,
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      marketing: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        default: 'light',
      }
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    }
  },
  {
    timestamps: true,
    collection: 'clients',
  }
);

// Compound index for name searches
clientSchema.index({ firstName: 1, lastName: 1 });

// Virtual for full name
clientSchema.virtual('fullName').get(function(this: IClient) {
  return [this.firstName, this.middleName, this.lastName]
    .filter(Boolean)
    .join(' ');
});

// Pre-save middleware to enforce email lowercase and hash password
clientSchema.pre('save', async function(next) {
  if (this.isModified('emailAddresses')) {
    this.emailAddresses = this.emailAddresses.map(email => email.toLowerCase());
  }
  if (this.isModified('defaultEmail')) {
    this.defaultEmail = this.defaultEmail.toLowerCase();
  }
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare passwords
clientSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Mongoose model for the Client schema
export const Client = model<IClient>('Client', clientSchema);

export { clientSchema }
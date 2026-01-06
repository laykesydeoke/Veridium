# Basename Identity Service

## Overview
The Basename service provides comprehensive identity resolution and management for Veridium users, integrating with Base's onchain identity system.

## Features

### Basename Resolution
- Forward resolution: basename → address
- Reverse resolution: address → basename
- Batch resolution for multiple basenames/addresses
- Automatic caching with Redis (1 hour TTL)

### Validation
- Format validation (3-30 chars, lowercase alphanumeric + hyphens)
- Must end with `.base.eth`
- Cannot start or end with hyphen
- Availability checking

### Profile Management
- Complete CRUD operations
- Search by name, basename, or address
- Profile analytics and statistics
- Session history tracking
- Batch profile fetching

### Avatar Handling
- Deterministic avatar generation (Dicebear)
- Gravatar support
- Custom avatar URL validation
- Preferred avatar selection logic

### Signature Verification
- Challenge-based authentication
- EIP-191 signature verification
- Time-limited challenges (5 minutes)
- Automatic verification status updates

## API Endpoints

### Basename Routes

#### GET /api/basename/resolve/:name
Resolve basename to address.

**Response:**
```json
{
  "basename": "alice.base.eth",
  "address": "0x1234..."
}
```

#### GET /api/basename/reverse/:address
Reverse resolve address to basename.

**Response:**
```json
{
  "address": "0x1234...",
  "basename": "alice.base.eth"
}
```

#### GET /api/basename/available/:name
Check if basename is available.

**Response:**
```json
{
  "basename": "alice.base.eth",
  "available": false,
  "reason": "Basename already registered"
}
```

#### GET /api/basename/info/:name
Get comprehensive basename information.

**Response:**
```json
{
  "info": {
    "name": "alice.base.eth",
    "address": "0x1234...",
    "avatar": "https://...",
    "description": "...",
    "twitter": "@alice",
    "github": "alice"
  }
}
```

#### POST /api/basename/batch/resolve
Batch resolve basenames (max 50).

**Request:**
```json
{
  "basenames": ["alice.base.eth", "bob.base.eth"]
}
```

**Response:**
```json
{
  "results": {
    "alice.base.eth": "0x1234...",
    "bob.base.eth": "0x5678..."
  }
}
```

#### POST /api/basename/validate
Validate basename format.

**Response:**
```json
{
  "basename": "test-name.base.eth",
  "valid": true,
  "rules": {
    "minLength": 3,
    "maxLength": 30,
    "suffix": ".base.eth",
    "allowedCharacters": "lowercase letters, numbers, and hyphens"
  }
}
```

### Profile Routes

#### GET /api/profiles/address/:address
Get profile by wallet address.

#### GET /api/profiles/basename/:basename
Get profile by basename.

#### GET /api/profiles/search?q=query
Search profiles by name or basename.

#### GET /api/profiles/me
Get current authenticated user profile.

#### PATCH /api/profiles/me
Update current user profile.

**Request:**
```json
{
  "basename": "alice.base.eth",
  "displayName": "Alice",
  "bio": "Philosopher and debater",
  "avatarUrl": "https://..."
}
```

#### GET /api/profiles/:address/analytics
Get profile analytics and statistics.

**Response:**
```json
{
  "analytics": {
    "totalSessions": 25,
    "sessionsWon": 15,
    "totalEvaluations": 50,
    "totalAchievements": 5,
    "winRate": 60
  }
}
```

#### GET /api/profiles/:address/history
Get user session history.

#### POST /api/profiles/batch
Batch fetch profiles (max 50).

### Auth Enhancements

#### POST /api/auth/challenge
Get signature challenge for wallet verification.

**Request:**
```json
{
  "address": "0x1234..."
}
```

**Response:**
```json
{
  "challenge": {
    "address": "0x1234...",
    "message": "Sign this message to verify...",
    "timestamp": 1234567890
  }
}
```

## Services

### BasenameService
Located: `src/services/basename.ts`

Methods:
- `validateBasename(basename: string): boolean`
- `resolveBasename(basename: string): Promise<string | null>`
- `reverseResolve(address: string): Promise<string | null>`
- `batchResolve(basenames: string[]): Promise<Map<string, string | null>>`
- `isAvailable(basename: string): Promise<boolean>`
- `getBasenameInfo(basename: string): Promise<BasenameInfo | null>`
- `clearCache(basenameOrAddress: string): Promise<void>`

### ProfileService
Located: `src/services/profile.ts`

Methods:
- `getProfileByAddress(address: string): Promise<UserProfile | null>`
- `getProfileByBasename(basename: string): Promise<UserProfile | null>`
- `updateProfile(userId: string, data: ProfileUpdateData): Promise<UserProfile>`
- `searchProfiles(query: string, limit?: number): Promise<UserProfile[]>`
- `getProfileAnalytics(address: string): Promise<Analytics>`
- `getProfileHistory(address: string, limit?: number): Promise<History[]>`
- `batchGetProfiles(addresses: string[]): Promise<Map<string, UserProfile>>`

### AvatarService
Located: `src/services/avatar.ts`

Methods:
- `generateAvatar(address: string, style?: string): string`
- `getGravatar(email: string, size?: number): string`
- `validateAvatarUrl(url: string): boolean`
- `getPreferredAvatar(user): Promise<string>`

### VerificationService
Located: `src/services/verification.ts`

Methods:
- `generateChallenge(address: string): VerificationChallenge`
- `verifySignature(address: string, message: string, signature: string): Promise<boolean>`
- `verifyChallengeAndUpdateUser(address, message, signature): Promise<boolean>`
- `isValidAddress(address: string): boolean`

## Caching Strategy

All basename resolutions and profile data are cached in Redis:

- **Basename resolution**: 1 hour TTL
- **Basename info**: 30 minutes TTL
- **Profile data**: 5 minutes TTL

Cache keys:
- `basename:resolve:{name}`
- `basename:reverse:{address}`
- `basename:info:{name}`
- `profile:{address}`

## Testing

Run basename validation tests:
```bash
pnpm test src/utils/basename.test.ts
```

## Utilities

### ProfileHelpers
Located: `src/utils/profile-helpers.ts`

- Calculate profile completeness percentage
- Get display name with priority logic
- Sanitize bio text
- Validate email format
- Extract username from basename
- Format large numbers

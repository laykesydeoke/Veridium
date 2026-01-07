# Evaluation & Scoring System

The evaluation system implements weighted voting with credibility-based scoring to determine session outcomes.

## Overview

Evaluators submit votes with confidence levels and reasoning. Each evaluation is assigned a weight based on:
- Evaluator credibility score
- Confidence level
- Submission timing
- Reasoning quality

## Components

### 1. AssessmentAggregator
Aggregates evaluations and calculates session statistics.

**Key Functions:**
- `getAggregatedAssessment()` - Get voting summary
- `getEvaluationMetrics()` - Quality and consensus metrics
- `getEvaluationProgress()` - Real-time progress tracking
- `getEvaluationDistribution()` - Weight/confidence distribution

### 2. ScoringAlgorithm
Calculates evaluation weights using multi-factor formula.

**Weight Calculation:**
```
Final Weight = Base Weight (100) ×
              Credibility Multiplier (0.5-2.0x) ×
              Confidence Multiplier (0.5-1.5x) ×
              Timing Multiplier (0.8-1.2x) ×
              Reasoning Quality Multiplier (0.8-1.3x)

Result: Clamped to 10-300 range
```

**Credibility Multiplier:**
- New evaluators (< 5 evals): 1.0x
- Based on credibility score (0-100): maps to 0.5-2.0x
- Accuracy bonus: >75% accuracy gets 1.1x
- Experience bonus: up to 0.2x for 100+ evaluations

**Confidence Multiplier:**
- 80-100: 1.5x
- 60-79: 1.2x
- 40-59: 1.0x
- 20-39: 0.8x
- 0-19: 0.5x

**Timing Multiplier:**
- First 20% of period: 1.2x (early bonus)
- Middle 60%: 1.0x (neutral)
- Last 20%: 0.8x (late penalty)

**Reasoning Quality Multiplier:**
- No reasoning: 0.8x
- Too short (< 20 chars): 0.9x
- Good length (50-500 chars, 10-100 words): 1.3x
- Acceptable: 1.1x
- Too long (> 1000 chars): 0.95x

### 3. OutcomeCalculator
Determines winners and calculates rewards.

**Outcome Determination:**
1. Compare total weights (initiator vs challenger)
2. If tied, use tie-breaking logic:
   - Method 1: Higher vote count
   - Method 2: Higher average confidence
   - Method 3: Earlier average submission time
   - Final: Declare true tie (rare)

**Minimum Requirements:**
- At least 3 evaluations required
- Sessions with fewer are cancelled

**Reward Distribution:**
- Platform fee: 5% of total pool
- Evaluator pool: 10% of remaining
- Winner gets: Rest of pool
- Evaluators split pool proportionally by weight (correct votes only)

### 4. EvaluationValidator
Validates evaluation submissions and eligibility.

**Validation Checks:**
- Session in voting phase
- Voting period not expired
- Evaluator not a participant
- No duplicate evaluations
- Confidence 0-100
- Reasoning 10-2000 characters
- Account age > 1 hour
- Rate limit: 10 evals/hour

**Spam Detection:**
- Duplicate reasoning
- Very short reasoning (< 10 chars)
- Repeated character patterns
- Gibberish detection (no vowels, all caps, no spaces)

### 5. EvaluationPeriodManager
Manages voting periods and auto-finalization.

**Features:**
- Start voting with configurable duration (default 24h)
- Extend period (max 2 extensions)
- Auto-finalize expired sessions every 5 minutes
- Track nearing deadline sessions
- Calculate optimal duration based on complexity

**Duration Calculation:**
- Base: 24 hours
- Complex topics: +24 hours
- Simple topics: -12 hours
- High wager (>1000): +12 hours
- Has evidence: +6 hours
- Maximum: 72 hours

### 6. EvaluationAnalytics
Provides insights and performance tracking.

**Metrics:**
- Evaluator performance (accuracy, streaks)
- Evaluation trends over time
- Top evaluators leaderboard
- Consensus strength distribution
- Quality score distribution
- Timing patterns (by hour/day)
- Evaluator impact analysis

## API Endpoints

### Submission
**POST /api/evaluations**
Submit evaluation for a session.

```json
{
  "sessionId": "uuid",
  "vote": true,
  "confidence": 85,
  "reasoning": "Detailed reasoning..."
}
```

Response includes weight breakdown and quality score.

### Retrieval
- **GET /api/evaluations/:id** - Get single evaluation
- **GET /api/evaluations/session/:sessionId** - Get session evaluations
- **GET /api/evaluations/user/:address** - Get user's evaluations

### Analytics
- **GET /api/evaluations/assessment/:sessionId** - Aggregated assessment
- **GET /api/evaluations/metrics/:sessionId** - Quality metrics
- **GET /api/evaluations/progress/:sessionId** - Real-time progress
- **GET /api/evaluations/distribution/:sessionId** - Distribution charts
- **GET /api/evaluations/outcome/:sessionId** - Outcome prediction
- **GET /api/evaluations/participation/:sessionId** - Evaluator participation

### Management
- **GET /api/evaluations/eligibility/:sessionId** - Check if user can evaluate
- **POST /api/evaluations/finalize/:sessionId** - Finalize session (admin)

## Database Schema

### evaluations table
```sql
CREATE TABLE evaluations (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  evaluator_address VARCHAR(42),
  vote BOOLEAN,
  weight INTEGER,
  confidence INTEGER,
  reasoning TEXT,
  quality_score INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Quality Scoring

Evaluations receive a quality score (0-100) based on:
- Reasoning length: up to 50 points
- Confidence level: up to 30 points
- Final weight: up to 20 points

## Spam Prevention

**Detection Methods:**
- Duplicate reasoning check
- Minimum length enforcement
- Pattern matching (repeated chars)
- Gibberish detection
- Rate limiting (10/hour)
- Account age requirement (1 hour)

**Penalties:**
- Spam evaluations rejected
- Quality multiplier reduced
- Rate limit enforcement

## Consensus Detection

**Consensus Levels:**
- **Strong** (≥70% margin): Clear winner
- **Moderate** (50-69% margin): Solid majority
- **Weak** (30-49% margin): Slight advantage
- **Divided** (<30% margin): Close call

Consensus strength = `(|initiatorWeight - challengerWeight| / totalWeight) * 100`

## Usage Example

```typescript
// Submit evaluation
const evaluation = await fetch('/api/evaluations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sessionId: 'abc-123',
    vote: true,
    confidence: 85,
    reasoning: 'Strong evidence supports the initiator...'
  })
});

// Check eligibility first
const eligibility = await fetch('/api/evaluations/eligibility/abc-123', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Get real-time progress
const progress = await fetch('/api/evaluations/progress/abc-123');
// Returns: { current: 15, target: 10, percentage: 150, timeRemaining: 3600000 }

// Get outcome prediction
const outcome = await fetch('/api/evaluations/outcome/abc-123');
// Returns winner, rewards, win probability
```

## Best Practices

1. **For Evaluators:**
   - Provide detailed reasoning (50-500 chars optimal)
   - Be honest about confidence level
   - Submit early for timing bonus
   - Build credibility through accurate evaluations

2. **For Integration:**
   - Check eligibility before showing evaluation form
   - Display weight calculation breakdown
   - Show real-time progress and consensus
   - Implement anti-spam measures client-side too

3. **For Analytics:**
   - Cache aggregated assessments (5 min TTL)
   - Use real-time updates sparingly
   - Track evaluator performance over time
   - Monitor consensus patterns

## Monitoring

Key metrics to monitor:
- Average evaluation quality score
- Consensus distribution (strong vs divided)
- Evaluator participation rates
- Spam detection rate
- Auto-finalization success rate

## Troubleshooting

**Low participation:**
- Check voting period duration
- Review eligibility requirements
- Consider notification system

**High spam rate:**
- Tighten rate limits
- Increase account age requirement
- Add CAPTCHA for new users

**Skewed weights:**
- Review credibility algorithm
- Check for evaluation farming
- Verify weight normalization

## Future Enhancements

- Machine learning for spam detection
- Natural language processing for reasoning quality
- Predictive outcome modeling
- Dynamic duration based on participation
- Reputation decay over time
- Category-specific credibility scores

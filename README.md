# My Toolkit

## Free Time Matcher

The `free-time.html` tool helps choose the best thing to do from your saved resources.
It does not just filter items. It scores them, ranks them, and then shows the best fit first.

### Inputs

The matcher looks at three user inputs:

- `context`: where you are, like `home`, `work`, `commute`, or `cafe`
- `mins`: how much free time you have
- `energy`: your current energy level, from `dead` to `high`

Each saved resource can also include metadata:

- `energy`
- `ctx`
- `time`
- `subdivision`
- `level` for language resources

### High-Level Flow

1. Load all saved resources from every category: Islam, SWE, Languages, and Entertainment.
2. Normalize older saved data so legacy fields still work.
3. Score every resource against the current user inputs.
4. Drop very poor matches.
5. Sort the remaining resources from best match to worst match.
6. Show the best one first, then shuffle the rest so the user can still explore alternatives.

### Matching Rules

The scoring logic lives in `js/free-time.js`.

#### 1. Energy matching

- If a resource has `energy: "any"`, it gets a small positive score because it is flexible.
- If the resource energy is less than or equal to the user's energy, it gets a strong positive score.
- The closer the resource energy is to the user's energy, the better the score.
- If the resource needs more energy than the user has, it gets a penalty.

This means a `low` energy user is less likely to get a demanding SWE task, while a `high` energy user can still get easier resources if they fit well in other ways.

#### 2. Context matching

- Exact context matches score well.
- `any` context still works, but scores a little lower than an exact match.
- A clear mismatch gets a penalty.

Example:

- A commute-friendly podcast gets a boost while commuting.
- A home-only study resource loses points if the user is outside.

#### 3. Time matching

- If the resource fits inside the available time, it gets points.
- Resources that are closer to the available time tend to score better than very short ones.
- Resources that exceed the available time get penalized.
- If a resource has no time set, it gets a small fallback score instead of being discarded immediately.

This helps prefer something realistic for the current window instead of something too long.

### Category Biases

After the main fit score is calculated, the algorithm adds a few lightweight category nudges:

- `SWE` gets a bonus when energy is `high`
- `Islam` gets a bonus when energy is `medium` or `low`
- `Entertainment` gets a bonus when energy is `low` or `dead`
- `Languages` gets a bonus for short sessions, especially `15` minutes or less

These are not hard rules. They are just small adjustments to make the ranking feel more natural.

### Candidate Filtering

After scoring, the algorithm keeps only resources whose score is above a minimum threshold.
This avoids showing obviously bad matches when the user's situation is very specific.

### Final Choice

Once candidates are scored:

1. The highest-scoring resource becomes the first suggestion.
2. The rest are shuffled.
3. Pressing the shuffle button cycles through those ranked candidates.

This gives the user one strong default recommendation without making the experience feel repetitive.

### Topic Labeling

For display, the tool also builds a topic summary:

- normal categories show their category name
- language and entertainment resources can also show their `subdivision`

So a suggestion can appear as:

- `Languages · French`
- `Entertainment · Podcast`
- `Islam`

### Data Compatibility

Older saved data is still supported.
The matcher converts legacy fields like `entType` and `langName` into the current `subdivision` field during load.

### Why This Approach Works

This algorithm balances two goals:

- show one recommendation that feels smart and relevant
- still let the user browse alternatives without rebuilding the list every time

That is why the best match is pinned first, while the remaining valid candidates are shuffled behind it.

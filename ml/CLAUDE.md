## Session 2026-09-14 03:42

- Applied train-test split to all four target variables (welfare, pss, burnout, strain) in train.py
- Consolidated into a single `train_test_split` call to ensure train/test row alignment across all targets
- Split maintains consistent test_size=0.2 and random_state=42 across all prediction tasks

## Session 2026-09-14 03:44

- Refactored train-test split to use separate calls per target, matching user's existing burnout pattern
- Created individual `train_test_split` calls for welfare, pss, burnout, and strain targets
- All splits maintain consistent test_size=0.2 and random_state=42 for reproducibility

## Session 2026-09-14 03:56

- Implemented model evaluation (lines 90-94 pattern) for burnout and strain models
- Added r2_score, root_mean_squared_error, and mean_absolute_error metrics for both models
- Now all four models (welfare, pss, burnout, strain) have complete fit + predict + scoring blocks
- Note: welfare scoring prints prediction array instead of score (line 87 — likely typo)

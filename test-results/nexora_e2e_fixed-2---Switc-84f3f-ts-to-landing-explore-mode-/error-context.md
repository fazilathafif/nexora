# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: nexora_e2e_fixed.spec.ts >> 2 - SwitchTrackPage: no-streams redirects to landing (explore mode)
- Location: nexora_e2e_fixed.spec.ts:27:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Choose your track').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Choose your track').first()

```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | import * as fs from 'fs';
  3   | fs.mkdirSync('/tmp/nexora_ss', { recursive: true });
  4   | 
  5   | const BASE = 'http://localhost:5173';
  6   | test.use({ viewport: { width: 390, height: 844 }, actionTimeout: 8000 });
  7   | 
  8   | async function ss(page: Page, name: string) {
  9   |   await page.screenshot({ path: `/tmp/nexora_ss/${name}.png` });
  10  | }
  11  | 
  12  | test.beforeEach(async ({ page }) => {
  13  |   await page.goto(`${BASE}/gcse`);
  14  |   await page.evaluate(() => sessionStorage.setItem('nx_explore', '1'));
  15  | });
  16  | 
  17  | test('1 - GCSE HomePage: horizontal subject cards + switch track button', async ({ page }) => {
  18  |   await page.goto(`${BASE}/gcse`, { waitUntil: 'networkidle' });
  19  |   await ss(page, '01_homepage_gcse');
  20  |   await expect(page.locator('text=Subjects').first()).toBeVisible();
  21  |   // New card layout has Flashcards action button visible
  22  |   await expect(page.locator('button').filter({ hasText: 'Flashcards' }).first()).toBeVisible();
  23  |   // Switch track icon button always visible
  24  |   await expect(page.locator('[title="Switch track"]')).toBeVisible();
  25  | });
  26  | 
  27  | test('2 - SwitchTrackPage: no-streams redirects to landing (explore mode)', async ({ page }) => {
  28  |   // In explore mode profile.streams is empty → SwitchTrackPage redirects to /landing
  29  |   await page.goto(`${BASE}/switch`, { waitUntil: 'networkidle' });
  30  |   await ss(page, '02_switch_track_explore');
  31  |   // Should land on /landing (enrolment page) — valid behaviour with no enrolled streams
> 32  |   await expect(page.locator('text=Choose your track').first()).toBeVisible({ timeout: 5000 });
      |                                                                ^ Error: expect(locator).toBeVisible() failed
  33  | });
  34  | 
  35  | test('3 - LearnHub: 3 tabs Today / Progress / Plan', async ({ page }) => {
  36  |   await page.goto(`${BASE}/gcse/learn-hub`, { waitUntil: 'networkidle' });
  37  |   await ss(page, '03_learn_hub_today');
  38  |   await expect(page.locator('text=Daily Challenge').first()).toBeVisible();
  39  |   await expect(page.getByRole('button', { name: 'Today' }).first()).toBeVisible();
  40  |   await expect(page.getByRole('button', { name: 'Progress' }).first()).toBeVisible();
  41  |   await expect(page.getByRole('button', { name: 'Plan' }).first()).toBeVisible();
  42  | });
  43  | 
  44  | test('4 - LearnHub Progress tab', async ({ page }) => {
  45  |   await page.goto(`${BASE}/gcse/learn-hub`, { waitUntil: 'networkidle' });
  46  |   await page.getByRole('button', { name: 'Progress' }).first().click();
  47  |   await ss(page, '04_learn_hub_progress');
  48  |   await expect(page.locator('text=This Week').first()).toBeVisible();
  49  | });
  50  | 
  51  | test('5 - LearnHub Plan tab: exam date input + generic plan or no-data state', async ({ page }) => {
  52  |   await page.goto(`${BASE}/gcse/learn-hub`, { waitUntil: 'networkidle' });
  53  |   await page.getByRole('button', { name: 'Plan' }).first().click();
  54  |   await ss(page, '05_learn_hub_plan');
  55  |   // Exam date input for active track
  56  |   await expect(page.locator('input[type="date"]').first()).toBeVisible();
  57  |   // One of three possible states should be shown
  58  |   const states = [
  59  |     page.locator('text=Generic plan').count(),
  60  |     page.locator('text=Set an exam date').count(),
  61  |     page.locator('text=On Track').count(),
  62  |     page.locator('text=Needs Work').count(),
  63  |     page.locator('text=At Risk').count(),
  64  |   ];
  65  |   const counts = await Promise.all(states);
  66  |   expect(counts.some(c => c > 0)).toBeTruthy();
  67  | });
  68  | 
  69  | test('6 - BottomNav: 4 tabs — Home, Learn, Resources, Profile', async ({ page }) => {
  70  |   await page.goto(`${BASE}/gcse`, { waitUntil: 'networkidle' });
  71  |   await ss(page, '06_bottom_nav');
  72  |   const nav = page.locator('nav[aria-label="Main navigation"]');
  73  |   const labels = await nav.locator('button').allTextContents();
  74  |   console.log('Nav tabs:', labels);
  75  |   expect(labels).toContain('Home');
  76  |   expect(labels).toContain('Learn');
  77  |   expect(labels).toContain('Resources');
  78  |   expect(labels).toContain('Profile');
  79  |   expect(labels).not.toContain('Practice');
  80  |   expect(labels).not.toContain('My Learning');
  81  |   expect(labels.length).toBe(4);
  82  | });
  83  | 
  84  | test('7 - Resources: competitors filtered out + past dates at top + UK advisor label', async ({ page }) => {
  85  |   await page.goto(`${BASE}/gcse/resources`, { waitUntil: 'networkidle' });
  86  |   await ss(page, '07_resources');
  87  |   await expect(page.locator('text=Textbooks & Guides').first()).toBeVisible();
  88  |   await expect(page.locator('text=Corbettmaths').first()).not.toBeVisible();
  89  |   await expect(page.locator('text=BBC Bitesize').first()).not.toBeVisible();
  90  |   await expect(page.locator('button').filter({ hasText: /past date/i }).first()).toBeVisible();
  91  |   await expect(page.locator('text=AI University Advisor').first()).toBeVisible();
  92  | });
  93  | 
  94  | test('8 - SAT mock page loads (cfg fix)', async ({ page }) => {
  95  |   await page.goto(`${BASE}/sat/mock/sat_math`, { waitUntil: 'networkidle' });
  96  |   await ss(page, '08_sat_mock');
  97  |   await expect(page.locator('text=not available').first()).not.toBeVisible();
  98  |   await expect(page.locator('button').first()).toBeVisible();
  99  | });
  100 | 
  101 | test('9 - AP HomePage: subjects visible (question banks added)', async ({ page }) => {
  102 |   await page.goto(`${BASE}/ap`, { waitUntil: 'networkidle' });
  103 |   await ss(page, '09_ap_homepage');
  104 |   await expect(page.locator('text=AP').first()).toBeVisible();
  105 | });
  106 | 
  107 | test('10 - GCSE quiz: question renders', async ({ page }) => {
  108 |   await page.goto(`${BASE}/gcse/quiz/maths`, { waitUntil: 'networkidle' });
  109 |   await ss(page, '10_quiz_maths');
  110 |   await expect(page.locator('button').first()).toBeVisible();
  111 | });
  112 | 
  113 | test('11 - Flashcards page loads', async ({ page }) => {
  114 |   await page.goto(`${BASE}/gcse/flashcards/maths`, { waitUntil: 'networkidle' });
  115 |   await ss(page, '11_flashcards');
  116 |   await expect(page.locator('button').first()).toBeVisible();
  117 | });
  118 | 
  119 | test('12 - Resources AI advisor label changes per track (A-Level = University, SAT = College)', async ({ page }) => {
  120 |   await page.goto(`${BASE}/alevel/resources`, { waitUntil: 'networkidle' });
  121 |   await expect(page.locator('text=AI University Advisor').first()).toBeVisible();
  122 |   await page.goto(`${BASE}/sat/resources`, { waitUntil: 'networkidle' });
  123 |   await ss(page, '12_resources_sat');
  124 |   await expect(page.locator('text=AI College Advisor').first()).toBeVisible();
  125 | });
  126 | 
```
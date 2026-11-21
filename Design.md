# Design & UI Specifications

## 1. Visual Language
- **Theme:** Clean, high-contrast SaaS dashboard.
- **Typography:** Inter or Roboto.
- **Exam Layout PC (70/30 Split):**
  - **Left Pane (70%):** Active question text, multiple-choice radio options, "Previous/Next" buttons, "Clear Response".
  - **Right Pane (30%):** Visual question palette grid, overall summary stats, "Submit Test" button.

## 2. Status Color Coding (Palette)
- **Answered:** `#16A34A` (Green)
- **Not Visited:** `#E2E8F0` (Slate 200)
- **Marked for Review:** `#9333EA` (Purple)

## 3. Iconography (lucide-react)
- `<Building />`: Tenant Settings
- `<FileText />`: Aadhaar KYC Upload
- `<Camera />`: Selfie Capture
- `<CreditCard />`: Payments
- `<LayoutGrid />`: Question Palette
- `<Clock />`: Sticky Exam Timer

## 4. Responsive Mobile Layout
- **Header (Sticky Top):** 
  - Left: User Name.
  - Center: Countdown Timer (`<Clock />`, text turns red under 5 minutes).
  - Right: `<LayoutGrid />` icon to open the Question Palette Bottom Sheet.
- **Sub-Header:** Displays current position (e.g., "Question 12 of 50").
- **Main Content (Scrollable):** 
  - Active question text.
  - Radio options (min-height 48px for accessible tap targets).
- **Action Bar (Sticky Bottom):**
  - **Row 1 (Utility):** "Clear" (`<Eraser />`) and "Review" (`<Flag />`) as outlined ghost buttons.
  - **Row 2 (Navigation):** "Previous" (Secondary, 40% width) and "Save & Next" (Primary Solid Green, 60% width).
- **Bottom Sheet / Drawer:** Triggered by the Header grid icon. Contains the full multi-color question status grid and the final "Submit Test" button.
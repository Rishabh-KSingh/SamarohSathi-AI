# Product Requirements Document (PRD)
# AI Event Planner — Adaptive Event Planning Assistant

**Project Type:** AI-powered Web Application  
**Development Environment:** Antigravity IDE  
**Document Version:** 1.0  
**Status:** Ready for Development  
**Working Project Name:** AI Event Planner (final branding to be decided)

---

# 1. Product Overview

## 1.1 Product Vision

Build an AI-powered event planning web application that helps individuals and families plan, organize, and manage celebrations without unnecessary stress.

The application should do more than generate event ideas. It should convert a user's requirements into a practical, personalized, and adaptable event plan.

It should help users:

- Understand and organize their event requirements.
- Create a realistic budget.
- Divide expenses into categories.
- Generate an actionable event timeline.
- Manage tasks, deadlines, and dependencies.
- Compare vendor quotations.
- Adapt the complete plan when requirements change.
- Make informed decisions with the help of AI.

**Core philosophy:**

"Inspiration is easy. Execution is the real challenge."

The application should help users turn an event idea into an event that can actually happen within their budget, preferences, and available time.

## 1.2 Problem Statement

Organizing an event involves several interconnected responsibilities:

- Budget management
- Guest count management
- Venue selection
- Catering and food
- Decoration
- Photography
- Vendor coordination
- Scheduling
- Deadlines and dependencies

These responsibilities are connected.

For example:

- Increasing the guest count can increase catering and venue expenses.
- Changing the event date can affect deadlines and task schedules.
- Reducing the budget requires reconsidering spending priorities.
- Delaying venue confirmation can affect catering, decoration, and invitations.
- A vendor quotation may include hidden or additional charges.

Traditional planning tools generally provide separate checklists or static suggestions.

The proposed application solves this problem through an adaptive AI planning experience.

## 1.3 Target Users

**Primary target audience:** Individuals and families organizing their own events.

Examples:

- Birthday celebrations
- Weddings
- Anniversaries
- Family functions
- Community gatherings
- Other personal celebrations

The product should support different event types without assuming that every event requires the same planning approach.

**Primary user need:** Plan an event according to personal preferences, budget, guest count, and timeline.

## 1.4 Unique Value Proposition

An ordinary AI assistant gives event ideas.

This application creates an event plan and helps users manage the consequences of their decisions.

Its key differentiator is:

**Adaptive Event Planning:** When the user changes the guest count, budget, priorities, or event date, the application helps revise the existing plan instead of forcing the user to start again.

---

# 2. Product Goals

## Primary Goals

1. Make event planning less stressful and more manageable.
2. Generate personalized event plans based on user requirements.
3. Provide transparent budget estimates and expense breakdowns.
4. Create structured tasks with priorities and deadlines.
5. Identify dependencies between planning activities.
6. Help users understand financial trade-offs.
7. Make vendor quotation comparison easier.
8. Adapt existing plans when requirements change.
9. Keep users in control of important decisions.

## Success Criteria

A user should be able to:

- Create an event plan from natural-language requirements.
- Understand the estimated budget.
- See what needs to be done first.
- Track task completion.
- Compare vendor quotations.
- Change event requirements without losing the existing plan.
- Understand how each major change affects the event.

---

# 3. Core Product Features

## 3.1 Dashboard

The dashboard is the main entry point after opening the application.

It should provide a quick overview of the user's event and its current planning status.

### Dashboard components

- Welcome section
- Create New Event button
- Current event overview
- Event date and countdown
- Total estimated budget
- Planned expenses
- Remaining budget
- Guest count
- Task completion progress
- Upcoming deadlines
- Important pending tasks
- AI planning assistant entry point

### Dashboard behaviour

The dashboard should show meaningful information based on the saved event.

If no event exists, show an attractive empty state with a clear call to action:

"Let's plan something memorable."

The dashboard must not display fabricated progress or fake event information.

A sample event can be provided as an optional demo experience, clearly labelled as sample data.

---

## 3.2 Create Event — Smart Onboarding

This is one of the most important features.

Instead of asking users to fill in a large complicated form, create a simple guided onboarding experience.

### Required information

**Step 1: Event Details**

- Event name
- Occasion type
- Event date
- Event location
- Expected guest count

**Step 2: Budget**

- Total available budget
- Currency
- Budget flexibility (fixed or flexible)

**Step 3: Experience and Preferences**

Ask users what kind of event they want.

Examples:

- Simple and elegant
- Premium celebration
- Traditional
- Modern
- Family-friendly
- Intimate gathering

Allow users to explain their preferences in their own words.

**Step 4: Spending Priorities**

Let users choose what matters most.

Examples:

- Food and guest experience
- Venue
- Decoration
- Photography
- Entertainment
- Overall simplicity

Allow multiple priorities and let users rank them.

**Step 5: Must-Haves and Constraints**

Ask:

- What are your absolute must-haves?
- Are there any things you want to avoid?
- Are there children or older guests?
- Are there accessibility requirements?
- Are there venue limitations?
- Are there cultural or family preferences?

These questions should be optional where appropriate.

### AI onboarding behaviour

After collecting the information, the AI should:

1. Understand the event type.
2. Understand the user's budget.
3. Understand the guest count.
4. Identify the user's priorities.
5. Identify important constraints.
6. Ask follow-up questions if important information is missing.
7. Generate a personalized initial plan.

Do not generate generic suggestions without considering the user's answers.

---

## 3.3 AI Event Planning Assistant

The AI assistant is the intelligence layer of the application.

It should understand natural-language requests and help users manage their event.

### Example user requests

- "Plan a birthday party for 50 people within ₹40,000."
- "I want to spend more on food and less on decoration."
- "Suggest a simple wedding plan for 200 guests."
- "Make this event more suitable for children and older family members."
- "The venue is too expensive. Suggest alternatives."
- "My event date has changed. Update my timeline."
- "I want to reduce my budget by ₹20,000."

### AI capabilities

**A. Personalized Suggestions**

Generate suggestions based on:

- Occasion
- Budget
- Guest count
- Atmosphere
- Preferences
- Age groups
- Accessibility needs
- Venue limitations

**B. Budget-aware Recommendations**

Recommendations must respect the available budget and spending priorities.

**C. Alternative Suggestions**

If a suggestion is too expensive or unsuitable, the AI should provide practical alternatives.

**D. Natural-language Changes**

Users should be able to update their plans through normal conversation.

**E. Context Awareness**

The assistant should use the current saved event information instead of treating every message as a new planning request.

### Important AI rule

The AI must not simply return a generic response.

Its output must be relevant to the user's actual event, current plan, budget, and preferences.

---

## 3.4 Intelligent Budget Planner

The budget planner should provide a structured breakdown of event expenses.

### Expense categories

- Venue
- Catering and food
- Decoration
- Photography and videography
- Entertainment
- Invitations
- Transportation
- Accommodation
- Miscellaneous
- Emergency reserve

Users should be able to add, edit, and remove expense categories.

### Budget overview

Display:

- Total budget
- Estimated expenses
- Actual expenses
- Remaining budget
- Budget utilization percentage
- Category-wise expense breakdown

### Budget calculations

The application should calculate totals using application logic, not depend on the AI for arithmetic.

For example:

Total Budget = ₹8,00,000

| Category | Estimated Cost |
|---|---:|
| Venue | ₹1,50,000 |
| Catering | ₹3,00,000 |
| Decoration | ₹1,00,000 |
| Photography | ₹75,000 |
| Entertainment | ₹50,000 |
| Other Expenses | ₹75,000 |
| Emergency Reserve | ₹50,000 |

**Total: ₹8,00,000**

These are illustrative figures, not verified market prices.

### Budget scenarios

Allow users to compare different planning scenarios.

Example:

- Scenario A: More spending on food.
- Scenario B: More spending on decoration.
- Scenario C: Balanced spending.

Show how changing one category affects the remaining budget.

### Budget overrun handling

If estimated expenses exceed the budget:

1. Identify the amount of overrun.
2. Identify the categories contributing to it.
3. Consider the user's priorities.
4. Suggest possible trade-offs.
5. Show the impact of each alternative.
6. Let the user select which changes to accept.

The AI must not automatically cut every category equally.

For example, if food is the user's highest priority, the application should try to preserve the food budget and explore reductions in less important categories.

### Transparency

Every AI-generated estimate must be labelled:

"Estimated — based on planning assumptions. Confirm with the vendor before booking."

Never present AI-generated estimates as confirmed vendor prices.

---

## 3.5 Smart Timeline and Task Manager

The timeline converts an event plan into actionable work.

### Timeline features

- Task list
- Task description
- Start date
- Deadline
- Priority
- Status
- Dependencies
- Completion progress

### Task priorities

- High
- Medium
- Low

### Task statuses

- Not Started
- In Progress
- Completed
- Delayed

### Example tasks

| Task | Priority | Dependency |
|---|---|---|
| Finalize event date | High | None |
| Confirm venue | High | Event date |
| Finalize guest list | High | None |
| Confirm catering | High | Guest count |
| Finalize decoration | Medium | Venue |
| Book photographer | Medium | Event date |
| Send invitations | High | Guest list and venue |

### Dependency management

The application should understand that some tasks depend on other tasks.

For example:

- Catering confirmation depends on guest count.
- Decoration planning may depend on venue details.
- Invitations should use the confirmed event date and venue.

### Task interactions

Users should be able to:

- Mark tasks as completed.
- Change deadlines.
- Change priority.
- Add custom tasks.
- Edit task descriptions.
- View upcoming and overdue tasks.

### AI timeline assistance

The AI should:

- Generate an initial timeline.
- Suggest which task should be completed first.
- Identify delayed tasks.
- Identify tasks affected by a delay.
- Suggest a revised timeline when the event date changes.

Completing or delaying a task should update the planning experience.

---

## 3.6 Adaptive Plan Revision Engine

**This is the most important differentiating feature of the product.**

The application must support changes after an initial plan has already been generated.

Users should never need to start over simply because their requirements changed.

### Supported changes

- Guest count increases or decreases.
- Budget increases or decreases.
- Event date changes.
- Event priorities change.
- Venue changes.
- Menu changes.
- Vendor becomes unavailable.
- Task deadline is delayed.

### Example: Guest Count Change

Initial plan:

- Guests: 200
- Budget: ₹8,00,000
- Event date: 20 December

User says:

"Now 50 more guests are joining."

Expected behaviour:

1. Update guest count to 250 after user confirmation.
2. Recalculate guest-dependent expenses.
3. Identify affected categories such as catering and venue.
4. Check whether venue capacity needs confirmation.
5. Show the revised estimated budget.
6. Explain the changes.
7. Suggest alternatives if the budget is exceeded.

### Example: Budget Reduction

User says:

"Reduce my budget by ₹1,00,000, but don't compromise on food."

Expected behaviour:

1. Update the available budget.
2. Preserve food as a high-priority category.
3. Identify lower-priority categories.
4. Suggest possible reductions.
5. Show the revised budget.
6. Ask the user before applying changes.

### Example: Event Date Change

User says:

"The event is happening two weeks earlier."

Expected behaviour:

1. Update the event date after confirmation.
2. Recalculate remaining days.
3. Review all task deadlines.
4. Identify tasks that need immediate attention.
5. Highlight dependencies affected by the new date.
6. Generate a revised timeline.

### Change impact summary

Before accepting major changes, show:

- What changed
- What remains unchanged
- Which expenses are affected
- Which tasks are affected
- Which deadlines are affected
- What the AI recommends

### User control

Never silently overwrite the entire plan.

Provide:

- Review Changes
- Accept Changes
- Reject Changes

Preserve the previous plan until the user accepts the proposed revision.

---

## 3.7 Vendor Coordination and Quotation Comparison

This feature helps users coordinate with external service providers.

The application is not a vendor booking marketplace.

Its purpose is to help users understand vendor requirements and compare quotations.

### Vendor categories

- Venue
- Caterer
- Photographer
- Decorator
- Entertainment
- Transportation
- Other service providers

### Vendor requirement preparation

AI should help users prepare questions before contacting vendors.

Example questions for a caterer:

- What is the cost per guest?
- What menu options are included?
- Are beverages included?
- Are there additional service charges?
- How many guests can be served?
- What happens if the guest count changes?

### Quotation management

Allow users to manually enter quotation details.

Fields:

- Vendor name
- Service category
- Quoted price
- Number of guests covered
- Included services
- Additional charges
- Terms and conditions
- Notes
- Missing information

### AI quotation comparison

The AI should compare quotations based on:

- Total price
- Included services
- Guest coverage
- Additional charges
- Missing information
- User requirements

It should explain the advantages and disadvantages of each quotation.

### Important limitation

Do not claim that a vendor is available, verified, or offering a confirmed price unless the application has actually verified that information.

No fabricated vendor availability or real-time pricing.

---

## 3.8 Event Overview and Progress Tracking

Provide a consolidated view of the event.

Display:

- Event information
- Budget overview
- Guest count
- Remaining time
- Completed tasks
- Pending tasks
- Overdue tasks
- Vendor status
- Recent changes

Users should understand the current condition of their event without opening every individual section.

---

## 3.9 AI Change History

Maintain a simple history of important plan changes.

Examples:

- Guest count changed from 200 to 250.
- Budget reduced from ₹8,00,000 to ₹7,00,000.
- Event date moved earlier.
- Food budget protected during budget revision.

For each change, show:

- Previous value
- New value
- Date and time
- Reason for change, when provided

This should help users understand how their event plan evolved.

---

# 4. Application Pages and Navigation

Use a persistent left sidebar on desktop.

### Navigation structure

1. Dashboard
2. My Events
3. Overview
4. Budget Planner
5. Timeline & Tasks
6. Vendors
7. AI Assistant
8. Settings

The navigation should remain simple and consistent.

### Page 1: Dashboard

Quick summary of the current event, financial status, task progress, and upcoming deadlines.

### Page 2: My Events

Display saved events and allow users to create or reopen an event.

### Page 3: Event Overview

Display event details, progress, budget status, and planning summary.

### Page 4: Budget Planner

Display expenses, categories, budget scenarios, and AI trade-off suggestions.

### Page 5: Timeline & Tasks

Display task lists, deadlines, priorities, dependencies, and completion status.

### Page 6: Vendors

Manage vendors, requirements, quotations, and comparisons.

### Page 7: AI Assistant

Provide a conversational interface for asking questions and revising the current event plan.

### Page 8: Settings

Provide basic application preferences, currency settings, and local data management.

---

# 5. User Experience and Design System

The design must follow the visual references selected by the product owner.

## 5.1 Overall Design Direction

- Minimal
- Elegant
- Clean
- Premium
- Spacious
- Editorial-inspired
- Professional and friendly

Avoid making the application look like a generic admin dashboard.

## 5.2 Layout

Use the third reference image as the primary layout inspiration.

Requirements:

- Persistent left sidebar.
- Large main content area.
- Clear page headings.
- Short supporting descriptions.
- Well-organized content sections.
- Rounded cards and form containers.
- Consistent spacing.
- Responsive navigation.

Do not use the Bento Grid layout from the first reference.

## 5.3 Typography

Use the second reference image as the typography inspiration.

Requirements:

- Elegant serif font for large headings.
- Clean sans-serif font for body text.
- Large, readable page titles.
- Small uppercase section labels where appropriate.
- Comfortable line height.
- Consistent font hierarchy.

Exact font families will be selected during implementation.

## 5.4 Component Styling

- Rounded cards.
- Subtle borders.
- Minimal shadows.
- Clear input fields.
- Consistent button sizes.
- Simple icons.
- Clear active and hover states.
- Distinct AI assistant panel.

## 5.5 Color System

The final color palette is intentionally left open for the product owner to select.

Do not independently invent a new visual identity.

Keep colors centralized in design tokens so that the palette can be changed without modifying individual components.

## 5.6 Responsive Behaviour

The application must work on:

- Desktop
- Laptop
- Tablet
- Mobile

On smaller screens:

- Sidebar should become a mobile navigation drawer or equivalent compact navigation.
- Cards should stack vertically.
- Forms should remain usable.
- Tables should adapt to narrow screens.
- Important actions should remain accessible.

---

# 6. Technical Architecture

## 6.1 Architecture Decision

Build a lightweight, frontend-first web application.

A full external database and user authentication system are not required for the initial submission.

However, the Gemini API key must never be exposed in browser-side code.

Use a secure server-side API route for AI communication.

## 6.2 Recommended Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Icons | Lucide |
| AI | Gemini API |
| Validation | Zod |
| Local persistence | LocalStorage |
| Unit testing | Vitest |
| End-to-end testing | Playwright |
| Deployment | Vercel |

Use stable compatible package versions during implementation.

## 6.3 Architecture Flow

User Interface  
↓  
Application State and Validation  
↓  
Next.js Server API Route  
↓  
Gemini API  
↓  
Structured AI Response  
↓  
Response Validation  
↓  
Application Business Logic  
↓  
Updated UI and Local Persistence

## 6.4 Backend Requirements

Use Next.js server-side API routes for:

- AI event plan generation.
- AI recommendations.
- Natural-language change interpretation.
- Timeline assistance.
- Budget trade-off explanations.
- Vendor quotation analysis.

Do not expose API secrets in client components.

Use environment variables.

Example:

`GEMINI_API_KEY=your_api_key`

Add `.env.local` to `.gitignore`.

Provide `.env.example` with placeholder values only.

## 6.5 Data Persistence

Use LocalStorage for the initial version.

Persist:

- Event details
- Budget categories
- Expense records
- Tasks
- Task dependencies
- Vendor information
- Vendor quotations
- User preferences
- AI change history

Create a centralized persistence layer.

The application should load saved information when the user refreshes the browser.

Add clear error handling for invalid or unavailable local data.

No account authentication or cloud database is required in the MVP.

## 6.6 Business Logic

Keep important calculations inside application code.

Examples:

- Total expenses
- Remaining budget
- Budget utilization
- Per-guest cost
- Budget overrun
- Task completion percentage
- Days remaining
- Deadline status

The AI can suggest adjustments, but deterministic calculations must be performed by the application.

---

# 7. AI Integration and Response Design

## 7.1 AI Responsibilities

Gemini should handle:

- Understanding natural-language requirements.
- Personalizing event suggestions.
- Generating initial event plans.
- Suggesting expense allocations.
- Explaining financial trade-offs.
- Generating tasks and dependencies.
- Understanding requested plan changes.
- Explaining quotation differences.
- Adapting suggestions to user priorities.

## 7.2 Application Responsibilities

The application should handle:

- Input validation.
- Budget arithmetic.
- Saving and loading events.
- Updating task status.
- Date calculations.
- Dependency checks.
- User approval of changes.
- Rendering and displaying structured results.

Do not delegate every application action to the AI.

## 7.3 Structured AI Output

Whenever the AI generates or revises an event plan, request structured JSON.

A conceptual event response:

```json
{
  "eventSummary": "A simple family wedding",
  "assumptions": [
    "Venue prices are estimated",
    "Final vendor quotations are not available"
  ],
  "recommendations": [],
  "budget": {
    "totalBudget": 800000,
    "categories": []
  },
  "tasks": [],
  "dependencies": [],
  "warnings": [],
  "followUpQuestions": []
}
```

Use a proper Zod schema for validation.

Do not trust unvalidated AI output.

If the response is invalid, handle the error gracefully and allow a retry.

## 7.4 Context Management

Send the AI only the relevant event context.

Include:

- Event details
- Current budget
- Guest count
- User priorities
- Current timeline
- Relevant tasks
- Existing vendor information
- Requested changes

The assistant must understand the existing plan.

It must not create a new unrelated plan whenever the user asks a follow-up question.

## 7.5 AI Prompt Behaviour

The system prompt should enforce these rules:

1. Respect the user's budget.
2. Respect the user's priorities.
3. Do not invent confirmed vendor prices.
4. Clearly label assumptions.
5. Explain trade-offs.
6. Suggest practical alternatives.
7. Consider guest count and venue capacity.
8. Consider task dependencies.
9. Ask questions when critical information is missing.
10. Never silently overwrite existing plans.
11. Return structured output when requested.
12. Keep the user in control.

---

# 8. Core Data Models

Use TypeScript interfaces and Zod schemas.

## Event

- id
- name
- occasion
- eventDate
- location
- guestCount
- totalBudget
- currency
- atmosphere
- preferences
- priorities
- mustHaves
- constraints
- createdAt
- updatedAt

## BudgetCategory

- id
- eventId
- name
- estimatedAmount
- actualAmount
- priority
- notes

## Task

- id
- eventId
- title
- description
- dueDate
- priority
- status
- dependencyIds
- createdAt
- updatedAt

## Vendor

- id
- eventId
- name
- category
- contactDetails
- requirements
- notes
- status

## VendorQuotation

- id
- vendorId
- quotedAmount
- guestCoverage
- includedServices
- additionalCharges
- terms
- missingInformation
- notes

## PlanChange

- id
- eventId
- changeType
- previousValue
- proposedValue
- explanation
- affectedCategories
- affectedTasks
- status
- createdAt

---

# 9. Important User Flows

## Flow A: Create an Event

1. User opens the application.
2. User selects Create New Event.
3. User enters event details.
4. User provides budget and guest count.
5. User selects priorities.
6. User adds must-haves and constraints.
7. AI understands the requirements.
8. AI generates an initial plan.
9. User reviews the plan.
10. User accepts and saves it.

## Flow B: Manage the Budget

1. User opens Budget Planner.
2. User reviews expense categories.
3. User changes an expense.
4. Application recalculates totals.
5. User requests AI suggestions if needed.
6. AI explains possible trade-offs.
7. User selects an alternative.
8. Application updates the budget.

## Flow C: Manage the Timeline

1. User opens Timeline.
2. User reviews tasks.
3. User marks a task completed.
4. Application updates progress.
5. User delays a task.
6. Application checks affected dependencies.
7. AI suggests a revised schedule.

## Flow D: Adapt an Existing Event

1. User opens the AI Assistant.
2. User requests a change in natural language.
3. AI interprets the request.
4. Application identifies affected information.
5. AI proposes a revised plan.
6. Application displays a change summary.
7. User reviews the proposed changes.
8. User accepts or rejects them.
9. Application updates the saved event only after acceptance.

## Flow E: Compare Vendors

1. User adds vendor information.
2. User enters quotation details.
3. User adds another quotation.
4. AI compares the quotations.
5. Application displays a structured comparison.
6. AI highlights missing information and additional charges.
7. User makes the final decision.

---

# 10. MVP Scope and Development Priority

Build the application in stages.

## Phase 1 — Essential Foundation

- Next.js application setup
- TypeScript configuration
- Design system
- Responsive sidebar layout
- Dashboard
- Event creation flow
- LocalStorage persistence

## Phase 2 — Core Planning

- AI event plan generation
- Event overview
- Budget planner
- Expense calculations
- Timeline and task management
- Task dependencies

## Phase 3 — Main Differentiator

- Natural-language plan changes
- Guest count impact analysis
- Budget reduction and trade-offs
- Event date revision
- Change preview and approval
- Change history

## Phase 4 — Vendor Coordination

- Vendor management
- Quotation entry
- Quotation comparison
- AI vendor requirement questions

## Phase 5 — Quality and Submission

- Validation
- Error handling
- Unit testing
- End-to-end testing
- Accessibility improvements
- Responsive testing
- Deployment
- Project documentation
- Demo video

**Development priority:** Complete the core planning and adaptive revision experience before spending time on optional features.

---

# 11. Out of Scope for the Initial Version

Do not spend time building these unless the core application is already complete:

- User registration and login
- External database
- Payment gateway
- Vendor booking marketplace
- Real-time vendor availability
- Automatic vendor booking
- Real-time market price integrations
- Mobile Android application
- Social media features
- Complex notification infrastructure
- Unnecessary decorative AI features

The challenge requires a web application, not an Android app.

---

# 12. Security Requirements

Security is an important evaluation criterion.

Requirements:

- Keep Gemini API keys server-side.
- Never commit secrets to GitHub.
- Validate all user inputs.
- Validate AI responses.
- Do not execute AI-generated code.
- Do not trust AI output as application instructions.
- Handle API failures safely.
- Avoid exposing sensitive server error details.
- Add basic API request validation and rate limiting where practical.
- Use safe rendering for user-generated content.
- Do not store unnecessary personal information.

---

# 13. Testing Requirements

Testing must cover both application functionality and AI-assisted workflows.

## Unit Tests

Test:

- Budget calculations
- Remaining budget
- Expense totals
- Per-guest calculations
- Budget overrun
- Task completion percentage
- Date calculations
- Dependency detection
- Data validation

## Integration Tests

Test:

- Event creation
- Saving and loading event data
- AI API response validation
- Budget update workflow
- Timeline update workflow
- Plan revision approval
- Vendor quotation comparison

## End-to-End Tests

Test the following scenarios:

**Test 1: New Event**

Create an event with a budget, guest count, and event date. Generate and save the plan.

**Test 2: Guest Count Increase**

Change the guest count from 200 to 250. Verify that guest-dependent estimates and relevant warnings are updated.

**Test 3: Budget Reduction**

Reduce the budget while preserving the user's highest priority. Verify that the AI suggests reasonable trade-offs.

**Test 4: Event Date Change**

Move the event date two weeks earlier. Verify that the timeline and affected deadlines are reviewed.

**Test 5: Vendor Comparison**

Enter two quotations and verify that the comparison identifies prices, included services, additional charges, and missing information.

**Test 6: Persistence**

Refresh the browser and verify that saved event data remains available.

**Test 7: Invalid AI Response**

Return malformed AI output and verify that the application shows a safe error rather than crashing.

---

# 14. Accessibility Requirements

- Use semantic HTML.
- Provide labels for form inputs.
- Support keyboard navigation.
- Maintain visible focus states.
- Use sufficient text contrast.
- Provide accessible button names.
- Do not rely only on color to communicate status.
- Make dialogs and navigation accessible.
- Support readable text sizes on mobile.

---

# 15. Error and Empty States

Every important page must have meaningful loading, error, and empty states.

Examples:

- No events created.
- No budget categories.
- No pending tasks.
- No vendors added.
- AI service unavailable.
- Invalid AI response.
- Failed data save.
- Missing required event details.

Do not display a blank page when an operation fails.

Provide a clear message and a recovery action wherever possible.

---

# 16. Demo and Evaluation Scenarios

The final application must clearly demonstrate its most important capabilities.

The following scenarios should be used during the project demo.

### Scenario 1 — Create a Real Event Plan

Create a wedding plan:

- Budget: ₹8,00,000
- Guests: 200
- Planning period: 4 months
- Priority: Food and guest experience
- Preference: Simple and elegant

Show the AI-generated plan, budget, and timeline.

### Scenario 2 — Increase Guest Count

Change the guest count from 200 to 250.

Show how the application identifies the impact on catering, venue capacity, and budget.

### Scenario 3 — Reduce Budget

Reduce the budget by ₹1,00,000 while keeping food as the highest priority.

Show how the AI proposes trade-offs instead of cutting every category equally.

### Scenario 4 — Move the Event Earlier

Move the event two weeks earlier.

Show the revised timeline, affected tasks, and urgent deadlines.

### Scenario 5 — Compare Vendors

Enter two catering quotations.

Show how the AI compares inclusions, prices, guest coverage, and missing information.

### Scenario 6 — Preserve the Plan

Refresh the browser.

Show that the event and its saved information are still available.

These scenarios should work with real user inputs, not hardcoded responses designed only for the demo.

---

# 17. PromptWars Submission Preparation

The project should be prepared for all required submission components.

## Required Deliverables

1. Working web application prototype.
2. GitHub repository.
3. Deployed application link.
4. Project demonstration video.
5. LinkedIn post explaining the project.

## AI Usage Documentation

Document:

- Why Gemini was selected.
- Why Antigravity IDE was selected.
- Where GenAI is used.
- Which tasks are handled by application logic.
- Overall application architecture.
- AI prompt flow.
- Important prompt excerpts.
- Screenshots of the development process.
- How prompts evolved during development.
- What the AI development tool generated.
- What was manually reviewed, modified, or implemented.

## Demo Video

The video should demonstrate the working application and its main features.

It should show:

- Creating an event.
- Generating an AI plan.
- Managing the budget.
- Managing the timeline.
- Revising the plan after changes.
- Comparing vendor quotations.

Voice-over is optional. A clear walkthrough with captions is acceptable.

---

# 18. Evaluation Readiness Checklist

The project should be reviewed against all six evaluation areas mentioned in the PromptWars session.

| Evaluation Area | Project Focus |
|---|---|
| Problem Statement Alignment | Real event planning and adaptive changes |
| Code Quality | Modular components, TypeScript, reusable logic |
| Security | Protected API key, input and output validation |
| Efficiency | Relevant AI context, reusable calculations |
| Testing | Unit, integration, and end-to-end tests |
| Accessibility | Keyboard support, labels, contrast, responsive UI |

Problem Statement Alignment and Code Quality should receive particular attention because the livestream identifies them as high-impact evaluation criteria.

---

# 19. Definition of Done

The project is considered ready for submission when:

- [ ] Users can create an event.
- [ ] Users can generate a personalized AI plan.
- [ ] Users can save and reopen events.
- [ ] Budget calculations work correctly.
- [ ] Users can edit expense categories.
- [ ] Users can create and complete tasks.
- [ ] Task dependencies are handled.
- [ ] Users can request plan changes using natural language.
- [ ] Guest count changes produce relevant impact analysis.
- [ ] Budget reductions produce priority-aware trade-offs.
- [ ] Event date changes produce timeline revisions.
- [ ] Users can review and approve proposed changes.
- [ ] Users can add and compare vendor quotations.
- [ ] Estimates are clearly labelled.
- [ ] API keys are protected.
- [ ] Important workflows have tests.
- [ ] Application is responsive.
- [ ] No critical errors remain.
- [ ] Project is deployed and demo-ready.

---

# 20. Final Product Principle

The application should not become a collection of unrelated AI tools.

Every feature should contribute to the same goal:

**Help people successfully organize real events within their budget, preferences, and timeline.**

Prioritize practical planning, connected decisions, transparent estimates, adaptive changes, and user control.

Do not add features simply because they look impressive.

Build a reliable, polished, and genuinely useful event planning assistant.
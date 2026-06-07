# Project: COMO Sustainability Operations Copilot

## Product Goal

Build a lightweight internal AI workflow prototype for COMO Hotels & Resorts.

The app should demonstrate how AI can support sustainability transformation across hotel operations by converting department-level sustainability issues into structured action plans, micro-training, manager checklists, KPI follow-ups, and governance-aware recommendations.

## Important Positioning

This is NOT a generic chatbot.

This is an internal operational workflow assistant designed for:
- sustainability transformation
- staff enablement
- behaviour change
- operational adoption
- structured decision support
- governance-aware AI usage

## Core User

The primary user is a sustainability transformation manager, hotel department manager, or operations lead.

Example departments:
- Housekeeping
- Food & Beverage
- Engineering
- Spa & Wellness
- Front Office
- Procurement

## Main Workflow

The app should follow this flow:

1. Dashboard with mock sustainability KPIs
2. New Sustainability Case form
3. AI-generated operational action plan
4. Governance and audit review section

## Demo Scenario

Default demo case:

Property: COMO Metropolitan Singapore
Department: Housekeeping
Issue: Laundry usage increased above baseline
Current metric: 18% increase in laundry volume
Target metric: Return to baseline within 60 days
Context: Inconsistent towel reuse adoption and unclear staff communication

## AI Output Sections

Every AI action plan should include:

1. Situation Summary
2. Likely Root Causes
3. Recommended Operational Actions
4. Staff Micro-Training Message
5. Manager Checklist
6. KPIs to Monitor
7. Governance & Privacy Notes
8. Follow-Up Recommendations

## Governance Requirements

Always design the app with these principles:

- Human review required before implementation
- No guest personal data should be entered
- AI outputs are recommendations, not final policy
- Recommendations should be validated by operational managers
- Keep an audit trail concept visible in the UI
- Show responsible AI usage clearly

## UI Style

The app should feel:
- premium
- calm
- operational
- hospitality-focused
- professional
- suitable for an internal COMO prototype

Avoid:
- gimmicky chatbot UI
- overly technical dashboards
- generic SaaS styling
- excessive colours

## Technical Preferences

Use:
- Next.js
- TypeScript
- Tailwind CSS
- App Router
- simple reusable components
- mock data first

Do not add:
- authentication
- database
- Supabase
- complex backend
- unnecessary external libraries

unless specifically requested later.

## Development Rules

Before making large changes:
- explain the files you plan to change
- keep components small and readable
- favour clarity over cleverness
- avoid overengineering
- make the app easy to present in a case study
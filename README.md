# COMO Sustainability Operations Copilot

## One-Sentence Summary

COMO Sustainability Operations Copilot is an internal workflow prototype that turns hotel sustainability issues into structured, reviewable operational action plans.

## Problem

Hotel sustainability teams often need to translate broad environmental goals into practical department-level actions. Issues such as laundry overuse, food waste, energy consumption, and training gaps require clear operational follow-up, manager review, KPI tracking, and staff communication.

## Solution

This prototype demonstrates a governed AI-assisted workflow for sustainability operations. It is not a generic chatbot. The app guides a manager from a structured sustainability case through AI-generated recommendations, human review, approval locking, implementation notes, and completion tracking.

## Core Workflow

1. Review the action-plan list and locally saved plans.
2. Create or edit a sustainability case with property, department, issue, metrics, and operational context.
3. Generate a structured AI action plan through the app API.
4. Review the AI output, governance notes, and KPI recommendations.
5. Save the plan locally for the prototype demo.
6. Mark the plan approved to lock the operational record.
7. Add implementation notes after approval.
8. Mark the action plan done when complete.

## Key Features

- Structured action-plan lifecycle: create, generate, save, approve, lock, note, and mark done.
- Editable sustainability case form with department-level operational context.
- AI output sections for root causes, recommended actions, staff micro-training, manager checklist, KPIs, governance notes, and follow-up.
- Approval lock to protect reviewed operational records from accidental changes.
- Local prototype persistence using `localStorage`.
- Clear separation between generating an AI recommendation and saving an operational record.

## AI and Governance Design

- AI outputs are structured JSON and validated before being shown in the workflow.
- Human review is required before implementation.
- The app reminds users not to enter guest personal data.
- AI recommendations are treated as decision support, not final policy.
- Approved plans are locked to preserve the reviewed operational record.
- The workflow is designed around operational action, not open-ended chat.

## Prototype Limitations

- Saved action plans use `localStorage` only.
- There is no authentication.
- There is no database.
- There are no role-based permissions.
- There is no production audit log yet.
- An OpenAI API key is required locally to generate action plans.

## Future Improvements

- Store action plans in a secure database.
- Add role-based access for sustainability managers, department leads, and reviewers.
- Track approval history and operational audit events.
- Add a RAG knowledge base over COMO sustainability policies and operating standards.
- Support multilingual staff training messages.
- Add dashboard analytics for plan status, KPI follow-up, and department trends.
- Integrate with PMS, BMS, procurement, and reporting systems.

## How to Run Locally

```bash
npm install
```

Create `.env.local` in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key
```

Start the development server:

```bash
npm run dev
```

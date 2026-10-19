/**
 * Aggregated survey-response shape that the "Review Results" view consumes.
 *
 * Round N6 replaces this mock with real aggregated responses from the backend,
 * which must supply the SAME shape (one object per question):
 *
 * {
 *   questionId: number,
 *   question:   string,
 *   type:       'multiple_choice' | 'scale' | 'text',
 *   count:      number,                // total responses to THIS question
 *   options?:   Array<{                // multiple_choice & scale only
 *     label: string,                   // e.g. "Yes", "5", "Strongly agree"
 *     count: number,                   // responses selecting this option
 *   }>,
 *   responses?: Array<{                // text only (or raw samples)
 *     answer: string,
 *     patientName: string | null,
 *   }>,
 * }
 *
 * Rendering rules:
 * - `multiple_choice` → pie chart (proportion per option) + legend.
 * - `scale`           → horizontal bar chart (ordered distribution).
 * - `text`            → scrollable list of individual responses.
 * - A question with no `type` (or unrecognised) falls back to `text` so legacy
 *   free-text aggregations keep rendering.
 */

export const MOCK_AGGREGATED_RESULTS = [
  {
    questionId: 1,
    question: 'How did you hear about Healing Horizon?',
    type: 'multiple_choice',
    count: 48,
    options: [
      { label: 'Friend or family', count: 21 },
      { label: 'University counsellor', count: 12 },
      { label: 'Social media', count: 9 },
      { label: 'Search engine', count: 4 },
      { label: 'Other', count: 2 },
    ],
  },
  {
    questionId: 2,
    question: 'How would you rate your overall wellbeing this week?',
    type: 'scale',
    count: 46,
    options: [
      { label: '1', count: 2 },
      { label: '2', count: 5 },
      { label: '3', count: 12 },
      { label: '4', count: 18 },
      { label: '5', count: 9 },
    ],
  },
  {
    questionId: 3,
    question: 'What helped you most this week?',
    type: 'text',
    count: 38,
    responses: [
      { answer: 'Talking to my consultant about study stress.', patientName: 'Sarah Johnson' },
      { answer: 'The community forum posts on morning routines.', patientName: 'James Okonkwo' },
      { answer: 'Journaling before bed every night.', patientName: 'Emily Tran' },
      { answer: 'The breathing exercises in the AI chat.', patientName: null },
      { answer: 'Setting boundaries with friends and family.', patientName: 'Noor Hassan' },
    ],
  },
];

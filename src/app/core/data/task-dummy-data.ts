import { Task } from '../models/task.model';

/**
 * Realistic demo tasks for the board and Add Task views.
 *
 * These tasks act as the seed/fallback data while the app runs without a live
 * backend connection. They deliberately contain no real personal data.
 *
 * `assignedContactIds` reference the demo contact IDs from the ContactService
 * (ids "1"–"12").
 */
export const DUMMY_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Design landing page hero section',
    description: 'Create the hero layout with headline, call-to-action and a responsive image for the marketing landing page.',
    dueDate: '2026-08-05',
    priority: 'urgent',
    category: 'User Story',
    status: 'todo',
    assignedContactIds: ['1', '2'],
    subtasks: [
      { id: 't1-s1', title: 'Draft wireframe in Figma', done: true },
      { id: 't1-s2', title: 'Define responsive breakpoints', done: false },
    ],
    createdAt: '2026-07-10',
    updatedAt: '2026-07-12',
  },
  {
    id: 't2',
    title: 'Implement user authentication flow',
    description: 'Build sign-up, login and logout with form validation and clear error messages.',
    dueDate: '2026-07-30',
    priority: 'medium',
    category: 'Technical Task',
    status: 'inProgress',
    assignedContactIds: ['3', '4', '5'],
    subtasks: [
      { id: 't2-s1', title: 'Set up authentication service', done: true },
      { id: 't2-s2', title: 'Add form validation', done: true },
      { id: 't2-s3', title: 'Handle session persistence', done: false },
    ],
  },
  {
    id: 't3',
    title: 'Set up CI/CD pipeline',
    description: 'Configure automated build, test and deployment steps so changes ship to staging on every merge.',
    dueDate: '2026-08-12',
    priority: 'low',
    category: 'Technical Task',
    status: 'awaitFeedback',
    assignedContactIds: ['6'],
    subtasks: [],
  },
  {
    id: 't4',
    title: 'Write onboarding user guide',
    description: 'Document the core workflows so new users can get started with the board without extra support.',
    dueDate: '2026-07-15',
    priority: 'medium',
    category: 'User Story',
    status: 'done',
    assignedContactIds: ['7', '8'],
    subtasks: [
      { id: 't4-s1', title: 'Outline guide structure', done: true },
      { id: 't4-s2', title: 'Add annotated screenshots', done: true },
    ],
    createdAt: '2026-06-28',
    updatedAt: '2026-07-14',
  },
  {
    id: 't5',
    title: 'Conduct usability testing session',
    description: 'Run a moderated test with five participants and collect feedback on the task creation flow.',
    dueDate: '2026-08-20',
    priority: 'low',
    category: 'User Story',
    status: 'todo',
    assignedContactIds: [],
    subtasks: [],
  },
];

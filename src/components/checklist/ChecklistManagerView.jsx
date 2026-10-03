import React from 'react';
import ToDoListView from './ToDoListView';
import OnboardingChecklistView from './OnboardingChecklistView';
import ChecklistSettingsView from './ChecklistSettingsView';

export default function ChecklistManagerView({ activeSubTab = 'todos' }) {
  // Normalize sub-tab name
  const subTab = activeSubTab.replace('checklist-', '');

  switch (subTab) {
    case 'todos':
    case 'to-dos':
      return <ToDoListView />;

    case 'onboarding':
      return <OnboardingChecklistView type="onboarding" />;

    case 'offboarding':
      return <OnboardingChecklistView type="offboarding" />;

    case 'setting':
    case 'settings':
      return <ChecklistSettingsView />;

    default:
      return <ToDoListView />;
  }
}

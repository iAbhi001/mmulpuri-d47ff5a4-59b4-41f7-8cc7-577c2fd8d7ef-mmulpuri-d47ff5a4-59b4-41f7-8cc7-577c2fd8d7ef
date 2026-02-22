import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TasksState } from './tasks.reducer';

export const selectTasksState = createFeatureSelector<TasksState>('tasks');

export const selectAllTasks = createSelector(selectTasksState, (s) => s.tasks);
export const selectOrderedIds = createSelector(selectTasksState, (s) => s.orderedIds);
export const selectTasksLoading = createSelector(selectTasksState, (s) => s.loading);
export const selectTasksError = createSelector(selectTasksState, (s) => s.error);
export const selectSelectedTask = createSelector(selectTasksState, (s) => s.selectedTask);
export const selectFilters = createSelector(selectTasksState, (s) => s.filters);

// Returns tasks ordered by orderedIds (respects drag & drop)
export const selectOrderedTasks = createSelector(
  selectAllTasks,
  selectOrderedIds,
  (tasks, ids) => {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    return ids.map((id) => taskMap.get(id)).filter(Boolean) as typeof tasks;
  }
);

// Status summary for chart
export const selectTaskStatusCounts = createSelector(selectAllTasks, (tasks) => ({
  todo: tasks.filter((t) => t.status === 'todo').length,
  in_progress: tasks.filter((t) => t.status === 'in_progress').length,
  done: tasks.filter((t) => t.status === 'done').length,
  total: tasks.length,
}));

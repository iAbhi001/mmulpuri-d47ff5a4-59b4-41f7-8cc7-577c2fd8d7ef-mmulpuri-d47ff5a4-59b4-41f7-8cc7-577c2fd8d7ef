import { createReducer, on } from '@ngrx/store';
import { ITask, TaskFilterDto } from '@mmulpuri/data';
import { TasksActions } from './tasks.actions';

export interface TasksState {
  tasks: ITask[];
  orderedIds: string[];
  selectedTask: ITask | null;
  filters: TaskFilterDto;
  loading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  orderedIds: [],
  selectedTask: null,
  filters: {},
  loading: false,
  error: null,
};

export const tasksReducer = createReducer(
  initialState,

  // Load
  on(TasksActions.loadTasks, (state) => ({ ...state, loading: true, error: null })),
  on(TasksActions.loadTasksSuccess, (state, { tasks }) => ({
    ...state,
    tasks,
    orderedIds: tasks.map((t) => t.id),
    loading: false,
  })),
  on(TasksActions.loadTasksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Create
  on(TasksActions.createTask, (state) => ({ ...state, loading: true })),
  on(TasksActions.createTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: [task, ...state.tasks],
    orderedIds: [task.id, ...state.orderedIds],
    loading: false,
  })),
  on(TasksActions.createTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update
  on(TasksActions.updateTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    selectedTask: state.selectedTask?.id === task.id ? task : state.selectedTask,
    loading: false,
  })),

  // Delete
  on(TasksActions.deleteTaskSuccess, (state, { id }) => ({
    ...state,
    tasks: state.tasks.filter((t) => t.id !== id),
    orderedIds: state.orderedIds.filter((tid) => tid !== id),
    selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
  })),

  // Filters
  on(TasksActions.setFilter, (state, { filters }) => ({
    ...state,
    filters: { ...state.filters, ...filters },
  })),

  // Selection
  on(TasksActions.selectTask, (state, { task }) => ({
    ...state,
    selectedTask: task,
  })),

  // Reorder (drag & drop)
  on(TasksActions.reorderTasks, (state, { taskIds }) => ({
    ...state,
    orderedIds: taskIds,
  })),
);

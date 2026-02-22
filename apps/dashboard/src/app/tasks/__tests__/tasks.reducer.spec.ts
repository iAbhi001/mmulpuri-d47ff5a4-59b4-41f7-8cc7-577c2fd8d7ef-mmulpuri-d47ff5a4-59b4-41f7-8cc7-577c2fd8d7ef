import { tasksReducer, TasksState } from '../store/tasks.reducer';
import { TasksActions } from '../store/tasks.actions';
import { ITask, TaskStatus, TaskCategory } from '@mmulpuri/data';

const makeTask = (id: string, title = 'Task'): ITask => ({
  id,
  title,
  description: '',
  status: TaskStatus.TODO,
  category: TaskCategory.WORK,
  priority: 0,
  ownerId: 'user-1',
  organizationId: 'org-1',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const initialState: TasksState = {
  tasks: [],
  orderedIds: [],
  selectedTask: null,
  filters: {},
  loading: false,
  error: null,
};

describe('Tasks Reducer', () => {
  it('should return initial state', () => {
    const state = tasksReducer(undefined, { type: '@@INIT' } as any);
    expect(state.tasks).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('should set loading on Load Tasks', () => {
    const state = tasksReducer(initialState, TasksActions.loadTasks({}));
    expect(state.loading).toBe(true);
  });

  it('should set tasks on Load Tasks Success', () => {
    const tasks = [makeTask('1'), makeTask('2')];
    const state = tasksReducer(
      { ...initialState, loading: true },
      TasksActions.loadTasksSuccess({ tasks })
    );
    expect(state.tasks).toEqual(tasks);
    expect(state.orderedIds).toEqual(['1', '2']);
    expect(state.loading).toBe(false);
  });

  it('should prepend new task on Create Task Success', () => {
    const existing = makeTask('existing');
    const newTask = makeTask('new', 'New Task');
    const state = tasksReducer(
      { ...initialState, tasks: [existing], orderedIds: ['existing'] },
      TasksActions.createTaskSuccess({ task: newTask })
    );
    expect(state.tasks[0]).toEqual(newTask);
    expect(state.orderedIds[0]).toBe('new');
  });

  it('should update task in place on Update Task Success', () => {
    const task = makeTask('1', 'Old Title');
    const updated = { ...task, title: 'New Title' };
    const state = tasksReducer(
      { ...initialState, tasks: [task] },
      TasksActions.updateTaskSuccess({ task: updated })
    );
    expect(state.tasks[0].title).toBe('New Title');
  });

  it('should remove task on Delete Task Success', () => {
    const tasks = [makeTask('1'), makeTask('2')];
    const state = tasksReducer(
      { ...initialState, tasks, orderedIds: ['1', '2'] },
      TasksActions.deleteTaskSuccess({ id: '1' })
    );
    expect(state.tasks.length).toBe(1);
    expect(state.tasks[0].id).toBe('2');
    expect(state.orderedIds).toEqual(['2']);
  });

  it('should clear selectedTask when it is deleted', () => {
    const task = makeTask('1');
    const state = tasksReducer(
      { ...initialState, tasks: [task], selectedTask: task },
      TasksActions.deleteTaskSuccess({ id: '1' })
    );
    expect(state.selectedTask).toBeNull();
  });

  it('should set selected task', () => {
    const task = makeTask('1');
    const state = tasksReducer(initialState, TasksActions.selectTask({ task }));
    expect(state.selectedTask).toEqual(task);
  });

  it('should update orderedIds on Reorder Tasks', () => {
    const state = tasksReducer(
      { ...initialState, orderedIds: ['1', '2', '3'] },
      TasksActions.reorderTasks({ taskIds: ['3', '1', '2'] })
    );
    expect(state.orderedIds).toEqual(['3', '1', '2']);
  });

  it('should set error on Load Tasks Failure', () => {
    const state = tasksReducer(
      { ...initialState, loading: true },
      TasksActions.loadTasksFailure({ error: 'Network error' })
    );
    expect(state.error).toBe('Network error');
    expect(state.loading).toBe(false);
  });
});

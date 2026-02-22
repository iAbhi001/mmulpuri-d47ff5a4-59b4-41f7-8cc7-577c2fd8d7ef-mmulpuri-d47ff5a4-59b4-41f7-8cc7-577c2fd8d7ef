import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { TasksActions } from './tasks.actions';
import { TasksApiService } from '../tasks-api.service';

@Injectable()
export class TasksEffects {
  private actions$ = inject(Actions);
  private tasksApi = inject(TasksApiService);
  private store = inject(Store);

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadTasks),
      switchMap(({ filters }) =>
        this.tasksApi.getAll(filters).pipe(
          map((tasks) => TasksActions.loadTasksSuccess({ tasks })),
          catchError((err) =>
            of(TasksActions.loadTasksFailure({ error: err?.error?.message ?? 'Failed to load tasks' }))
          )
        )
      )
    )
  );

  createTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.createTask),
      switchMap(({ dto }) =>
        this.tasksApi.create(dto).pipe(
          map((task) => TasksActions.createTaskSuccess({ task })),
          catchError((err) =>
            of(TasksActions.createTaskFailure({ error: err?.error?.message ?? 'Failed to create task' }))
          )
        )
      )
    )
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.updateTask),
      switchMap(({ id, dto }) =>
        this.tasksApi.update(id, dto).pipe(
          map((task) => TasksActions.updateTaskSuccess({ task })),
          catchError((err) =>
            of(TasksActions.updateTaskFailure({ error: err?.error?.message ?? 'Failed to update task' }))
          )
        )
      )
    )
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteTask),
      switchMap(({ id }) =>
        this.tasksApi.delete(id).pipe(
          map(() => TasksActions.deleteTaskSuccess({ id })),
          catchError((err) =>
            of(TasksActions.deleteTaskFailure({ error: err?.error?.message ?? 'Failed to delete task' }))
          )
        )
      )
    )
  );
}

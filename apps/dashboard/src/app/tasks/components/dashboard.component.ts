import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map } from 'rxjs';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { ITask, TaskStatus, TaskCategory, RoleType } from '@mmulpuri/data';
import { TasksActions } from '../store/tasks.actions';
import { AuthActions } from '../../auth/store/auth.actions';
import {
  selectOrderedTasks,
  selectTasksLoading,
  selectSelectedTask,
  selectTaskStatusCounts,
} from '../store/tasks.selectors';
import { selectCurrentUser } from '../../auth/store/auth.selectors';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  template: `
<div class="min-h-screen transition-colors duration-300"
     [class.bg-gray-900]="isDark" [class.bg-gray-50]="!isDark">

  <!-- ── Top Navbar ── -->
  <nav class="sticky top-0 z-30 border-b shadow-sm transition-colors"
       [class.bg-gray-800]="isDark" [class.border-gray-700]="isDark"
       [class.bg-white]="!isDark" [class.border-gray-200]="!isDark">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <span class="font-bold text-lg" [class.text-white]="isDark" [class.text-gray-900]="!isDark">
          TaskFlow
        </span>
        <span *ngIf="currentUser$ | async as user"
              class="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              [ngClass]="{
                'bg-purple-100 text-purple-700': user.role === 'owner',
                'bg-blue-100 text-blue-700': user.role === 'admin',
                'bg-green-100 text-green-700': user.role === 'viewer'
              }">
          {{ user.role | titlecase }}
        </span>
      </div>

      <div class="flex items-center gap-3">
        <span class="hidden sm:block text-sm" [class.text-gray-400]="isDark" [class.text-gray-600]="!isDark">
          {{ (currentUser$ | async)?.email }}
        </span>
        <button (click)="toggleTheme()"
                class="p-2 rounded-lg transition-colors"
                [class.bg-gray-700]="isDark" [class.hover:bg-gray-600]="isDark"
                [class.bg-gray-100]="!isDark" [class.hover:bg-gray-200]="!isDark">
          <span>{{ isDark ? '☀️' : '🌙' }}</span>
        </button>
        <button (click)="logout()"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                       bg-red-600 hover:bg-red-700 text-white">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          <span class="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- ── Status Summary Cards ── -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8" *ngIf="statusCounts$ | async as counts">
      <div class="rounded-xl p-4 transition-colors"
           [class.bg-gray-800]="isDark" [class.bg-white]="!isDark">
        <p class="text-2xl font-bold text-indigo-500">{{ counts.total }}</p>
        <p class="text-xs mt-1" [class.text-gray-400]="isDark" [class.text-gray-500]="!isDark">Total Tasks</p>
        <!-- Progress Bar -->
        <div class="mt-2 h-1.5 rounded-full bg-gray-700 overflow-hidden">
          <div class="h-full bg-indigo-500 rounded-full transition-all duration-500"
               [style.width]="counts.total ? '100%' : '0%'"></div>
        </div>
      </div>
      <div class="rounded-xl p-4" [class.bg-gray-800]="isDark" [class.bg-white]="!isDark">
        <p class="text-2xl font-bold text-yellow-500">{{ counts.todo }}</p>
        <p class="text-xs mt-1" [class.text-gray-400]="isDark" [class.text-gray-500]="!isDark">To Do</p>
        <div class="mt-2 h-1.5 rounded-full overflow-hidden" [class.bg-gray-700]="isDark" [class.bg-gray-200]="!isDark">
          <div class="h-full bg-yellow-500 rounded-full transition-all duration-500"
               [style.width]="counts.total ? (counts.todo / counts.total * 100) + '%' : '0%'"></div>
        </div>
      </div>
      <div class="rounded-xl p-4" [class.bg-gray-800]="isDark" [class.bg-white]="!isDark">
        <p class="text-2xl font-bold text-blue-500">{{ counts.in_progress }}</p>
        <p class="text-xs mt-1" [class.text-gray-400]="isDark" [class.text-gray-500]="!isDark">In Progress</p>
        <div class="mt-2 h-1.5 rounded-full overflow-hidden" [class.bg-gray-700]="isDark" [class.bg-gray-200]="!isDark">
          <div class="h-full bg-blue-500 rounded-full transition-all duration-500"
               [style.width]="counts.total ? (counts.in_progress / counts.total * 100) + '%' : '0%'"></div>
        </div>
      </div>
      <div class="rounded-xl p-4" [class.bg-gray-800]="isDark" [class.bg-white]="!isDark">
        <p class="text-2xl font-bold text-green-500">{{ counts.done }}</p>
        <p class="text-xs mt-1" [class.text-gray-400]="isDark" [class.text-gray-500]="!isDark">Done</p>
        <div class="mt-2 h-1.5 rounded-full overflow-hidden" [class.bg-gray-700]="isDark" [class.bg-gray-200]="!isDark">
          <div class="h-full bg-green-500 rounded-full transition-all duration-500"
               [style.width]="counts.total ? (counts.done / counts.total * 100) + '%' : '0%'"></div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- ── Left: Task List ── -->
      <div class="lg:col-span-2">
        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="🔍 Search tasks..."
            (input)="onSearch($event)"
            class="flex-1 min-w-48 px-4 py-2 rounded-xl border text-sm outline-none"
            [class.bg-gray-800]="isDark" [class.border-gray-700]="isDark"
            [class.text-white]="isDark" [class.placeholder-gray-500]="isDark"
            [class.bg-white]="!isDark" [class.border-gray-300]="!isDark"
            [class.text-gray-900]="!isDark"
          />
          <select (change)="onStatusFilter($event)"
                  class="px-3 py-2 rounded-xl border text-sm outline-none"
                  [class.bg-gray-800]="isDark" [class.border-gray-700]="isDark"
                  [class.text-white]="isDark"
                  [class.bg-white]="!isDark" [class.border-gray-300]="!isDark">
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select (change)="onCategoryFilter($event)"
                  class="px-3 py-2 rounded-xl border text-sm outline-none"
                  [class.bg-gray-800]="isDark" [class.border-gray-700]="isDark"
                  [class.text-white]="isDark"
                  [class.bg-white]="!isDark" [class.border-gray-300]="!isDark">
            <option value="">All Categories</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="other">Other</option>
          </select>
          <button (click)="openCreateModal()"
                  class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700
                         text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            New Task
          </button>
        </div>

        <!-- Loading -->
        <div *ngIf="loading$ | async" class="flex justify-center py-12">
          <div class="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>

        <!-- Empty state -->
        <div *ngIf="!(loading$ | async) && (tasks$ | async)?.length === 0"
             class="text-center py-16 rounded-2xl"
             [class.bg-gray-800]="isDark" [class.bg-white]="!isDark">
          <div class="text-6xl mb-4">📋</div>
          <p class="font-semibold" [class.text-white]="isDark" [class.text-gray-900]="!isDark">No tasks yet</p>
          <p class="text-sm mt-1" [class.text-gray-400]="isDark" [class.text-gray-500]="!isDark">
            Create your first task to get started
          </p>
        </div>

        <!-- Drag-and-drop task list -->
        <div *ngIf="!(loading$ | async) && (tasks$ | async)?.length! > 0"
             cdkDropList
             (cdkDropListDropped)="onDrop($event)"
             class="space-y-3">
          <div *ngFor="let task of tasks$ | async; trackBy: trackById"
               cdkDrag
               [cdkDragData]="task"
               class="group rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md"
               [class.bg-gray-800]="isDark" [class.border-gray-700]="isDark" [class.hover:border-indigo-500]="isDark"
               [class.bg-white]="!isDark" [class.border-gray-200]="!isDark" [class.hover:border-indigo-400]="!isDark"
               [class.ring-2]="(selectedTask$ | async)?.id === task.id"
               [class.ring-indigo-500]="(selectedTask$ | async)?.id === task.id"
               (click)="selectTask(task)">

            <!-- Drag handle -->
            <div cdkDragHandle class="absolute -left-0 top-0 bottom-0 w-4 flex items-center justify-center
                                       opacity-0 group-hover:opacity-100 cursor-grab transition-opacity">
              <svg class="w-3 h-3" [class.text-gray-500]="isDark" [class.text-gray-400]="!isDark"
                   fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
              </svg>
            </div>

            <div class="flex items-start justify-between gap-3 relative">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span [class]="getStatusClass(task.status)"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                    {{ getStatusLabel(task.status) }}
                  </span>
                  <span [class]="getCategoryClass(task.category)"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                    {{ task.category }}
                  </span>
                  <span *ngIf="task.priority > 0"
                        class="text-xs text-orange-500 font-medium">
                    P{{ task.priority }}
                  </span>
                </div>
                <h3 class="mt-1.5 font-semibold text-sm truncate"
                    [class.text-white]="isDark" [class.text-gray-900]="!isDark">
                  {{ task.title }}
                </h3>
                <p *ngIf="task.description"
                   class="text-xs mt-0.5 line-clamp-1"
                   [class.text-gray-400]="isDark" [class.text-gray-500]="!isDark">
                  {{ task.description }}
                </p>
                <p *ngIf="task.dueDate" class="text-xs mt-1"
                   [class.text-gray-500]="isDark" [class.text-gray-400]="!isDark">
                  📅 Due: {{ task.dueDate | date:'mediumDate' }}
                </p>
              </div>
              <!-- Actions -->
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button (click)="$event.stopPropagation(); editTask(task)"
                        class="p-1.5 rounded-lg transition-colors"
                        [class.hover:bg-gray-700]="isDark" [class.hover:bg-gray-100]="!isDark"
                        title="Edit">
                  <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button (click)="$event.stopPropagation(); deleteTask(task.id)"
                        class="p-1.5 rounded-lg transition-colors"
                        [class.hover:bg-gray-700]="isDark" [class.hover:bg-gray-100]="!isDark"
                        title="Delete">
                  <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Right: Task Detail / Create Form ── -->
      <div class="lg:col-span-1">
        <div class="sticky top-24 rounded-2xl p-6 transition-colors"
             [class.bg-gray-800]="isDark" [class.bg-white]="!isDark">

          <h2 class="font-bold text-lg mb-4"
              [class.text-white]="isDark" [class.text-gray-900]="!isDark">
            {{ isEditing ? 'Edit Task' : 'New Task' }}
          </h2>

          <form [formGroup]="taskForm" (ngSubmit)="onSubmitTask()">
            <!-- Title -->
            <div class="mb-3">
              <label class="block text-xs font-medium mb-1"
                     [class.text-gray-400]="isDark" [class.text-gray-600]="!isDark">Title *</label>
              <input formControlName="title" type="text"
                     class="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                     [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                     [class.bg-gray-50]="!isDark" [class.border-gray-300]="!isDark" [class.text-gray-900]="!isDark"
                     placeholder="Task title"/>
            </div>

            <!-- Description -->
            <div class="mb-3">
              <label class="block text-xs font-medium mb-1"
                     [class.text-gray-400]="isDark" [class.text-gray-600]="!isDark">Description</label>
              <textarea formControlName="description" rows="3"
                        class="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                        [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                        [class.bg-gray-50]="!isDark" [class.border-gray-300]="!isDark" [class.text-gray-900]="!isDark"
                        placeholder="Optional description"></textarea>
            </div>

            <!-- Status + Category -->
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label class="block text-xs font-medium mb-1"
                       [class.text-gray-400]="isDark" [class.text-gray-600]="!isDark">Status</label>
                <select formControlName="status"
                        class="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                        [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                        [class.bg-gray-50]="!isDark" [class.border-gray-300]="!isDark">
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium mb-1"
                       [class.text-gray-400]="isDark" [class.text-gray-600]="!isDark">Category</label>
                <select formControlName="category"
                        class="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                        [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                        [class.bg-gray-50]="!isDark" [class.border-gray-300]="!isDark">
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <!-- Priority + Due Date -->
            <div class="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label class="block text-xs font-medium mb-1"
                       [class.text-gray-400]="isDark" [class.text-gray-600]="!isDark">Priority (0-5)</label>
                <input formControlName="priority" type="number" min="0" max="5"
                       class="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                       [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                       [class.bg-gray-50]="!isDark" [class.border-gray-300]="!isDark"/>
              </div>
              <div>
                <label class="block text-xs font-medium mb-1"
                       [class.text-gray-400]="isDark" [class.text-gray-600]="!isDark">Due Date</label>
                <input formControlName="dueDate" type="date"
                       class="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                       [class.bg-gray-700]="isDark" [class.border-gray-600]="isDark" [class.text-white]="isDark"
                       [class.bg-gray-50]="!isDark" [class.border-gray-300]="!isDark"/>
              </div>
            </div>

            <div class="flex gap-2">
              <button type="submit"
                      [disabled]="taskForm.invalid"
                      class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                             text-white text-sm font-semibold rounded-xl transition-colors">
                {{ isEditing ? 'Update Task' : 'Create Task' }}
              </button>
              <button *ngIf="isEditing" type="button" (click)="cancelEdit()"
                      class="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                      [class.bg-gray-700]="isDark" [class.text-gray-300]="isDark"
                      [class.bg-gray-100]="!isDark" [class.text-gray-700]="!isDark">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </main>
</div>
  `,
})
export class DashboardComponent implements OnInit {
  tasks$: Observable<ITask[]>;
  loading$: Observable<boolean>;
  selectedTask$: Observable<ITask | null>;
  statusCounts$: Observable<any>;
  currentUser$: Observable<any>;

  taskForm: FormGroup;
  isEditing = false;
  editingId: string | null = null;

  get isDark() {
    return this.themeService.isDark();
  }

  constructor(
    private store: Store,
    private fb: FormBuilder,
    private themeService: ThemeService,
  ) {
    this.tasks$ = this.store.select(selectOrderedTasks);
    this.loading$ = this.store.select(selectTasksLoading);
    this.selectedTask$ = this.store.select(selectSelectedTask);
    this.statusCounts$ = this.store.select(selectTaskStatusCounts);
    this.currentUser$ = this.store.select(selectCurrentUser);
    this.taskForm = this.buildForm();
  }

  ngOnInit() {
    this.store.dispatch(TasksActions.loadTasks({}));
  }

  buildForm(task?: ITask): FormGroup {
    return this.fb.group({
      title: [task?.title ?? '', Validators.required],
      description: [task?.description ?? ''],
      status: [task?.status ?? TaskStatus.TODO],
      category: [task?.category ?? TaskCategory.WORK],
      priority: [task?.priority ?? 0],
      dueDate: [task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''],
    });
  }

  onSubmitTask() {
    if (this.taskForm.invalid) return;
    const value = this.taskForm.value;
    if (value.dueDate === '') delete value.dueDate;

    if (this.isEditing && this.editingId) {
      this.store.dispatch(TasksActions.updateTask({ id: this.editingId, dto: value }));
    } else {
      this.store.dispatch(TasksActions.createTask({ dto: value }));
    }
    this.resetForm();
  }

  editTask(task: ITask) {
    this.isEditing = true;
    this.editingId = task.id;
    this.taskForm = this.buildForm(task);
    this.store.dispatch(TasksActions.selectTask({ task }));
  }

  deleteTask(id: string) {
    if (confirm('Delete this task?')) {
      this.store.dispatch(TasksActions.deleteTask({ id }));
    }
  }

  selectTask(task: ITask) {
    this.store.dispatch(TasksActions.selectTask({ task }));
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingId = null;
    this.taskForm = this.buildForm();
    this.store.dispatch(TasksActions.selectTask({ task: null }));
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingId = null;
    this.taskForm = this.buildForm();
  }

  resetForm() {
    this.isEditing = false;
    this.editingId = null;
    this.taskForm = this.buildForm();
  }

  onDrop(event: CdkDragDrop<ITask[]>) {
    // Get current ordered list and reorder it
    this.tasks$.subscribe((tasks) => {
      const ids = [...tasks.map((t) => t.id)];
      moveItemInArray(ids, event.previousIndex, event.currentIndex);
      this.store.dispatch(TasksActions.reorderTasks({ taskIds: ids }));
    }).unsubscribe();
  }

  onSearch(event: Event) {
    const search = (event.target as HTMLInputElement).value;
    this.store.dispatch(TasksActions.setFilter({ filters: { search } }));
    this.store.dispatch(TasksActions.loadTasks({ filters: { search } }));
  }

  onStatusFilter(event: Event) {
    const status = (event.target as HTMLSelectElement).value as any;
    this.store.dispatch(TasksActions.loadTasks({ filters: { status: status || undefined } }));
  }

  onCategoryFilter(event: Event) {
    const category = (event.target as HTMLSelectElement).value as any;
    this.store.dispatch(TasksActions.loadTasks({ filters: { category: category || undefined } }));
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }

  trackById(_: number, task: ITask) {
    return task.id;
  }

  getStatusLabel(status: TaskStatus): string {
    return { todo: '○ To Do', in_progress: '◐ In Progress', done: '● Done' }[status] ?? status;
  }

  getStatusClass(status: TaskStatus): string {
    return {
      todo: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      done: 'bg-green-100 text-green-700',
    }[status] ?? '';
  }

  getCategoryClass(category: TaskCategory): string {
    return {
      work: 'bg-purple-100 text-purple-700',
      personal: 'bg-pink-100 text-pink-700',
      other: 'bg-gray-100 text-gray-700',
    }[category] ?? '';
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ITask, CreateTaskDto, UpdateTaskDto, TaskFilterDto } from '@mmulpuri/data';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TasksApiService {
  private base = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getAll(filters?: TaskFilterDto): Observable<ITask[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.search) params = params.set('search', filters.search);
    return this.http.get<ITask[]>(this.base, { params });
  }

  getOne(id: string): Observable<ITask> {
    return this.http.get<ITask>(`${this.base}/${id}`);
  }

  create(dto: CreateTaskDto): Observable<ITask> {
    return this.http.post<ITask>(this.base, dto);
  }

  update(id: string, dto: UpdateTaskDto): Observable<ITask> {
    return this.http.put<ITask>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

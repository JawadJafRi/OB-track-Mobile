import { apiRequest } from './client';
import type {
  Employee,
  LocationBatchItem,
  LocationFix,
  Paginated,
  Task,
  TaskStats,
  TaskStatus,
} from './types';

/**
 * Task endpoints, all scoped to the signed-in office boy by the server.
 *
 * Every write that the device might retry (create, location batches) carries a
 * client-generated UUID; the backend upserts on it, so a request replayed after
 * a lost response is harmless rather than duplicating work.
 */

export type CreateTaskInput = {
  clientTaskId: string;
  description: string;
  title?: string;
  destination?: string;
  employeeId?: string;
};

export function createTask(input: CreateTaskInput): Promise<Task> {
  return apiRequest<Task>('/tasks', { method: 'POST', body: input });
}

export type ListTasksParams = {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  from?: string;
  to?: string;
  search?: string;
};

export function listTasks(params: ListTasksParams = {}): Promise<Paginated<Task>> {
  const query = new URLSearchParams();

  // Skip undefined/empty so we never send `?status=` and trip @IsEnum.
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const qs = query.toString();
  return apiRequest<Paginated<Task>>(`/tasks${qs ? `?${qs}` : ''}`);
}

export function getTask(id: string): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}`);
}

export function getStats(): Promise<TaskStats> {
  return apiRequest<TaskStats>('/tasks/stats');
}

export function startTask(id: string, fix: LocationFix): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}/start`, { method: 'POST', body: fix });
}

export function endTask(id: string, fix: LocationFix): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}/end`, { method: 'POST', body: fix });
}

export function cancelTask(
  id: string,
  cancellationReason: string,
  fix?: Partial<LocationFix>,
): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}/cancel`, {
    method: 'POST',
    body: { cancellationReason, ...fix },
  });
}

export type AddLocationsResult = { received: number; accepted: number };

export function addLocations(
  id: string,
  points: LocationBatchItem[],
): Promise<AddLocationsResult> {
  return apiRequest<AddLocationsResult>(`/tasks/${id}/locations`, {
    method: 'POST',
    body: { points },
  });
}

export type SettlementInput = {
  amountReceived?: number;
  amountReturned?: number;
  vendorDetails?: string;
};

export function updateSettlement(
  id: string,
  input: SettlementInput,
): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}/settlement`, {
    method: 'PATCH',
    body: input,
  });
}

export function submitTask(id: string): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}/submit`, { method: 'POST' });
}

/**
 * The Top 10 employee picker. GET /employees is deliberately not admin-only —
 * an office boy needs it to attribute a task.
 */
export function listEmployees(): Promise<Paginated<Employee>> {
  return apiRequest<Paginated<Employee>>('/employees?isActive=true&limit=100');
}

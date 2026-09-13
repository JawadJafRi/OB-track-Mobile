/**
 * Shapes returned by the OB Track backend.
 *
 * These mirror TASK_SELECT / toTaskResponse in the backend's tasks.service.ts.
 * Money fields arrive as numbers (the server converts Prisma Decimals before
 * serialising), and every timestamp is an ISO-8601 UTC string.
 */

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type Employee = {
  id: string;
  name: string;
  department: string | null;
};

export type TaskReceipt = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export type Task = {
  id: string;
  clientTaskId: string;
  title: string | null;
  description: string;
  destination: string | null;
  status: TaskStatus;
  officeBoyId: string;
  startedAt: string | null;
  endedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  startLatitude: number | null;
  startLongitude: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  amountReceived: number;
  amountReturned: number;
  netAmount: number;
  vendorDetails: string | null;
  submittedAt: string | null;
  employeeId: string | null;
  employee: Employee | null;
  receipt: TaskReceipt | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type Paginated<T> = {
  items: T[];
  meta: PaginationMeta;
};

/**
 * GET /tasks/stats. The home screen header uses the `today*` fields — the
 * `total*` ones are lifetime figures, which belong on the profile screen.
 */
export type TaskStats = {
  tasks: { total: number; PENDING: number; IN_PROGRESS: number; COMPLETED: number; CANCELLED: number };
  completedToday: number;
  pendingSubmission: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  todayDistanceMeters: number;
  todayDurationSeconds: number;
  totalAmountReceived: number;
  totalAmountReturned: number;
  netAmount: number;
  reimbursementAmount: number;
};

/** A GPS fix in the shape the backend's LocationPointDto expects. */
export type LocationFix = {
  latitude: number;
  longitude: number;
  recordedAt: string;
};

/** One streamed point — LocationBatchItemDto. Richer than a plain fix. */
export type LocationBatchItem = LocationFix & {
  clientId: string;
  accuracyMeters?: number;
  altitudeMeters?: number;
  speedMetersPerSecond?: number;
  headingDegrees?: number;
  isMoving?: boolean;
};

/**
 * Database initialization states
 */
export enum DBInitState {
  /** Database initialization in progress (migrations, data import) */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Database initialization completed successfully */
  DONE = 'DONE',
  /** Database initialization failed with error */
  ERROR = 'ERROR',
}

/**
 * Callback for database initialization progress updates
 */
export type DBInitCallback = (state: DBInitState, error?: string) => void;

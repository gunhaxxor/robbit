interface socketAck {
  status: 'success' | 'error';
  errorMessage?: string;
  message?: string;
  data?: unknown;
}
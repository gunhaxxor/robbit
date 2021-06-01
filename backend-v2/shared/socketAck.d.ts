// interface socketAck {
//   status: 'success' | 'error';
//   errorMessage?: string;
//   message?: string;
//   data?: unknown;
// }

type socketData = Record<string, unknown> | string;

interface socketSuccess {
  status: 'success';
  message: string;
  data?: socketData;
} 

interface socketError{
  status: 'error';
  errorMessage: string;
  data?: socketData
}

type SocketAck = socketSuccess | socketError;
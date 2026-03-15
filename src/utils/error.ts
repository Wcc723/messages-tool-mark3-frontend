import type { AxiosError } from 'axios'

interface ApiErrorData {
  message?: string
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const axiosErr = err as AxiosError<ApiErrorData>
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message
    }
    if ('message' in err && typeof (err as Error).message === 'string') {
      return (err as Error).message
    }
  }
  return fallback
}

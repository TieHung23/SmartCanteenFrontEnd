export type LogLevel = "INFO" | "ERROR" | "DEBUG";
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface LogListItem {
  id: string;
  logLevel: LogLevel;
  apiUrl: string;
  apiMethod: HttpMethod;
  message: string;
  statusCode: number;
  localIpAddress: string;
  requestId: string;
  createdDate: string;
  endDate: string;
}

export interface LogDetail {
  id: string;
  loginId: string | null;
  logLevel: LogLevel;
  apiUrl: string;
  apiMethod: HttpMethod;
  apiBody: string | null;
  apiResponse: string | null;
  message: string;
  statusCode: number;
  errorTrace: string | null;
  localIpAddress: string;
  requestId: string;
  createdDate: string;
  endDate: string;
}

export interface LogFilterParams {
  pageNumber?: number;
  pageSize?: number;
  logLevel?: string;
  method?: string;
  url?: string;
  statusCodeMin?: number;
  fromDate?: string;
  toDate?: string;
}

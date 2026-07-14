export class ApiResponseDto<T> {
  success!: boolean;
  message!: string;
  data!: T;
  meta?: unknown;
  errors?: unknown;
}
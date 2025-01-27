import { CustomError } from "./custom-error";

export class BadRequestError extends CustomError {
  statusCode = 400;
  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
  serializeError(): { message: string; field?: string }[] {
    return [{ message: this.message }];
  }
}

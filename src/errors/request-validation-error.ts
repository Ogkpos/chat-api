import { ValidationError } from "express-validator";
import { CustomError } from "./custom-error";

export class RequestValidationError extends CustomError {
  statusCode = 400;
  constructor(public errors: ValidationError[]) {
    super("Invalid request parameter");
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }
  serializeError(): { message: string; field?: string }[] {
    return this.errors.map((err) => {
      return {
        message: err.msg,
        field: "path" in err ? err.path : undefined,
      };
    });
  }
}

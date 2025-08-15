import { CoreError } from 'tydet-core'

export class IcmError extends CoreError {

  constructor(message?: string, err?: any) {
    super();
    Object.setPrototypeOf(this, IcmError.prototype);
    this.name = this.constructor.name
    this.message = message
    if (err != null) {
      if (err instanceof Error) {
        this.message += ("\n" + err.message)
        this.message += ("\n" + err.stack)
      } else {
        this.message += err
      }
    }
    if (Error.captureStackTrace) Error.captureStackTrace(this, IcmError);
  }
}
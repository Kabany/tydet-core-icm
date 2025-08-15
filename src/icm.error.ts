import { CoreError } from 'tydet-core'

export class IcmError extends CoreError {

  constructor(message?: string) {
    super();
    Object.setPrototypeOf(this, IcmError.prototype);
    this.name = this.constructor.name
    this.message = message
    if (Error.captureStackTrace) Error.captureStackTrace(this, IcmError);
  }
}
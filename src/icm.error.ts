import { AxiosError } from 'axios';
import { CoreError } from 'tydet-core'

export class IcmError extends CoreError {

  constructor(message?: string, err?: any) {
    super();
    Object.setPrototypeOf(this, IcmError.prototype);
    this.name = this.constructor.name
    this.message = message
    if (err != null) {
      if (err instanceof AxiosError) {
        if (err.response.data != null) {
          this.message += (`\nServer response:\nCode: ${err.response.data.code}\nMessage: ${err.response.data.message}`)
          if (err.response.data.errorBody) {
            this.message += `\nErrors: ${err.response.data.errorBody}`
          }
        } else {
          this.message += (`\n${err.message}`)
        }
      } else if (err instanceof Error) {
        this.message += ("\n" + err.message)
        this.message += ("\n" + err.stack)
      } else {
        this.message += err
      }
    }
    if (Error.captureStackTrace) Error.captureStackTrace(this, IcmError);
  }
}
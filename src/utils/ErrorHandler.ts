class ErrorHandler extends Error {
  statusCode: number;
  name : string
  constructor(message: string,statusCode: number, name : string = "" ) {
    super(message);
    this.statusCode = statusCode;
    this.name = name

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler


    /*-----------------------------------------------*
    *                                                *
    *                    GLOBAL                      *
    *                                                *
    *------------------------------------------------*/
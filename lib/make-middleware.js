import is from 'type-is'
import Busboy from 'busboy'
import extend from 'xtend'
import onFinished from 'on-finished'
import appendField from 'append-field'

import Counter from './counter.js'
import MulterError from './multer-error.js'
import FileAppender from './file-appender.js'
import removeUploadedFiles from './remove-uploaded-files.js'

function drainStream (stream) {
  stream.on('readable', stream.read.bind(stream))
}

function makeMiddleware (setup) {
  return function multerMiddleware (req, res, next) {
    if (!is(req, ['multipart'])) return next()

    const options = setup()

    const limits = options.limits
    const storage = options.storage
    const fileFilter = options.fileFilter
    const fileStrategy = options.fileStrategy
    const preservePath = options.preservePath

    req.body = Object.create(null)

    let busboy

    try {
      busboy = new Busboy({ headers: req.headers, limits: limits, preservePath: preservePath })
    } catch (err) {
      return next(err)
    }

    const appender = new FileAppender(fileStrategy, req)
    let isDone = false
    let readFinished = false
    let errorOccured = false
    const pendingWrites = new Counter()
    const uploadedFiles = []

    function done (err) {
      if (isDone) return
      isDone = true

      req.unpipe(busboy)
      drainStream(req)
      busboy.removeAllListeners()

      onFinished(req, function () { next(err) })
    }

    function indicateDone () {
      if (readFinished && pendingWrites.isZero() && !errorOccured) done()
    }

    function abortWithError (uploadError) {
      if (errorOccured) return
      errorOccured = true

      pendingWrites.onceZero(function () {
        function remove (file, cb) {
          storage._removeFile(req, file, cb)
        }

        removeUploadedFiles(uploadedFiles, remove, function (err, storageErrors) {
          if (err) return done(err)

          uploadError.storageErrors = storageErrors
          done(uploadError)
        })
      })
    }

    function abortWithCode (code, optionalField) {
      abortWithError(new MulterError(code, optionalField))
    }

    // handle text field data
    busboy.on('field', function (fieldname, value, fieldnameTruncated, valueTruncated) {
      if (fieldnameTruncated) return abortWithCode('LIMIT_FIELD_KEY')
      if (valueTruncated) return abortWithCode('LIMIT_FIELD_VALUE', fieldname)

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && Object.prototype.hasOwnProperty.call(limits, 'fieldNameSize')) {
        if (fieldname.length > limits.fieldNameSize) return abortWithCode('LIMIT_FIELD_KEY')
      }

      appendField(req.body, fieldname, value)
    })

    // handle files
    busboy.on('file', function (fieldname, fileStream, filename, encoding, mimetype) {
      // don't attach to the files object, if there is no file
      if (!filename) return fileStream.resume()

      // Work around bug in Busboy (https://github.com/mscdex/busboy/issues/6)
      if (limits && Object.prototype.hasOwnProperty.call(limits, 'fieldNameSize')) {
        if (fieldname.length > limits.fieldNameSize) return abortWithCode('LIMIT_FIELD_KEY')
      }

      const file = {
        fieldname: fieldname,
        originalname: filename,
        encoding: encoding,
        mimetype: mimetype
      }

      const placeholder = appender.insertPlaceholder(file)

      fileFilter(req, file, function (err, includeFile) {
        if (err) {
          appender.removePlaceholder(placeholder)
          return abortWithError(err)
        }

        if (!includeFile) {
          appender.removePlaceholder(placeholder)
          return fileStream.resume()
        }

        let aborting = false
        pendingWrites.increment()

        Object.defineProperty(file, 'stream', {
          configurable: true,
          enumerable: false,
          value: fileStream
        })

        fileStream.on('error', function (err) {
          pendingWrites.decrement()
          abortWithError(err)
        })

        fileStream.on('limit', function () {
          aborting = true
          abortWithCode('LIMIT_FILE_SIZE', fieldname)
        })

        storage._handleFile(req, file, function (err, info) {
          if (aborting) {
            appender.removePlaceholder(placeholder)
            uploadedFiles.push(extend(file, info))
            return pendingWrites.decrement()
          }

          if (err) {
            appender.removePlaceholder(placeholder)
            pendingWrites.decrement()
            return abortWithError(err)
          }

          const fileInfo = extend(file, info)

          appender.replacePlaceholder(placeholder, fileInfo)
          uploadedFiles.push(fileInfo)
          pendingWrites.decrement()
          indicateDone()
        })
      })
    })

    busboy.on('error', function (err) { abortWithError(err) })
    busboy.on('partsLimit', function () { abortWithCode('LIMIT_PART_COUNT') })
    busboy.on('filesLimit', function () { abortWithCode('LIMIT_FILE_COUNT') })
    busboy.on('fieldsLimit', function () { abortWithCode('LIMIT_FIELD_COUNT') })
    busboy.on('finish', function () {
      readFinished = true
      indicateDone()
    })

    req.pipe(busboy)
  }
}

export default makeMiddleware

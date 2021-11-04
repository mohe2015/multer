import { createWriteStream, mkdirSync, unlink } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'

function getFilename (req, file, cb) {
  randomBytes(16, function (err, raw) {
    cb(err, err ? undefined : raw.toString('hex'))
  })
}

function getDestination (req, file, cb) {
  cb(null, tmpdir())
}

class DiskStorage {
  constructor (opts) {
    this.getFilename = (opts.filename || getFilename)

    if (typeof opts.destination === 'string') {
      mkdirSync(opts.destination, { recursive: true })
      this.getDestination = function ($0, $1, cb) { cb(null, opts.destination) }
    } else {
      this.getDestination = (opts.destination || getDestination)
    }
  }

  _handleFile (req, file, cb) {
    const that = this

    that.getDestination(req, file, function (err, destination) {
      if (err) { return cb(err) }

      that.getFilename(req, file, function (err, filename) {
        if (err) { return cb(err) }

        const finalPath = join(destination, filename)
        const outStream = createWriteStream(finalPath)

        file.stream.pipe(outStream)
        outStream.on('error', cb)
        outStream.on('finish', function () {
          cb(null, {
            destination: destination,
            filename: filename,
            path: finalPath,
            size: outStream.bytesWritten
          })
        })
      })
    })
  }

  _removeFile (req, file, cb) {
    const path = file.path

    delete file.destination
    delete file.filename
    delete file.path

    unlink(path, cb)
  }
}

export default function (opts) {
  return new DiskStorage(opts)
}

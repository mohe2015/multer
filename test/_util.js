import { createReadStream, statSync } from 'fs'
import path, { join } from 'path'
import { PassThrough } from 'stream'
import onFinished from 'on-finished'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function file (name) {
  return createReadStream(join(__dirname, 'files', name))
}

export function fileSize (path) {
  return statSync(path).size
}

export function submitForm (multer, form, cb) {
  form.getLength(function (err, length) {
    if (err) return cb(err)

    const req = new PassThrough()

    req.complete = false
    form.once('end', function () {
      req.complete = true
    })

    form.pipe(req)
    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
      'content-length': length
    }

    multer(req, null, function (err) {
      onFinished(req, function () { cb(err, req) })
    })
  })
}

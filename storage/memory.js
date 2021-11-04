import concat from 'concat-stream'

class MemoryStorage {
  _handleFile (req, file, cb) {
    file.stream.pipe(concat({ encoding: 'buffer' }, function (data) {
      cb(null, {
        buffer: data,
        size: data.length
      })
    }))
  }

  _removeFile (req, file, cb) {
    delete file.buffer
    cb(null)
  }
}

export default function (opts) {
  return new MemoryStorage(opts)
}

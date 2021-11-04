/* eslint-env mocha */

import { ifError, strictEqual } from 'assert'

import { basename } from 'path'
import { file as _file, submitForm, fileSize } from './_util.js'
import multer, { diskStorage } from '../index.js'
import { mkdir } from 'fs-temp'
import rimraf from 'rimraf'
import FormData from 'form-data'

describe('Unicode', function () {
  let uploadDir, upload

  beforeEach(function (done) {
    mkdir(function (err, path) {
      if (err) return done(err)

      const storage = diskStorage({
        destination: path,
        filename: function (req, file, cb) {
          cb(null, file.originalname)
        }
      })

      uploadDir = path
      upload = multer({ storage: storage })
      done()
    })
  })

  afterEach(function (done) {
    rimraf(uploadDir, done)
  })

  it('should handle unicode filenames', function (done) {
    const form = new FormData()
    const parser = upload.single('small0')
    const filename = '\ud83d\udca9.dat'

    form.append('small0', _file('small0.dat'), { filename: filename })

    submitForm(parser, form, function (err, req) {
      ifError(err)

      strictEqual(basename(req.file.path), filename)
      strictEqual(req.file.originalname, filename)

      strictEqual(req.file.fieldname, 'small0')
      strictEqual(req.file.size, 1778)
      strictEqual(fileSize(req.file.path), 1778)

      done()
    })
  })
})

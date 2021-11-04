/* eslint-env mocha */

import { ok, strictEqual } from 'assert'

import { file, submitForm } from './_util.js'
import multer from '../index.js'
import { mkdir } from 'fs-temp'
import rimraf from 'rimraf'
import FormData from 'form-data'

describe('Issue #232', function () {
  let uploadDir, upload

  before(function (done) {
    mkdir(function (err, path) {
      if (err) return done(err)

      uploadDir = path
      upload = multer({ dest: path, limits: { fileSize: 100 } })
      done()
    })
  })

  after(function (done) {
    rimraf(uploadDir, done)
  })

  it('should report limit errors', function (done) {
    const form = new FormData()
    const parser = upload.single('file')

    form.append('file', file('large.jpg'))

    submitForm(parser, form, function (err, req) {
      ok(err, 'an error was given')

      strictEqual(err.code, 'LIMIT_FILE_SIZE')
      strictEqual(err.field, 'file')

      done()
    })
  })
})

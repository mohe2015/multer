/* eslint-env mocha */

import { ok, strictEqual, ifError } from 'assert'

import { file, submitForm } from './_util.js'
import multer from '../index.js'
import FormData from 'form-data'

describe('None', function () {
  let parser

  before(function () {
    parser = multer().none()
  })

  it('should not allow file uploads', function (done) {
    const form = new FormData()

    form.append('key1', 'val1')
    form.append('key2', 'val2')
    form.append('file', file('small0.dat'))

    submitForm(parser, form, function (err, req) {
      ok(err)
      strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
      strictEqual(req.files, undefined)
      strictEqual(req.body.key1, 'val1')
      strictEqual(req.body.key2, 'val2')
      done()
    })
  })

  it('should handle text fields', function (done) {
    const form = new FormData()

    form.append('key1', 'val1')
    form.append('key2', 'val2')

    submitForm(parser, form, function (err, req) {
      ifError(err)
      strictEqual(req.files, undefined)
      strictEqual(req.body.key1, 'val1')
      strictEqual(req.body.key2, 'val2')
      done()
    })
  })
})

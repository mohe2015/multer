/* eslint-env mocha */

import { ifError, strictEqual } from 'assert'

import { file as _file, submitForm } from './_util.js'
import multer from '../index.js'
import FormData from 'form-data'

function withFilter (fileFilter) {
  return multer({ fileFilter: fileFilter })
}

function skipSpecificFile (req, file, cb) {
  cb(null, file.fieldname !== 'notme')
}

function reportFakeError (req, file, cb) {
  cb(new Error('Fake error'))
}

describe('File Filter', function () {
  it('should skip some files', function (done) {
    const form = new FormData()
    const upload = withFilter(skipSpecificFile)
    const parser = upload.fields([
      { name: 'notme', maxCount: 1 },
      { name: 'butme', maxCount: 1 }
    ])

    form.append('notme', _file('tiny0.dat'))
    form.append('butme', _file('tiny1.dat'))

    submitForm(parser, form, function (err, req) {
      ifError(err)
      strictEqual(req.files.notme, undefined)
      strictEqual(req.files.butme[0].fieldname, 'butme')
      strictEqual(req.files.butme[0].originalname, 'tiny1.dat')
      strictEqual(req.files.butme[0].size, 7)
      strictEqual(req.files.butme[0].buffer.length, 7)
      done()
    })
  })

  it('should report errors from fileFilter', function (done) {
    const form = new FormData()
    const upload = withFilter(reportFakeError)
    const parser = upload.single('test')

    form.append('test', _file('tiny0.dat'))

    submitForm(parser, form, function (err, req) {
      strictEqual(err.message, 'Fake error')
      done()
    })
  })
})
